import { expect, test } from '@playwright/test'
import {
  addThroughApi,
  API_URL,
  clearWishlist,
  likesInApi,
  mockPokeApi,
  searchAndAdd,
  useFrench,
} from './helpers'

test.beforeEach(async ({ page, request }) => {
  await clearWishlist(request)
  await mockPokeApi(page)
  await useFrench(page)
})

test('un like part jusqu’à l’API et reste après un rafraîchissement', async ({ page, request }) => {
  await addThroughApi(request, 25)
  await page.goto('/')

  const like = page.getByTestId('like-button')
  await expect(like).toHaveText('♥ 0')

  await like.click()
  await expect(like).toHaveText('♥ 1')
  await like.click()
  await expect(like).toHaveText('♥ 2')

  expect(await likesInApi(request)).toEqual({ 25: 2 })

  await page.reload()
  await expect(page.getByTestId('like-button')).toHaveText('♥ 2')
})

test('chaque Pokémon garde ses propres likes', async ({ page, request }) => {
  await addThroughApi(request, 25, 4)
  await page.goto('/')

  await page.getByTestId('like-button').first().click()
  await expect(page.getByTestId('like-button').first()).toHaveText('♥ 1')
  await expect(page.getByTestId('like-button').last()).toHaveText('♥ 0')

  expect(await likesInApi(request)).toEqual({ 25: 1, 4: 0 })
})

test('un like refusé affiche une erreur et ne change pas le total', async ({ page, request }) => {
  await addThroughApi(request, 25)
  await page.route(`${API_URL}/wishlist/*/like`, route => route.abort())
  await page.goto('/')

  await page.getByTestId('like-button').click()

  await expect(page.getByRole('alert')).toContainText('reçu ton like')
  await expect(page.getByTestId('like-button')).toHaveText('♥ 0')
  expect(await likesInApi(request)).toEqual({ 25: 0 })
})

test('le parcours complet va du navigateur à la base', async ({ page, request }) => {
  // Fiche : le Pokémon est ajouté depuis sa page.
  await page.goto('/pokemon/pikachu')
  await expect(page.getByRole('heading', { name: 'Pikachu', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Ajouter à ma wishlist' }).click()
  await expect(page.getByRole('button', { name: 'Retirer' })).toBeVisible()

  // Like : le compteur vient de l'API.
  await page.getByRole('link', { name: 'Ma wishlist' }).click()
  await page.getByTestId('like-button').click()
  await expect(page.getByTestId('like-button')).toHaveText('♥ 1')

  // Langue : l'interface change et les données restent.
  await page.getByLabel('Langue').selectOption('de')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Meine Wunschliste')
  await expect(page.getByTestId('like-button')).toHaveText('♥ 1')

  // Persistance : tout est encore là après un rechargement.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pikachu' })).toBeVisible()
  await expect(page.getByTestId('like-button')).toHaveText('♥ 1')
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')

  expect(await likesInApi(request)).toEqual({ 25: 1 })

  // Suppression : l'entrée disparaît aussi de l'API.
  await page
    .getByRole('button', { name: /Pikachu/ })
    .last()
    .click()
  await expect(page.getByTestId('pokemon-card')).toHaveCount(0)
  expect(await likesInApi(request)).toEqual({})
})

test('un Pokémon cherché puis ajouté commence à 0 like', async ({ page, request }) => {
  await page.goto('/')

  await searchAndAdd(page, 'salameche')

  await expect(page.getByTestId('like-button')).toHaveText('♥ 0')
  expect(await likesInApi(request)).toEqual({ 4: 0 })
})
