import { expect, test } from '@playwright/test'

const WISHLIST_KEY = 'inte:wishlist'
const PRENOMS_KEY = 'inte:show-prenoms'

const SALAMECHE = {
  id: 4,
  name: 'charmander',
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/4/' },
  types: [{ type: { name: 'fire' } }],
  sprites: { front_default: null },
}

const CORRUPTED_VALUES: [string, string][] = [
  ['du JSON coupé', '[{"pokemon":'],
  ['du texte', 'pas du json'],
  ["du JSON qui n'est pas une liste", '{"a":1}'],
  ["une liste d'entrées invalides", '[null,12,{"pokemon":"pikachu"}]'],
]

test.beforeEach(async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', route => route.abort())
  await page.route('https://pokeapi.co/api/v2/pokemon/*', route =>
    route.fulfill({ json: SALAMECHE }),
  )
})

for (const [label, value] of CORRUPTED_VALUES) {
  test(`l'application démarre avec ${label} dans le localStorage`, async ({ page }) => {
    const crashes: Error[] = []
    page.on('pageerror', error => crashes.push(error))

    await page.goto('/')
    await page.evaluate(
      ([wishlistKey, prenomsKey, saved]) => {
        localStorage.setItem(wishlistKey, saved)
        localStorage.setItem(prenomsKey, saved)
      },
      [WISHLIST_KEY, PRENOMS_KEY, value] as const,
    )
    await page.reload()

    await expect(page.getByText('Ta wishlist est vide')).toBeVisible()

    // L'application reste utilisable : la page suivante s'ouvre et l'ajout écrase la donnée corrompue.
    await page.locator('.nav').getByRole('link', { name: 'Liste complète' }).click()
    await page.getByRole('button', { name: 'Ajouter Salamèche' }).click()
    await expect(page.getByRole('button', { name: 'Retirer Salamèche' })).toBeVisible()

    await page.locator('.nav').getByRole('link', { name: 'Ma wishlist' }).click()
    await page.reload()

    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
    expect(crashes).toEqual([])
  })
}
