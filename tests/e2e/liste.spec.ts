import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// PokeAPI est simulée pour que le test ne dépende pas d'un service extérieur.
const SALAMECHE = {
  id: 4,
  name: 'charmander',
  species: { url: 'https://pokeapi.co/api/v2/pokemon-species/4/' },
  types: [{ type: { name: 'fire' } }],
  sprites: { front_default: null },
}

test.beforeEach(async ({ page }) => {
  await page.route('https://raw.githubusercontent.com/**', route => route.abort())
  await page.route('https://pokeapi.co/api/v2/pokemon/*', (route) => {
    const key = route.request().url().split('/').pop()
    return ['4', 'charmander'].includes(key ?? '')
      ? route.fulfill({ json: SALAMECHE })
      : route.fulfill({ status: 404, body: 'Not Found' })
  })
  await page.goto('/')
})

async function addSalameche(page: Page): Promise<void> {
  await page.getByLabel('Nom ou numéro du Pokémon').fill('salameche')
  await page.getByRole('button', { name: 'Chercher' }).click()
  await page.getByRole('button', { name: 'Ajouter à ma wishlist' }).click()
}

test('ajouter un Pokémon, rafraîchir : la liste reste visible', async ({ page }) => {
  await addSalameche(page)
  await expect(page.getByTestId('pokemon-card')).toHaveCount(1)

  await page.reload()

  await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
})

test('supprimer un Pokémon, rafraîchir : il ne revient pas', async ({ page }) => {
  await addSalameche(page)
  await page.getByRole('button', { name: 'Supprimer Salamèche' }).click()
  await expect(page.getByTestId('pokemon-card')).toHaveCount(0)

  await page.reload()

  await expect(page.getByText('Ta wishlist est vide')).toBeVisible()
})

test('un Pokémon déjà ajouté ne peut pas l\'être une deuxième fois', async ({ page }) => {
  await addSalameche(page)
  await page.getByLabel('Nom ou numéro du Pokémon').fill('4')
  await page.getByRole('button', { name: 'Chercher' }).click()

  await expect(page.getByRole('button', { name: 'Déjà dans ta wishlist' })).toBeDisabled()
})

test('un nom inconnu affiche un message clair', async ({ page }) => {
  await page.getByLabel('Nom ou numéro du Pokémon').fill('xyz')
  await page.getByRole('button', { name: 'Chercher' }).click()

  await expect(page.getByRole('alert')).toContainText('Aucun Pokémon trouvé pour « xyz »')
})

test('renommer un Pokémon, rafraîchir : le nom reste', async ({ page }) => {
  await addSalameche(page)
  await page.getByRole('button', { name: 'Renommer' }).click()
  await page.getByLabel('Nouveau nom de Salamèche').fill('Salahedine')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.reload()

  await expect(page.getByRole('heading', { name: 'Salahedine' })).toBeVisible()
})

test('le mode prénoms renomme les Pokémon sans changer leur nom officiel', async ({ page }) => {
  await addSalameche(page)
  await page.getByLabel('Afficher les prénoms').check()

  await expect(page.getByRole('heading', { name: 'Salahedine' })).toBeVisible()
  await expect(page.getByTestId('pokemon-card').getByText('Salamèche')).toBeVisible()
})

test.describe('liste complète', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('link', { name: 'Liste complète' }).first().click()
    await expect(page.getByRole('heading', { name: /Liste complète/ })).toBeVisible()
  })

  test('affiche tous les Pokémon et se parcourt jusqu\'au dernier', async ({ page }) => {
    await expect(page.getByTestId('pokedex-entry')).toHaveCount(1025)

    await page.getByRole('heading', { name: 'Pêchaminus' }).scrollIntoViewIfNeeded()

    await expect(page.getByRole('heading', { name: 'Pêchaminus' })).toBeInViewport()
  })

  test('le filtre réduit la liste sans appeler PokeAPI', async ({ page }) => {
    let apiCalls = 0
    page.on('request', (request) => {
      if (request.url().includes('pokeapi.co')) apiCalls += 1
    })

    await page.getByLabel('Filtrer la liste').fill('salameche')

    await expect(page.getByTestId('pokedex-entry')).toHaveCount(1)
    expect(apiCalls).toBe(0)
  })

  test('ajouter depuis la liste complète, rafraîchir : il est dans la wishlist', async ({ page }) => {
    await page.getByRole('button', { name: 'Ajouter Salamèche' }).click()
    await expect(page.getByRole('button', { name: 'Retirer Salamèche' })).toBeVisible()

    await page.getByRole('link', { name: 'Ma wishlist' }).click()
    await page.reload()

    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
  })

  test('une erreur de PokeAPI affiche un message et n\'ajoute rien', async ({ page }) => {
    await page.route('https://pokeapi.co/api/v2/pokemon/*', route => route.fulfill({ status: 500, body: 'Erreur' }))

    await page.getByRole('button', { name: 'Ajouter Salamèche' }).click()

    await expect(page.getByRole('alert')).toContainText('Salamèche n\'a pas été ajouté')
    await expect(page.getByRole('button', { name: 'Ajouter Salamèche' })).toBeVisible()
  })
})
