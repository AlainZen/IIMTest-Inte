// Vérifie le site écrit par nuxt generate, avant de le mettre en ligne.
// Usage : node scripts/check-static.mjs <dossier>
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const POKEMON_COUNT = 1025
const FILLED_SHEET = 'data-testid="pokemon-sheet"'

const directory = process.argv[2] ?? '.output/public'
const apiBase = process.env.NUXT_PUBLIC_API_BASE
const problems = []

for (const page of ['index.html', '404.html', 'liste-complete/index.html']) {
  if (!existsSync(join(directory, page))) problems.push(`${page} est absent`)
}

const pokemonDirectory = join(directory, 'pokemon')
const names = existsSync(pokemonDirectory) ? readdirSync(pokemonDirectory) : []

if (names.length < POKEMON_COUNT) {
  problems.push(`${names.length} fiches écrites sur ${POKEMON_COUNT}`)
}

function isFilledSheet(file) {
  if (!existsSync(file)) return false

  const html = readFileSync(file, 'utf8')
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.trim()
  const heading = html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1]?.trim()

  return html.includes(FILLED_SHEET) && Boolean(heading) && title === heading
}

// Une panne de PokeAPI pendant la génération donnerait une page sans fiche.
const emptySheets = names.filter(name => !isFilledSheet(join(pokemonDirectory, name, 'index.html')))

if (emptySheets.length) {
  const examples = emptySheets.slice(0, 5).join(', ')
  problems.push(`${emptySheets.length} fiches sans contenu, par exemple : ${examples}`)
}

if (apiBase && names[0]) {
  const html = readFileSync(join(pokemonDirectory, names[0], 'index.html'), 'utf8')
  if (!html.includes(apiBase)) problems.push(`les pages n'utilisent pas l'API ${apiBase}`)
}

if (problems.length) {
  for (const problem of problems) console.error(problem)
  process.exit(1)
}

console.log(`Site statique complet : ${names.length} fiches avec leur HTML.`)
