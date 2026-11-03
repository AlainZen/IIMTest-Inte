import { expect, test } from '@playwright/test'
import {
  addThroughApi,
  API_URL,
  breakPokeApi,
  clearWishlist,
  mockPokeApi,
  namesInApi,
  searchAndAdd,
  useFrench,
} from './helpers'

test.beforeEach(async ({ page, request }) => {
  await clearWishlist(request)
  await mockPokeApi(page)
  await useFrench(page)
  await page.goto('/')
  await expect(page.getByText('Ta wishlist est vide')).toBeVisible()
})

test.describe('ajout', () => {
  test('un Pokémon ajouté depuis Nuxt apparaît via l’API', async ({ page, request }) => {
    await searchAndAdd(page, 'salameche')

    await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
    expect(await namesInApi(request)).toEqual(['Charmander'])
  })

  test('la wishlist reste après un rafraîchissement', async ({ page }) => {
    await searchAndAdd(page, 'salameche')
    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)

    await page.reload()

    await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
  })

  test('un Pokémon ajouté par l’API apparaît dans Nuxt', async ({ page, request }) => {
    await addThroughApi(request, 25)

    await page.reload()

    await expect(page.getByRole('heading', { name: 'Pikachu' })).toBeVisible()
  })
})

test.describe('doublon', () => {
  test('la recherche empêche un deuxième ajout', async ({ page, request }) => {
    await searchAndAdd(page, 'salameche')
    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)

    await page.getByLabel('Nom ou numéro du Pokémon').fill('4')
    await page.getByRole('button', { name: 'Chercher' }).click()

    await expect(page.getByRole('button', { name: 'Déjà dans ta wishlist' })).toBeDisabled()
    expect(await namesInApi(request)).toHaveLength(1)
  })

  test('un doublon refusé par l’API affiche un message et met la liste à jour', async ({
    page,
    request,
  }) => {
    // La page ne sait pas encore que le Pokémon vient d'être ajouté ailleurs.
    await addThroughApi(request, 4)

    await searchAndAdd(page, 'salameche')

    await expect(page.getByRole('alert')).toContainText('déjà dans la wishlist')
    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
    expect(await namesInApi(request)).toHaveLength(1)
  })
})

test.describe('limite de 6', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('.nav').getByRole('link', { name: 'Liste complète' }).click()
  })

  test('le 7e Pokémon ne peut pas être ajouté', async ({ page, request }) => {
    for (const name of ['Bulbizarre', 'Herbizarre', 'Florizarre', 'Salamèche', 'Reptincel']) {
      await page.getByRole('button', { name: `Ajouter ${name}`, exact: true }).click()
      await expect(page.getByRole('button', { name: `Retirer ${name}`, exact: true })).toBeVisible()
    }
    await expect(page.getByText('Dans ta wishlist : 5/6')).toBeVisible()

    await page.getByRole('button', { name: 'Ajouter Dracaufeu', exact: true }).click()
    await expect(page.getByText('Dans ta wishlist : 6/6')).toBeVisible()

    const seventh = page.getByRole('button', { name: 'Ajouter Carapuce', exact: true })
    await expect(seventh).toBeDisabled()
    await expect(seventh).toHaveText('Liste pleine')
    expect(await namesInApi(request)).toHaveLength(6)
  })

  test('une liste remplie ailleurs : l’API refuse et la page l’annonce', async ({
    page,
    request,
  }) => {
    await addThroughApi(request, 1, 2, 3, 4, 5, 6)

    await page.getByRole('button', { name: 'Ajouter Carapuce', exact: true }).click()

    await expect(page.getByRole('alert')).toContainText('La wishlist est pleine')
    await expect(page.getByText('Dans ta wishlist : 6/6')).toBeVisible()
    expect(await namesInApi(request)).toHaveLength(6)
  })

  test('retirer un Pokémon libère une place', async ({ page, request }) => {
    await addThroughApi(request, 1, 2, 3, 4, 5, 6)
    await page.reload()
    await expect(page.getByText('Dans ta wishlist : 6/6')).toBeVisible()

    await page.getByRole('button', { name: 'Retirer Bulbizarre', exact: true }).click()

    await expect(page.getByRole('button', { name: 'Ajouter Carapuce', exact: true })).toBeEnabled()
    expect(await namesInApi(request)).toHaveLength(5)
  })
})

