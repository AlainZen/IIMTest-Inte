import { expect, test } from '@playwright/test'
import { addThroughApi, clearWishlist, mockPokeApi, searchAndAdd } from './helpers'

const LANGUAGES = [
  { code: 'en', nav: 'My wishlist', add: 'Add to my wishlist', refusal: 'already in the wishlist' },
  {
    code: 'fr',
    nav: 'Ma wishlist',
    add: 'Ajouter à ma wishlist',
    refusal: 'déjà dans la wishlist',
  },
  {
    code: 'es',
    nav: 'Mi lista de deseos',
    add: 'Añadir a mi lista de deseos',
    refusal: 'ya está en la lista de deseos',
  },
  {
    code: 'de',
    nav: 'Meine Wunschliste',
    add: 'Zu meiner Wunschliste hinzufügen',
    refusal: 'bereits auf der Wunschliste',
  },
]

test.beforeEach(async ({ page, request }) => {
  await clearWishlist(request)
  await mockPokeApi(page)
})

test('l’anglais est la langue par défaut, même dans un navigateur français', async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: 'fr-FR' })
  const page = await context.newPage()
  await mockPokeApi(page)

  await page.goto('http://localhost:3000/')

  await expect(page.getByRole('heading', { name: /My wishlist/ })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await context.close()
})

test('changer de langue modifie l’interface et reste après un rafraîchissement', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByTestId('language-select').selectOption('de')

  await expect(page.getByRole('heading', { name: /Meine Wunschliste/ })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')

  await page.reload()

  await expect(page.getByRole('heading', { name: /Meine Wunschliste/ })).toBeVisible()
})

test('les noms de Pokémon suivent la langue', async ({ page }) => {
  await page.goto('/pokemon/4')
  await expect(page.getByRole('heading', { name: 'Charmander', level: 1 })).toBeVisible()

  await page.getByTestId('language-select').selectOption('fr')
  await expect(page.getByRole('heading', { name: 'Salamèche', level: 1 })).toBeVisible()

  await page.getByTestId('language-select').selectOption('de')
  await expect(page.getByRole('heading', { name: 'Glumanda', level: 1 })).toBeVisible()
})

for (const { code, nav, add, refusal } of LANGUAGES) {
  test(`en ${code}, l’interface et le message de l’API sont traduits`, async ({
    page,
    request,
  }) => {
    await page.goto('/')
    await page.getByTestId('language-select').selectOption(code)
    await expect(page.getByRole('heading', { name: new RegExp(nav) })).toBeVisible()

    // La page ne sait pas encore que le Pokémon vient d'être ajouté : c'est l'API qui refuse.
    await addThroughApi(request, 4)
    await page.locator('#search-input').fill('4')
    await page.locator('.search-bar button').click()
    await page.getByRole('button', { name: add }).click()

    await expect(page.getByRole('alert')).toContainText(refusal)
  })
}

test('un cookie de langue invalide revient à l’anglais', async ({ page }) => {
  await page
    .context()
    .addCookies([{ name: 'pokewishlist_locale', value: 'klingon', url: 'http://localhost:3000' }])

  await page.goto('/')

  await expect(page.getByRole('heading', { name: /My wishlist/ })).toBeVisible()
})

test('le mode français ajoute toujours un Pokémon', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('language-select').selectOption('fr')

  await searchAndAdd(page, 'salameche')

  await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
})
