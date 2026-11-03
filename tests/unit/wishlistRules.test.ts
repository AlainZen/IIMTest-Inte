import { describe, expect, it } from 'vitest'
import type { Pokemon } from '~/types/pokemon'
import { addPokemon, MAX_WISHLIST_SIZE } from '~/utils/wishlistRules'

function pokemon(id: number): Pokemon {
  return { id, name: `Pokémon ${id}`, types: ['normal'], image: null }
}

function listOf(size: number): Pokemon[] {
  return Array.from({ length: size }, (_, index) => pokemon(index + 1))
}

describe('addPokemon', () => {
  it('limite la wishlist à 6 Pokémon', () => {
    expect(MAX_WISHLIST_SIZE).toBe(6)
  })

  describe('ajout', () => {
    it('ajoute le Pokémon à la fin de la liste', () => {
      expect(addPokemon([pokemon(1)], pokemon(2))).toEqual({
        ok: true,
        list: [pokemon(1), pokemon(2)],
      })
    })

    it('ajoute dans une liste vide', () => {
      expect(addPokemon([], pokemon(1))).toEqual({ ok: true, list: [pokemon(1)] })
    })

    it('accepte le 6e Pokémon', () => {
      const result = addPokemon(listOf(5), pokemon(6))

      expect(result.ok && result.list).toHaveLength(6)
    })

    it('ne modifie pas la liste de départ', () => {
      const list = [pokemon(1)]

      addPokemon(list, pokemon(2))

      expect(list).toEqual([pokemon(1)])
    })
  })

  describe('doublon', () => {
    it('refuse un Pokémon déjà présent', () => {
      expect(addPokemon([pokemon(1)], pokemon(1))).toEqual({ ok: false, reason: 'duplicate' })
    })

    it('annonce un doublon, pas une liste pleine, si la liste est pleine', () => {
      expect(addPokemon(listOf(6), pokemon(1))).toEqual({ ok: false, reason: 'duplicate' })
    })
  })

  describe('liste pleine', () => {
    it('refuse le 7e Pokémon', () => {
      expect(addPokemon(listOf(6), pokemon(7))).toEqual({ ok: false, reason: 'full' })
    })
  })
})
