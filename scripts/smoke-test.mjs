// Contrôle la production après un déploiement : une URL critique en panne fait échouer la CD.
// Usage : API_URL=... SSR_URL=... SSG_URL=... node scripts/smoke-test.mjs
const ATTEMPTS = Number(process.env.SMOKE_ATTEMPTS ?? 5)
const DELAY_MS = Number(process.env.SMOKE_DELAY_MS ?? 10_000)
const TIMEOUT_MS = 20_000

const urls = {}
for (const name of ['API_URL', 'SSR_URL', 'SSG_URL']) {
  const value = process.env[name]?.replace(/\/+$/, '')
  if (!value) {
    console.error(`${name} est manquant.`)
    process.exit(1)
  }
  urls[name] = value
}

const { API_URL, SSR_URL, SSG_URL } = urls
const FILLED_SHEET = 'data-testid="pokemon-sheet"'

const checks = [
  { name: 'API /health', url: `${API_URL}/health`, status: 200, contains: '"status":"ok"' },
  { name: 'API /wishlist', url: `${API_URL}/wishlist`, status: 200 },
  { name: 'API autorise le site SSR', url: `${API_URL}/health`, status: 200, origin: SSR_URL },
  { name: 'API autorise le site SSG', url: `${API_URL}/health`, status: 200, origin: SSG_URL },
  { name: 'SSR accueil', url: `${SSR_URL}/`, status: 200 },
  { name: 'SSR fiche', url: `${SSR_URL}/pokemon/pikachu`, status: 200, contains: FILLED_SHEET },
  { name: 'SSR fiche inconnue', url: `${SSR_URL}/pokemon/n-existe-pas`, status: 404 },
  { name: 'SSG accueil', url: `${SSG_URL}/`, status: 200 },
  { name: 'SSG fiche', url: `${SSG_URL}/pokemon/pikachu`, status: 200, contains: FILLED_SHEET },
  { name: 'SSG fiche inconnue', url: `${SSG_URL}/pokemon/n-existe-pas`, status: 404 },
]

async function findProblem({ url, status, contains, origin }) {
  const response = await fetch(url, {
    headers: origin ? { Origin: origin } : {},
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })

  if (response.status !== status) return `code ${response.status}, attendu ${status}`
  if (contains && !(await response.text()).includes(contains)) return `« ${contains} » est absent`
  if (origin && response.headers.get('access-control-allow-origin') !== origin) {
    return `CORS_ORIGIN n'autorise pas ${origin}`
  }
  return null
}

// Une Lambda qui démarre ou un cache en cours de vidage peut demander quelques secondes.
async function runCheck(check) {
  let problem = null

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    problem = await findProblem(check).catch(error => error.cause?.message ?? error.message)
    if (!problem) return null
    if (attempt < ATTEMPTS) await new Promise(resolve => setTimeout(resolve, DELAY_MS))
  }

  return problem
}

let failures = 0

for (const check of checks) {
  const problem = await runCheck(check)

  if (problem) {
    failures++
    console.error(`ÉCHEC  ${check.name} : ${check.url} : ${problem}`)
  } else {
    console.log(`OK     ${check.name} : ${check.url}`)
  }
}

if (failures) {
  console.error(`${failures} contrôle(s) en échec sur ${checks.length}.`)
  process.exit(1)
}

console.log(`Production en bonne santé : ${checks.length} contrôles réussis.`)
