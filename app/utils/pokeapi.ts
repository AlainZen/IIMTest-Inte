import names from '~/data/pokemon-names.json'
import type { ApiPokemon, Pokemon, PokemonDetails, PokedexEntry } from '~/types/pokemon'
import type { Locale } from '~/utils/locales'
import { LOCALES } from '~/utils/locales'

export const DEFAULT_POKEAPI_URL = 'https://pokeapi.co/api/v2'
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

// Le nom d'un Pokémon dans chaque langue, en minuscules et sans accent, pour la recherche.
const searchableNames: readonly string[][] = names.en.map((_, index) =>
  LOCALES.map(locale => normalize(names[locale][index] ?? '')),
)

const idByName: Map<string, number> = new Map(
  searchableNames.flatMap((list, index) =>
    [...list, names.slugs[index] ?? ''].map((name): [string, number] => [name, index + 1]),
  ),
)

// PokeAPI ne cherche que par numéro ou par nom anglais : un nom connu est d'abord traduit en numéro.
export function toApiKey(query: string): string {
  const text = normalize(query)
  const id = idByName.get(text)
  if (id) return String(id)
  return text.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Les formes spéciales, au-delà du dernier numéro, gardent le nom enregistré avec elles.
export function localizedName(pokemon: Pick<Pokemon, 'id' | 'name'>, locale: Locale): string {
  return names[locale][pokemon.id - 1] ?? pokemon.name
}

export function pokedexName(id: number, locale: Locale): string {
  return names[locale][id - 1] ?? String(id)
}

export function matchesPokedexEntry(id: number, text: string): boolean {
  return String(id) === text || (searchableNames[id - 1] ?? []).some(name => name.includes(text))
}

export function pokemonPath(id: number): string {
  return `/pokemon/${names.slugs[id - 1] ?? id}`
}

export function nameSuggestions(locale: Locale): readonly string[] {
  return names[locale]
}

export function toPokemon(data: ApiPokemon): Pokemon {
  const speciesId = Number(data.species.url.match(/(\d+)\/?$/)?.[1] ?? data.id)

  return {
    id: data.id,
    name: names.en[speciesId - 1] ?? data.name,
    types: data.types.map(entry => entry.type.name),
    image: data.sprites.other?.['official-artwork']?.front_default ?? data.sprites.front_default,
  }
}

export function toPokemonDetails(data: ApiPokemon): PokemonDetails {
  return {
    ...toPokemon(data),
    // PokeAPI donne la taille en décimètres et le poids en hectogrammes.
    height: data.height / 10,
    weight: data.weight / 10,
    abilities: data.abilities.map(entry => entry.ability.name),
    stats: data.stats.map(entry => ({ name: entry.stat.name, value: entry.base_stat })),
  }
}

async function fetchApiPokemon(query: string, baseUrl: string): Promise<ApiPokemon> {
  const key = toApiKey(query)
  if (!key) throw new PokemonNotFoundError()

  const response = await fetch(`${baseUrl}/pokemon/${encodeURIComponent(key)}`)

  if (response.status === 404) throw new PokemonNotFoundError()
  if (!response.ok) throw new Error(`PokeAPI a répondu ${response.status}`)

  return (await response.json()) as ApiPokemon
}

export async function fetchPokemon(
  query: string,
  baseUrl: string = DEFAULT_POKEAPI_URL,
): Promise<Pokemon> {
  return toPokemon(await fetchApiPokemon(query, baseUrl))
}

export async function fetchPokemonDetails(
  query: string,
  baseUrl: string = DEFAULT_POKEAPI_URL,
): Promise<PokemonDetails> {
  return toPokemonDetails(await fetchApiPokemon(query, baseUrl))
}

// L'image se déduit du numéro : la liste complète s'affiche sans 1025 appels à l'API.
export const pokedexEntries: readonly PokedexEntry[] = names.en.map((_, index) => ({
  id: index + 1,
  image: `${SPRITES_URL}/${index + 1}.png`,
}))
