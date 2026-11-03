import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiPokemon } from '~/types/pokemon'
import {
  fetchPokemon,
  fetchPokemonDetails,
  localizedName,
  matchesPokedexEntry,
  nameSuggestions,
  pokedexEntries,
  pokedexName,
  PokemonNotFoundError,
  pokemonPath,
  toApiKey,
} from '~/utils/pokeapi'

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
  height: 6,
  weight: 85,
  abilities: [{ ability: { name: 'blaze' } }, { ability: { name: 'solar-power' } }],
  stats: [
    { base_stat: 39, stat: { name: 'hp' } },
    { base_stat: 65, stat: { name: 'speed' } },
  ],
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
    it('renvoie le Pokémon avec son nom anglais', async () => {
      respondWith(200, CHARMANDER)

      await expect(fetchPokemon('charmander')).resolves.toEqual({
        id: 4,
        name: 'Charmander',
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

    it("garde le nom de l'API si le numéro n'est pas connu", async () => {
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

describe('fetchPokemonDetails', () => {
  it('renvoie les informations de la fiche, en mètres et en kilos', async () => {
    respondWith(200, CHARMANDER)

    await expect(fetchPokemonDetails('charmander')).resolves.toEqual({
      id: 4,
      name: 'Charmander',
      types: ['fire'],
      image: 'grande.png',
      height: 0.6,
      weight: 8.5,
      abilities: ['blaze', 'solar-power'],
      stats: [
        { name: 'hp', value: 39 },
        { name: 'speed', value: 65 },
      ],
    })
  })

  it('lance PokemonNotFoundError sur un 404', async () => {
    respondWith(404)

    await expect(fetchPokemonDetails('xyz')).rejects.toBeInstanceOf(PokemonNotFoundError)
  })
})

describe('noms selon la langue', () => {
  it.each([
    ['en', 'Charmander'],
    ['fr', 'Salamèche'],
    ['es', 'Charmander'],
    ['de', 'Glumanda'],
  ] as const)('traduit le n° 4 en %s', (locale, name) => {
    expect(pokedexName(4, locale)).toBe(name)
    expect(localizedName({ id: 4, name: 'Charmander' }, locale)).toBe(name)
    expect(nameSuggestions(locale)[3]).toBe(name)
  })

  it('garde le nom enregistré pour une forme spéciale', () => {
    expect(localizedName({ id: 10001, name: 'Deoxys attack' }, 'fr')).toBe('Deoxys attack')
    expect(pokedexName(99999, 'fr')).toBe('99999')
  })

  it.each(['salameche', 'charmander', 'glumanda', '4'])(
    'le filtre trouve le n° 4 avec %s',
    text => {
      expect(matchesPokedexEntry(4, text)).toBe(true)
    },
  )

  it('le filtre écarte un autre nom', () => {
    expect(matchesPokedexEntry(4, 'pikachu')).toBe(false)
    expect(matchesPokedexEntry(99999, 'pikachu')).toBe(false)
  })

  it('construit l’adresse de la fiche', () => {
    expect(pokemonPath(25)).toBe('/pokemon/pikachu')
    expect(pokemonPath(29)).toBe('/pokemon/nidoran%E2%99%80')
    expect(pokemonPath(10001)).toBe('/pokemon/10001')
  })
})

describe('toApiKey', () => {
  it.each([
    ['Salamèche', '4'],
    ['Glumanda', '4'],
    ['nidoran♀', '29'],
    ['pikachu', '25'],
    ['150', '150'],
    ['Mr. Mime', '122'],
    ['Deoxys Attack', 'deoxys-attack'],
    ['  !!  ', ''],
  ])('transforme « %s » en « %s »', (query, expected) => {
    expect(toApiKey(query)).toBe(expected)
  })
})

describe('pokedexEntries', () => {
  it("liste les 1025 Pokémon dans l'ordre, sans appeler l'API", () => {
    expect(pokedexEntries).toHaveLength(1025)
    expect(pokedexEntries[3]).toMatchObject({ id: 4 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
