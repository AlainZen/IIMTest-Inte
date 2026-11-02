import frenchNames from '~/data/pokemon-fr.json'
import type { ApiPokemon, Pokemon, PokedexEntry } from '~/types/pokemon'

const API_URL = 'https://pokeapi.co/api/v2/pokemon'
const SPRITES_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'

export class PokemonNotFoundError extends Error {}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const idByFrenchName: Map<string, number> = new Map(
  frenchNames.map((name, index): [string, number] => [normalize(name), index + 1]),
)

// PokeAPI ne cherche que par numéro ou par nom anglais : un nom français est d'abord traduit en numéro.
export function toApiKey(query: string): string {
  const text = normalize(query)
  const id = idByFrenchName.get(text)
  if (id) return String(id)
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function toPokemon(data: ApiPokemon): Pokemon {
  const speciesId = Number(data.species.url.match(/(\d+)\/?$/)?.[1] ?? data.id)

  return {
    id: data.id,
    speciesId,
    name: frenchNames[speciesId - 1] ?? data.name,
    types: data.types.map(entry => entry.type.name),
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default,
  }
}

export async function fetchPokemon(query: string): Promise<Pokemon> {
  const key = toApiKey(query)
  if (!key) throw new PokemonNotFoundError()

  const response = await fetch(`${API_URL}/${encodeURIComponent(key)}`)

  if (response.status === 404) throw new PokemonNotFoundError()
  if (!response.ok) throw new Error(`PokeAPI a répondu ${response.status}`)

  return toPokemon((await response.json()) as ApiPokemon)
}

// Le nom français et l'image se déduisent du numéro : la liste complète s'affiche sans 1025 appels à l'API.
export const pokedexEntries: readonly PokedexEntry[] = frenchNames.map((name, index) => ({
  id: index + 1,
  name,
  image: `${SPRITES_URL}/${index + 1}.png`,
}))

export const pokemonNameSuggestions: readonly string[] = frenchNames
