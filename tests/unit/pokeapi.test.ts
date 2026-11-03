import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiPokemon } from '~/types/pokemon'
import { fetchPokemon, PokemonNotFoundError, pokedexEntries, toApiKey } from '~/utils/pokeapi'

const API_URL = 'https://pokeapi.co/api/v2/pokemon'

const CHARMANDER: ApiPokemon = {
  id: 4,
  name: 'charmander',
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/4/' },
  types: [{ type: { name: 'fire' } }],
  sprites: {
    front_default: 'petite.png',
    other: { 'official-artwork': { front_default: 'grande.png' } },
  },
}

// Remplace le vrai fetch : aucun test de ce fichier ne peut sortir sur le réseau.
const fetchMock = vi.fn<typeof fetch>()

function respondWith(status: number, body: unknown = null): void {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('fetchPokemon', () => {
  describe('réponse 200', () => {
    it('renvoie le Pokémon avec son nom français', async () => {
      respondWith(200, CHARMANDER)

      await expect(fetchPokemon('charmander')).resolves.toEqual({
        id: 4,
        name: 'Salamèche',
        types: ['fire'],
        image: 'grande.png',
      })
    })

    it("traduit un nom français, avec ou sans accent, en numéro pour l'API", async () => {
      respondWith(200, CHARMANDER)

      await fetchPokemon('  SALAMECHE ')

      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${API_URL}/4`)
    })

    it("garde la petite image si l'illustration officielle manque", async () => {
      respondWith(200, { ...CHARMANDER, sprites: { front_default: 'petite.png' } })

      await expect(fetchPokemon('4')).resolves.toMatchObject({ image: 'petite.png' })
    })

    it("garde le nom anglais si le nom français n'est pas connu", async () => {
      respondWith(200, {
        ...CHARMANDER,
        name: 'nouveau',
        species: { url: 'https://pokeapi.co/api/v2/pokemon-species/99999/' },
      })

      await expect(fetchPokemon('nouveau')).resolves.toMatchObject({ name: 'nouveau' })
    })
  })

  describe('Pokémon introuvable (404)', () => {
    it('lance PokemonNotFoundError', async () => {
      respondWith(404)

      await expect(fetchPokemon('xyz')).rejects.toBeInstanceOf(PokemonNotFoundError)
    })

    it("n'appelle pas l'API si la recherche est vide", async () => {
      await expect(fetchPokemon('   ')).rejects.toBeInstanceOf(PokemonNotFoundError)

      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  describe('panne de PokeAPI', () => {
    it('ne confond pas une erreur 500 avec un Pokémon introuvable', async () => {
      respondWith(500)

      const error = await fetchPokemon('pikachu').catch((cause: unknown) => cause)

      expect(error).toEqual(new Error('PokeAPI a répondu 500'))
      expect(error).not.toBeInstanceOf(PokemonNotFoundError)
    })

    it('laisse remonter une coupure réseau', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(fetchPokemon('pikachu')).rejects.toBeInstanceOf(TypeError)
    })
  })
})

describe('toApiKey', () => {
  it.each([
    ['Salamèche', '4'],
    ['pikachu', '25'],
    ['150', '150'],
    ['Mr. Mime', 'mr-mime'],
    ['  !!  ', ''],
  ])('transforme « %s » en « %s »', (query, expected) => {
    expect(toApiKey(query)).toBe(expected)
  })
})

describe('pokedexEntries', () => {
  it("liste les 1025 Pokémon dans l'ordre, sans appeler l'API", () => {
    expect(pokedexEntries).toHaveLength(1025)
    expect(pokedexEntries[3]).toMatchObject({ id: 4, name: 'Salamèche' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
