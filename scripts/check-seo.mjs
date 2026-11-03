// Lit le HTML brut des fiches, sans JavaScript, comme le ferait un robot, puis compare SSR et SSG.
// Usage : SSR_URL=... SSG_URL=... node scripts/check-seo.mjs
// pikachu fait partie des fiches pré-générées partout. chikorita est rendue à la demande en SSR.
const POKEMON = [
  { slug: 'pikachu', name: 'Pikachu' },
  { slug: 'charizard', name: 'Charizard' },
  { slug: 'chikorita', name: 'Chikorita' },
]
const MIN_TEXT_LENGTH = 100
const TIMEOUT_MS = 20_000

const sites = {}
for (const [label, variable] of [
  ['SSR', 'SSR_URL'],
  ['SSG', 'SSG_URL'],
]) {
  const value = process.env[variable]?.replace(/\/+$/, '')
  if (!value) {
    console.error(`${variable} est manquant.`)
    process.exit(1)
  }
  sites[label] = value
}

function firstMatch(html, pattern) {
  return html.match(pattern)?.[1]?.trim() ?? ''
}

function analyze(html) {
  const text = html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    title: firstMatch(html, /<title[^>]*>([^<]*)<\/title>/),
    heading: firstMatch(html, /<h1[^>]*>([^<]*)<\/h1>/),
    textLength: text.length,
  }
}

const problems = []

for (const { slug, name } of POKEMON) {
  const pages = {}

  for (const [label, baseUrl] of Object.entries(sites)) {
    const url = `${baseUrl}/pokemon/${slug}`
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    const page = analyze(await response.text())
    pages[label] = page

    if (response.status !== 200) problems.push(`${url} : code ${response.status}`)
    if (!page.title.includes(name)) problems.push(`${url} : title « ${page.title} »`)
    if (page.heading !== name) problems.push(`${url} : h1 « ${page.heading} »`)
    if (page.textLength < MIN_TEXT_LENGTH) {
      problems.push(`${url} : coquille vide, ${page.textLength} caractères de texte`)
    }

    console.log(
      `${label}  ${slug.padEnd(10)} title « ${page.title} », h1 « ${page.heading} », ${page.textLength} caractères`,
    )
  }

  if (pages.SSR.title !== pages.SSG.title || pages.SSR.heading !== pages.SSG.heading) {
    problems.push(`${slug} : SSR et SSG ne donnent pas le même title ou le même h1`)
  }
}

if (problems.length) {
  for (const problem of problems) console.error(`ÉCHEC  ${problem}`)
  process.exit(1)
}

console.log('SSR et SSG envoient le même contenu dans le HTML, sans JavaScript.')
