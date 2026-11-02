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
  speciesId: number
  name: string
  types: PokemonType[]
  image: string | null
}

// Une entrée de la wishlist : le Pokémon, plus ce que l'utilisateur y a ajouté.
export interface WishlistItem {
  pokemon: Pokemon
  nickname?: string
  addedAt: string
}

// Une ligne de la liste complète : juste de quoi l'afficher, sans appel à l'API.
export interface PokedexEntry {
  id: number
  name: string
  image: string
}

// La partie de la réponse de GET /pokemon/{id} dont l'application a besoin.
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
