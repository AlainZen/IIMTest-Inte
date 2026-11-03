import type { PokemonType } from '~/types/pokemon'

interface TypeStyle {
  color: string
  ink: string
}

const BLACK = '#000000'
const WHITE = '#ffffff'

const TYPES: Record<PokemonType, TypeStyle> = {
  normal: { color: '#a8a77a', ink: BLACK },
  fire: { color: '#ee8130', ink: BLACK },
  water: { color: '#6390f0', ink: BLACK },
  electric: { color: '#f7d02c', ink: BLACK },
  grass: { color: '#7ac74c', ink: BLACK },
  ice: { color: '#96d9d6', ink: BLACK },
  fighting: { color: '#c22e28', ink: WHITE },
  poison: { color: '#a33ea1', ink: WHITE },
  ground: { color: '#e2bf65', ink: BLACK },
  flying: { color: '#a98ff3', ink: BLACK },
  psychic: { color: '#f95587', ink: BLACK },
  bug: { color: '#a6b91a', ink: BLACK },
  rock: { color: '#b6a136', ink: BLACK },
  ghost: { color: '#735797', ink: WHITE },
  dragon: { color: '#6f35fc', ink: WHITE },
  dark: { color: '#705746', ink: WHITE },
  steel: { color: '#b7b7ce', ink: BLACK },
  fairy: { color: '#d685ad', ink: BLACK },
}

// Les types viennent de PokeAPI et de la base : un type inconnu ne doit pas casser l'affichage.
const UNKNOWN: TypeStyle = { color: '#d4d4d4', ink: BLACK }

export function typeStyle(type: PokemonType): TypeStyle {
  return TYPES[type] ?? UNKNOWN
}

// Un Pokémon à deux types a un fond coupé net en deux couleurs.
export function typeBackground(types: PokemonType[]): string {
  const [first, second = first] = types
  const firstColor = first ? typeStyle(first).color : UNKNOWN.color
  const secondColor = second ? typeStyle(second).color : UNKNOWN.color
  return `linear-gradient(115deg, ${firstColor} 50%, ${secondColor} 50%)`
}
