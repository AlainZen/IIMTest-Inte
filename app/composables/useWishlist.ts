import type { Ref } from 'vue'
import type { Pokemon, WishlistItem } from '~/types/pokemon'

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

export function useWishlist(): Wishlist {
  // useState partage les mêmes données entre toutes les pages.
  const items = useState<WishlistItem[]>('wishlist', readWishlist)
  const showPrenoms = useState<boolean>('show-prenoms', readShowPrenoms)

  function update(next: WishlistItem[]): void {
    items.value = next
    saveWishlist(next)
  }

  function has(id: number): boolean {
    return items.value.some(item => item.pokemon.id === id)
  }

  function add(pokemon: Pokemon): void {
    if (has(pokemon.id)) return
    update([{ pokemon, addedAt: new Date().toISOString() }, ...items.value])
  }

  function remove(id: number): void {
    update(items.value.filter(item => item.pokemon.id !== id))
  }

  function rename(id: number, nickname: string): void {
    const cleanName = nickname.trim() || undefined
    update(
      items.value.map(item => (item.pokemon.id === id ? { ...item, nickname: cleanName } : item)),
    )
  }

  function displayName(item: WishlistItem): string {
    if (item.nickname) return item.nickname
    return showPrenoms.value ? prenomOf(item.pokemon.speciesId) : item.pokemon.name
  }

  function setShowPrenoms(value: boolean): void {
    showPrenoms.value = value
    saveShowPrenoms(value)
  }

  return { items, showPrenoms, has, add, remove, rename, displayName, setShowPrenoms }
}
