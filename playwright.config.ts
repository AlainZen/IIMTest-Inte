import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const FRONT_PORT = 3000
const API_PORT = 3001

// Le dossier de l'API doit être à côté de celui du front.
const API_DIR = resolve(process.env.API_DIR ?? '../IIMTest-API')
const API_ENV_FILE = join(API_DIR, '.env')

if (existsSync(API_ENV_FILE)) process.loadEnvFile(API_ENV_FILE)

const testDatabaseUrl = process.env.TEST_DATABASE_URL

// Les tests vident la wishlist : ils refusent de tourner sur autre chose que la base de test.
if (!testDatabaseUrl) {
  throw new Error(`TEST_DATABASE_URL est manquant : ajoute-le dans ${API_ENV_FILE}.`)
}
if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL doit viser une autre base que DATABASE_URL.')
}

export default defineConfig({
  testDir: './tests/e2e',
  // La page de 1025 cartes et la base distante demandent de la marge sur une machine lente.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Tous les tests partagent la même base : ils passent un par un.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONT_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Ne réutilise jamais un serveur déjà lancé : il pourrait viser la vraie base.
  webServer: [
    {
      command: 'npm run build && npm start',
      cwd: API_DIR,
      url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL: testDatabaseUrl,
        CORS_ORIGIN: `http://localhost:${FRONT_PORT}`,
      },
    },
    {
      command: 'npm run build && npm run preview',
      url: `http://localhost:${FRONT_PORT}`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        PORT: String(FRONT_PORT),
        NUXT_PUBLIC_API_BASE: `http://localhost:${API_PORT}`,
      },
    },
  ],
})
