import { existsSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { breakPokeApi, clearWishlist, mockPokeApi, namesInApi, useFrench } from './helpers'

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

  test('un Pokémon inconnu affiche un message clair et répond 404', async ({ page, request }) => {
    const response = await page.goto('/pokemon/nexistepas')

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('alert')).toContainText("Aucun Pokémon ne s'appelle « nexistepas »")
    await expect(page.getByRole('link', { name: 'Retour à la liste complète' })).toBeVisible()
    expect((await request.get('/pokemon/nexistepas')).status()).toBe(404)
  })

  test('une panne de PokeAPI propose de réessayer', async ({ page }) => {
    await page.goto('/liste-complete')
    await page.getByLabel('Filtrer la liste').fill('pikachu')
    await breakPokeApi(page)

    await page.getByRole('link', { name: 'Pikachu', exact: true }).last().click()
    await expect(page.getByRole('alert')).toContainText('PokeAPI ne répond pas')

    await page.unroute('http://localhost:3002/pokemon/*')
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

test.describe('rendu côté serveur', () => {
  test('la fiche arrive déjà remplie dans le HTML, sans JavaScript', async ({ request }) => {
    const html = await (await request.get('/pokemon/pikachu')).text()

    expect(html).toContain('data-testid="pokemon-sheet"')
    expect(html).toContain('<title>Pikachu</title>')
    expect(html).toContain('Pikachu')
    expect(html).toContain('Speed')
  })

  test('le serveur utilise la langue du cookie', async ({ request }) => {
    const response = await request.get('/pokemon/pikachu', {
      headers: { Cookie: 'pokewishlist_locale=de' },
    })
    const html = await response.text()

    expect(html).toContain('lang="de"')
    expect(html).toContain('Initiative')
  })

  test('une page affichée avec JavaScript coupé montre la fiche', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()

    await page.goto('http://localhost:3000/pokemon/pikachu')

    await expect(page.getByRole('heading', { name: 'Pikachu', level: 1 })).toBeVisible()
    await context.close()
  })

  for (const path of ['/', '/liste-complete', '/pokemon/pikachu', '/pokemon/bulbasaur']) {
    test(`pas d'erreur d'hydratation sur ${path}, même en français`, async ({ page }) => {
      const problems: string[] = []
      page.on('pageerror', error => problems.push(error.message))
      page.on('console', message => {
        if (/hydrat/i.test(message.text())) problems.push(message.text())
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      expect(problems).toEqual([])
    })
  }
})

test.describe('pré-génération', () => {
  const FILE = '.output/public/pokemon/bulbasaur/index.html'

  test('le build écrit un fichier HTML pour chaque route injectée', () => {
    for (const name of ['bulbasaur', 'ivysaur', 'venusaur']) {
      expect(existsSync(`.output/public/pokemon/${name}/index.html`)).toBe(true)
    }
    expect(readFileSync(FILE, 'utf8')).toContain('Bulbasaur')
  })

  test('une page pré-générée s’affiche dans la langue choisie', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur')

    await expect(page.getByRole('heading', { name: 'Bulbizarre', level: 1 })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  })
})
