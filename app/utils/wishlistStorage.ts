import type { WishlistItem } from '~/types/pokemon'

export const WISHLIST_KEY = 'inte:wishlist'
export const PRENOMS_KEY = 'inte:show-prenoms'

// Le localStorage peut être modifié à la main, plein ou bloqué :
// une lecture ou une écriture ratée ne doit jamais faire planter l'application.
function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Stockage plein ou bloqué : la wishlist reste utilisable jusqu'au prochain rafraîchissement.
  }
}

export function isWishlistItem(value: unknown): value is WishlistItem {
  const item = value as WishlistItem | null
  const pokemon = item?.pokemon

  return (
    typeof item?.addedAt === 'string' &&
    (item.nickname === undefined || typeof item.nickname === 'string') &&
    typeof pokemon?.id === 'number' &&
    typeof pokemon.speciesId === 'number' &&
    typeof pokemon.name === 'string' &&
    (pokemon.image === null || typeof pokemon.image === 'string') &&
    Array.isArray(pokemon.types) &&
    pokemon.types.every(type => typeof type === 'string')
  )
}

export function readWishlist(): WishlistItem[] {
  const saved = readJson(WISHLIST_KEY)
  return Array.isArray(saved) ? saved.filter(isWishlistItem) : []
}

export function saveWishlist(items: WishlistItem[]): void {
  writeJson(WISHLIST_KEY, items)
}

export function readShowPrenoms(): boolean {
  return readJson(PRENOMS_KEY) === true
}

export function saveShowPrenoms(value: boolean): void {
  writeJson(PRENOMS_KEY, value)
}
