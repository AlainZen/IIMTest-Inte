console.log('debug')
import type { Pokemon } from '~/types/pokemon'

export const MAX_WISHLIST_SIZE = 6

export type AddPokemonRefusal = 'duplicate' | 'full'

export type AddPokemonResult =
  { ok: true; list: Pokemon[] } | { ok: false; reason: AddPokemonRefusal }

// La règle de la wishlist : pas de doublon, 6 Pokémon maximum.
export function addPokemon(list: readonly Pokemon[], pokemon: Pokemon): AddPokemonResult {
  if (list.some(item => item.id === pokemon.id)) return { ok: false, reason: 'duplicate' }
  if (list.length >= MAX_WISHLIST_SIZE) return { ok: false, reason: 'full' }

  return { ok: true, list: [...list, pokemon] }
}
