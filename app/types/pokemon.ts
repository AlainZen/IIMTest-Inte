export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy'

// Un Pokémon tel que l'application l'utilise, avec son nom français.
export interface Pokemon {
  id: number
  name: string
  types: PokemonType[]
  image: string | null
}

// Une entrée de la wishlist, telle que l'API Hono la garde en base.
export interface WishlistItem {
  id: number
  pokemon: Pokemon
  addedAt: string
}

// Une ligne de la liste complète : juste de quoi l'afficher, sans appel à l'API.
export interface PokedexEntry {
  id: number
  name: string
  image: string
}

// La partie de la réponse de GET /pokemon/{id} de PokeAPI dont l'application a besoin.
export interface ApiPokemon {
  id: number
  name: string
  species: { url: string }
  types: { type: { name: PokemonType } }[]
  sprites: {
    front_default: string | null
    other?: { 'official-artwork'?: { front_default: string | null } }
  }
}

// Une entrée telle que l'API Hono l'envoie.
export interface ApiWishlistItem {
  id: number
  pokemonId: number
  name: string
  types: PokemonType[]
  image: string | null
  addedAt: string
}
