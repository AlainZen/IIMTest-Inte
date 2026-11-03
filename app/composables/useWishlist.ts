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
  load: () => Promise<void>
  has: (pokemonId: number) => boolean
  add: (pokemon: Pokemon) => Promise<AddOutcome>
  remove: (pokemonId: number) => Promise<boolean>
  rename: (pokemonId: number, nickname: string) => void
  displayName: (item: WishlistItem) => string
  setShowPrenoms: (value: boolean) => void
}

const ADD_REFUSALS: Record<string, (name: string) => string> = {
  duplicate: name => `${name} est déjà dans ta wishlist.`,
  full: () => `Ta wishlist est pleine : retire un Pokémon pour en ajouter un autre.`,
}

function refusalMessage(code: string, name: string): string {
  return ADD_REFUSALS[code]?.(name) ?? `${name} n'a pas été ajouté : l'API ne répond pas.`
}

export function useWishlist(): Wishlist {
  const apiBase = useRuntimeConfig().public.apiBase

  // useState partage les mêmes données entre toutes les pages.
  const items = useState<WishlistItem[]>('wishlist', () => [])
  const status = useState<WishlistStatus>('wishlist-status', () => 'loading')
  const nicknames = useState<Nicknames>('nicknames', readNicknames)
  const showPrenoms = useState<boolean>('show-prenoms', readShowPrenoms)

  const isFull = computed<boolean>(() => items.value.length >= MAX_WISHLIST_SIZE)

  async function load(): Promise<void> {
    status.value = 'loading'
    try {
      items.value = await fetchWishlist(apiBase)
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  function has(pokemonId: number): boolean {
    return items.value.some(item => item.pokemon.id === pokemonId)
  }

  async function add(pokemon: Pokemon): Promise<AddOutcome> {
    const rule = addPokemon(
      items.value.map(item => item.pokemon),
      pokemon,
    )
    if (!rule.ok) return { ok: false, message: refusalMessage(rule.reason, pokemon.name) }

    try {
      const item = await createWishlistItem(apiBase, pokemon)
      items.value = [...items.value, item]
      return { ok: true }
    } catch (error) {
      const code = error instanceof WishlistApiError ? error.code : 'server_error'

      // L'API a refusé : la liste affichée n'est plus à jour, on la relit.
      if (code in ADD_REFUSALS) await load()

      return { ok: false, message: refusalMessage(code, pokemon.name) }
    }
  }

  async function remove(pokemonId: number): Promise<boolean> {
    const item = items.value.find(entry => entry.pokemon.id === pokemonId)
    if (!item) return true

    try {
      await deleteWishlistItem(apiBase, item.id)
    } catch {
      return false
    }

    items.value = items.value.filter(entry => entry.id !== item.id)
    const { [pokemonId]: _removed, ...others } = nicknames.value
    nicknames.value = others
    saveNicknames(others)

    return true
  }

  function rename(pokemonId: number, nickname: string): void {
    const { [pokemonId]: _previous, ...others } = nicknames.value
    const cleanName = nickname.trim()

    nicknames.value = cleanName ? { ...others, [pokemonId]: cleanName } : others
    saveNicknames(nicknames.value)
  }

  function displayName(item: WishlistItem): string {
    const { id, name } = item.pokemon
    return nicknames.value[id] ?? (showPrenoms.value ? prenomOf(id) : name)
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
    load,
    has,
    add,
    remove,
    rename,
    displayName,
    setShowPrenoms,
  }
}
