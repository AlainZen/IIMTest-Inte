// Régénère app/data/pokemon-names.json à partir des données officielles de PokeAPI.
// Chaque liste est rangée par numéro : l'index 0 correspond au Pokémon n° 1.
// Usage : node scripts/generate-names.mjs
import { writeFile } from 'node:fs/promises'

const DATA_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'
const LANGUAGE_IDS = { en: '9', fr: '5', es: '7', de: '6' }

async function readLines(file) {
  const response = await fetch(`${DATA_URL}/${file}`)
  if (!response.ok) throw new Error(`Téléchargement impossible : HTTP ${response.status}`)
  return (await response.text()).split('\n').slice(1)
}

const names = { en: [], fr: [], es: [], de: [], slugs: [] }

for (const line of await readLines('pokemon_species_names.csv')) {
  const [speciesId, languageId, name] = line.split(',')
  for (const [locale, id] of Object.entries(LANGUAGE_IDS)) {
    if (languageId === id) names[locale][Number(speciesId) - 1] = name
  }
}

// Le nom utilisé dans l'adresse de la fiche, comme sur PokeAPI : nidoran-f, mr-mime...
for (const line of await readLines('pokemon_species.csv')) {
  const [speciesId, slug] = line.split(',')
  if (speciesId) names.slugs[Number(speciesId) - 1] = slug
}

for (const [key, list] of Object.entries(names)) {
  if (list.includes(undefined)) throw new Error(`Il manque des noms dans la liste ${key}`)
}

await writeFile(
  new URL('../app/data/pokemon-names.json', import.meta.url),
  `${JSON.stringify(names)}\n`,
)
console.log(`${names.en.length} noms enregistrés`)
