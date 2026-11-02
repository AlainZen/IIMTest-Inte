import type { Ref } from 'vue'
import type { Pokemon, WishlistItem } from '~/types/pokemon'

const WISHLIST_KEY = 'inte:wishlist'
const PRENOMS_KEY = 'inte:show-prenoms'

interface Wishlist {
  items: Ref<WishlistItem[]>
  showPrenoms: Ref<boolean>
  has: (id: number) => boolean
  add: (pokemon: Pokemon) => void
  remove: (id: number) => void
  rename: (id: number, nickname: string) => void
  displayName: (item: WishlistItem) => string
  setShowPrenoms: (value: boolean) => void
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  }
  catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  }
  catch {
    // Stockage plein ou bloqué : la wishlist reste utilisable jusqu'au prochain rafraîchissement.
  }
}

function isWishlistItem(value: unknown): value is WishlistItem {
  const item = value as WishlistItem | null
  return typeof item?.addedAt === 'string'
    && typeof item.pokemon?.id === 'number'
    && typeof item.pokemon.speciesId === 'number'
    && typeof item.pokemon.name === 'string'
    && Array.isArray(item.pokemon.types)
}

function readWishlist(): WishlistItem[] {
  const saved = readJson(WISHLIST_KEY)
  return Array.isArray(saved) ? saved.filter(isWishlistItem) : []
}

export function useWishlist(): Wishlist {
  // useState partage les mêmes données entre toutes les pages.
  const items = useState<WishlistItem[]>('wishlist', readWishlist)
  const showPrenoms = useState<boolean>('show-prenoms', () => readJson(PRENOMS_KEY) === true)

  function save(next: WishlistItem[]): void {
    items.value = next
    writeJson(WISHLIST_KEY, next)
  }

  function has(id: number): boolean {
    return items.value.some(item => item.pokemon.id === id)
  }

  function add(pokemon: Pokemon): void {
    if (has(pokemon.id)) return
    save([{ pokemon, addedAt: new Date().toISOString() }, ...items.value])
  }

  function remove(id: number): void {
    save(items.value.filter(item => item.pokemon.id !== id))
  }

  function rename(id: number, nickname: string): void {
    const cleanName = nickname.trim() || undefined
    save(items.value.map(item => item.pokemon.id === id ? { ...item, nickname: cleanName } : item))
  }

  function displayName(item: WishlistItem): string {
    if (item.nickname) return item.nickname
    return showPrenoms.value ? prenomOf(item.pokemon.speciesId) : item.pokemon.name
  }

  function setShowPrenoms(value: boolean): void {
    showPrenoms.value = value
    writeJson(PRENOMS_KEY, value)
  }

  return { items, showPrenoms, has, add, remove, rename, displayName, setShowPrenoms }
}
