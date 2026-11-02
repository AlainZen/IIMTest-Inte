import type { PokemonType } from '~/types/pokemon'

interface TypeStyle {
  label: string
  color: string
  ink: string
}

const BLACK = '#000000'
const WHITE = '#ffffff'

const TYPES: Record<PokemonType, TypeStyle> = {
  normal: { label: 'Normal', color: '#a8a77a', ink: BLACK },
  fire: { label: 'Feu', color: '#ee8130', ink: BLACK },
  water: { label: 'Eau', color: '#6390f0', ink: BLACK },
  electric: { label: 'Électrik', color: '#f7d02c', ink: BLACK },
  grass: { label: 'Plante', color: '#7ac74c', ink: BLACK },
  ice: { label: 'Glace', color: '#96d9d6', ink: BLACK },
  fighting: { label: 'Combat', color: '#c22e28', ink: WHITE },
  poison: { label: 'Poison', color: '#a33ea1', ink: WHITE },
  ground: { label: 'Sol', color: '#e2bf65', ink: BLACK },
  flying: { label: 'Vol', color: '#a98ff3', ink: BLACK },
  psychic: { label: 'Psy', color: '#f95587', ink: BLACK },
  bug: { label: 'Insecte', color: '#a6b91a', ink: BLACK },
  rock: { label: 'Roche', color: '#b6a136', ink: BLACK },
  ghost: { label: 'Spectre', color: '#735797', ink: WHITE },
  dragon: { label: 'Dragon', color: '#6f35fc', ink: WHITE },
  dark: { label: 'Ténèbres', color: '#705746', ink: WHITE },
  steel: { label: 'Acier', color: '#b7b7ce', ink: BLACK },
  fairy: { label: 'Fée', color: '#d685ad', ink: BLACK },
}

// Les types viennent de PokeAPI et du localStorage : un type inconnu ne doit pas casser l'affichage.
const UNKNOWN: TypeStyle = { label: 'Inconnu', color: '#d4d4d4', ink: BLACK }

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
