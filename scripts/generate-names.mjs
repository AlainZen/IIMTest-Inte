// Régénère app/data/pokemon-names.json à partir des données officielles de PokeAPI.
// Chaque liste est rangée par numéro : l'index 0 correspond au Pokémon n° 1.
// Usage : node scripts/generate-names.mjs
import { writeFile } from 'node:fs/promises'

const CSV_URL =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv'
const LANGUAGE_IDS = { en: '9', fr: '5', es: '7', de: '6' }

const response = await fetch(CSV_URL)
if (!response.ok) throw new Error(`Téléchargement impossible : HTTP ${response.status}`)

const names = { en: [], fr: [], es: [], de: [] }
const lines = (await response.text()).split('\n').slice(1)

for (const line of lines) {
  const [speciesId, languageId, name] = line.split(',')
  for (const [locale, id] of Object.entries(LANGUAGE_IDS)) {
    if (languageId === id) names[locale][Number(speciesId) - 1] = name
  }
}

for (const [locale, list] of Object.entries(names)) {
  if (list.includes(undefined)) throw new Error(`Il manque des noms dans la langue ${locale}`)
}

await writeFile(
  new URL('../app/data/pokemon-names.json', import.meta.url),
  `${JSON.stringify(names)}\n`,
)
console.log(`${names.en.length} noms enregistrés`)
