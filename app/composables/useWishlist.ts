import type { Ref } from 'vue'
import type { Pokemon, WishlistItem } from '~/types/pokemon'
import type { Nicknames } from '~/utils/localPreferences'
import { WishlistApiError } from '~/utils/wishlistApi'

export type WishlistStatus = 'loading' | 'ready' | 'error'

export type AddOutcome = { ok: true } | { ok: false; message: string }

interface Wishlist {
  items: Ref<WishlistItem[]>
  status: Ref<WishlistStatus>
  showPrenoms: Ref<boolean>
  isFull: Ref<boolean>
  loadPreferences: () => void
  load: () => Promise<void>
  has: (pokemonId: number) => boolean
  add: (pokemon: Pokemon) => Promise<AddOutcome>
  remove: (pokemonId: number) => Promise<boolean>
  like: (pokemonId: number) => Promise<boolean>
  rename: (pokemonId: number, nickname: string) => void
  displayName: (item: WishlistItem) => string
  setShowPrenoms: (value: boolean) => void
}

const API_REFUSALS = ['duplicate', 'full']

export function useWishlist(): Wishlist {
  const apiBase = useRuntimeConfig().public.apiBase
  const { t, locale } = useLanguage()

  // useState partage les mêmes données entre toutes les pages.
  const items = useState<WishlistItem[]>('wishlist', () => [])
  const status = useState<WishlistStatus>('wishlist-status', () => 'loading')
  const nicknames = useState<Nicknames>('nicknames', () => ({}))
  const showPrenoms = useState<boolean>('show-prenoms', () => false)

  const isFull = computed<boolean>(() => items.value.length >= MAX_WISHLIST_SIZE)

  // Le localStorage n'existe que dans le navigateur : il est lu une fois la page affichée.
  function loadPreferences(): void {
    nicknames.value = readNicknames()
    showPrenoms.value = readShowPrenoms()
  }

  async function load(): Promise<void> {
    status.value = 'loading'
    try {
      items.value = await fetchWishlist(apiBase, locale.value)
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  function has(pokemonId: number): boolean {
    return items.value.some(item => item.pokemon.id === pokemonId)
  }

  async function add(pokemon: Pokemon): Promise<AddOutcome> {
    const name = localizedName(pokemon, locale.value)
    const rule = addPokemon(
      items.value.map(item => item.pokemon),
      pokemon,
    )
    if (!rule.ok) return { ok: false, message: t(`wishlist.${rule.reason}`, { name }) }

    try {
      const item = await createWishlistItem(apiBase, pokemon, locale.value)
      items.value = [...items.value, item]
      return { ok: true }
    } catch (error) {
      if (error instanceof WishlistApiError && API_REFUSALS.includes(error.code)) {
        // L'API a refusé : la liste affichée n'est plus à jour. Son message suit la langue choisie.
        await load()
        return { ok: false, message: error.message }
      }
      return { ok: false, message: t('wishlist.addFailed', { name }) }
    }
  }

  async function remove(pokemonId: number): Promise<boolean> {
    const item = items.value.find(entry => entry.pokemon.id === pokemonId)
    if (!item) return true

    try {
      await deleteWishlistItem(apiBase, item.id, locale.value)
    } catch {
      return false
    }

    items.value = items.value.filter(entry => entry.id !== item.id)
    const { [pokemonId]: _removed, ...others } = nicknames.value
    nicknames.value = others
    saveNicknames(others)

    return true
  }

  async function like(pokemonId: number): Promise<boolean> {
    const item = items.value.find(entry => entry.pokemon.id === pokemonId)
    if (!item) return false

    try {
      const updated = await likeWishlistItem(apiBase, item.id, locale.value)
      items.value = items.value.map(entry => (entry.id === updated.id ? updated : entry))
      return true
    } catch {
      return false
    }
  }

  function rename(pokemonId: number, nickname: string): void {
    const { [pokemonId]: _previous, ...others } = nicknames.value
    const cleanName = nickname.trim()

    nicknames.value = cleanName ? { ...others, [pokemonId]: cleanName } : others
    saveNicknames(nicknames.value)
  }

  function displayName(item: WishlistItem): string {
    const { pokemon } = item
    return (
      nicknames.value[pokemon.id] ??
      (showPrenoms.value ? prenomOf(pokemon.id) : localizedName(pokemon, locale.value))
    )
  }

  function setShowPrenoms(value: boolean): void {
    showPrenoms.value = value
    saveShowPrenoms(value)
  }

  return {
    items,
    status,
    showPrenoms,
    isFull,
    loadPreferences,
    load,
    has,
    add,
    remove,
    like,
    rename,
    displayName,
    setShowPrenoms,
  }
}