test.describe('suppression', () => {
  test('supprimer un Pokémon le retire de l’API, même après rafraîchissement', async ({
    page,
    request,
  }) => {
    await searchAndAdd(page, 'salameche')
    await page.getByRole('button', { name: 'Supprimer Salamèche' }).click()

    await expect(page.getByText('Ta wishlist est vide')).toBeVisible()
    expect(await namesInApi(request)).toEqual([])

    await page.reload()

    await expect(page.getByText('Ta wishlist est vide')).toBeVisible()
  })
})

test.describe('recherche', () => {
  test('un nom inconnu affiche un message clair', async ({ page }) => {
    await page.getByLabel('Nom ou numéro du Pokémon').fill('xyz')
    await page.getByRole('button', { name: 'Chercher' }).click()

    await expect(page.getByRole('alert')).toContainText('Aucun Pokémon trouvé pour « xyz »')
  })
})

test.describe('liste complète', () => {
  test.beforeEach(async ({ page }) => {
    await page.locator('.nav').getByRole('link', { name: 'Liste complète' }).click()
  })

  test('affiche tous les Pokémon et se parcourt jusqu’au dernier', async ({ page }) => {
    await expect(page.getByTestId('pokedex-entry')).toHaveCount(1025)

    await page.getByRole('heading', { name: 'Pêchaminus' }).scrollIntoViewIfNeeded()

    await expect(page.getByRole('heading', { name: 'Pêchaminus' })).toBeInViewport()
  })

  test('le filtre réduit la liste sans appeler PokeAPI', async ({ page }) => {
    let apiCalls = 0
    page.on('request', request => {
      if (request.url().includes('pokeapi.co')) apiCalls += 1
    })

    await page.getByLabel('Filtrer la liste').fill('salameche')

    await expect(page.getByTestId('pokedex-entry')).toHaveCount(1)
    expect(apiCalls).toBe(0)
  })

  test('une panne de PokeAPI affiche un message et n’ajoute rien', async ({ page, request }) => {
    await breakPokeApi(page)

    await page.getByRole('button', { name: 'Ajouter Salamèche' }).click()

    await expect(page.getByRole('alert')).toContainText("Salamèche n'a pas été ajouté")
    expect(await namesInApi(request)).toEqual([])
  })
})

test.describe('surnoms et prénoms', () => {
  test('un surnom reste après un rafraîchissement', async ({ page }) => {
    await searchAndAdd(page, 'salameche')
    await page.getByRole('button', { name: 'Renommer' }).click()
    await page.getByLabel('Nouveau nom de Salamèche').fill('Salahedine')
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await page.reload()

    await expect(page.getByRole('heading', { name: 'Salahedine' })).toBeVisible()
  })

  test('le mode prénoms garde le nom officiel affiché', async ({ page }) => {
    await searchAndAdd(page, 'salameche')
    await page.getByLabel('Afficher les prénoms').check()

    await expect(page.getByRole('heading', { name: 'Salahedine' })).toBeVisible()
    await expect(page.getByTestId('pokemon-card').getByText('Salamèche')).toBeVisible()
  })
})

test.describe('API indisponible', () => {
  test('la page l’annonce, et « Réessayer » recharge la liste', async ({ page, request }) => {
    await addThroughApi(request, 4)
    await page.route(`${API_URL}/wishlist`, route => route.abort())
    await page.reload()

    await expect(page.getByRole('alert')).toContainText("L'API ne répond pas")

    await page.unroute(`${API_URL}/wishlist`)
    await page.getByRole('button', { name: 'Réessayer' }).click()

    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
  })
})
