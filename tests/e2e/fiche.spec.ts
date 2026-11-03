import { expect, test } from '@playwright/test'
import { clearWishlist, mockPokeApi, namesInApi, useFrench } from './helpers'

test.beforeEach(async ({ page, request }) => {
  await clearWishlist(request)
  await mockPokeApi(page)
  await useFrench(page)
})

test.describe('fiche /pokemon/[name]', () => {
  test('une URL directe affiche le Pokémon et ses informations', async ({ page }) => {
    await page.goto('/pokemon/pikachu')

    const sheet = page.getByTestId('pokemon-sheet')
    await expect(sheet.getByRole('heading', { name: 'Pikachu', level: 1 })).toBeVisible()
    await expect(sheet).toContainText('n° 25')
    await expect(sheet).toContainText('0,4 m')
    await expect(sheet).toContainText('6 kg')
    await expect(sheet).toContainText('lightning rod')
    await expect(sheet).toContainText('Feu')
    await expect(sheet).toContainText('Vitesse')
  })

  test('accepte un nom français, avec ou sans accent, ou un numéro', async ({ page }) => {
    for (const name of ['salameche', 'Salam%C3%A8che', '4']) {
      await page.goto(`/pokemon/${name}`)

      await expect(page.getByRole('heading', { name: 'Salamèche', level: 1 })).toBeVisible()
    }
  })

  test('un Pokémon inconnu affiche un message clair', async ({ page }) => {
    await page.goto('/pokemon/nexistepas')

    await expect(page.getByRole('alert')).toContainText("Aucun Pokémon ne s'appelle « nexistepas »")
    await expect(page.getByRole('link', { name: 'Retour à la liste complète' })).toBeVisible()
  })

  test('une panne de PokeAPI propose de réessayer', async ({ page }) => {
    await page.route('https://pokeapi.co/api/v2/pokemon/*', route =>
      route.fulfill({ status: 500, body: 'Erreur' }),
    )
    await page.goto('/pokemon/pikachu')
    await expect(page.getByRole('alert')).toContainText('PokeAPI ne répond pas')

    await page.unroute('https://pokeapi.co/api/v2/pokemon/*')
    await mockPokeApi(page)
    await page.getByRole('button', { name: 'Réessayer' }).click()

    await expect(page.getByRole('heading', { name: 'Pikachu', level: 1 })).toBeVisible()
  })

  test('le nom d’une carte de la liste complète mène à la fiche', async ({ page }) => {
    await page.goto('/liste-complete')
    await page.getByLabel('Filtrer la liste').fill('pikachu')

    await page.getByRole('link', { name: 'Pikachu', exact: true }).last().click()

    await expect(page).toHaveURL(/\/pokemon\/pikachu$/)
    await expect(page.getByRole('heading', { name: 'Pikachu', level: 1 })).toBeVisible()
  })

  test('ajoute puis retire le Pokémon depuis sa fiche', async ({ page, request }) => {
    await page.goto('/pokemon/pikachu')

    await page.getByRole('button', { name: 'Ajouter à ma wishlist' }).click()
    await expect(page.getByRole('button', { name: 'Retirer' })).toBeVisible()
    expect(await namesInApi(request)).toEqual(['Pikachu'])

    await page.getByRole('button', { name: 'Retirer' }).click()
    await expect(page.getByRole('button', { name: 'Ajouter à ma wishlist' })).toBeVisible()
    expect(await namesInApi(request)).toEqual([])
  })
})
