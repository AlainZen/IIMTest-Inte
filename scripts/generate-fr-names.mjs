// Régénère app/data/pokemon-fr.json à partir des données officielles de PokeAPI.
// Le tableau est rangé par numéro : l'index 0 correspond au Pokémon n° 1.
// Usage : node scripts/generate-fr-names.mjs
import { writeFile } from 'node:fs/promises'

const CSV_URL = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv'
const FRENCH_LANGUAGE_ID = '5'

const response = await fetch(CSV_URL)
if (!response.ok) throw new Error(`Téléchargement impossible : HTTP ${response.status}`)

const names = []
for (const line of (await response.text()).split('\n').slice(1)) {
  const [speciesId, languageId, name] = line.split(',')
  if (languageId === FRENCH_LANGUAGE_ID) names[Number(speciesId) - 1] = name
}

if (names.includes(undefined)) throw new Error('Il manque des noms français dans le fichier source')

await writeFile(new URL('../app/data/pokemon-fr.json', import.meta.url), `${JSON.stringify(names)}\n`)
console.log(`${names.length} noms enregistrés`)
