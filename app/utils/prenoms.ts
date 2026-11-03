// Quelques prénoms choisis à la main, proches du nom d'origine.
const PRENOMS_PAR_NUMERO: Record<number, string> = {
  1: 'Bilal',
  4: 'Salahedine',
  6: 'Driss',
  7: 'Karim',
  25: 'Bachir',
  39: 'Rayane',
  52: 'Mounir',
  129: 'Mourad',
  133: 'Elyes',
  143: 'Rachid',
  150: 'Mehdi',
  448: 'Lotfi',
}

// Les autres Pokémon reçoivent toujours le même prénom, calculé à partir de leur numéro.
const PRENOMS = [
  'Amine',
  'Anis',
  'Ayoub',
  'Farid',
  'Hakim',
  'Ibrahim',
  'Ismaël',
  'Jamel',
  'Khalil',
  'Malik',
  'Nassim',
  'Omar',
  'Rayan',
  'Sofiane',
  'Tarek',
  'Walid',
  'Yacine',
  'Youssef',
  'Zakaria',
  'Nabil',
]

export function prenomOf(id: number): string {
  return PRENOMS_PAR_NUMERO[id] ?? PRENOMS[id % PRENOMS.length]!
}
