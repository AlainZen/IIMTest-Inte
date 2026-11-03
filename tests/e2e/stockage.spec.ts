import { expect, test } from '@playwright/test'
import { clearWishlist, mockPokeApi, searchAndAdd, useFrench } from './helpers'

const NICKNAMES_KEY = 'pokewishlist:nicknames'
const PRENOMS_KEY = 'pokewishlist:show-prenoms'

const CORRUPTED_VALUES: [string, string][] = [
  ['du JSON coupé', '{"4":'],
  ['du texte', 'pas du json'],
  ["du JSON qui n'est pas un objet", '[1,2,3]'],
  ['des surnoms invalides', '{"4":12,"abc":null}'],
]

for (const [label, value] of CORRUPTED_VALUES) {
  test(`l'application démarre avec ${label} dans le localStorage`, async ({ page, request }) => {
    const crashes: Error[] = []
    page.on('pageerror', error => crashes.push(error))
    await clearWishlist(request)
    await mockPokeApi(page)
    await useFrench(page)

    await page.goto('/')
    await page.evaluate(
      ([nicknamesKey, prenomsKey, saved]) => {
        localStorage.setItem(nicknamesKey, saved)
        localStorage.setItem(prenomsKey, saved)
      },
      [NICKNAMES_KEY, PRENOMS_KEY, value] as const,
    )
    await page.reload()

    await expect(page.getByText('Ta wishlist est vide')).toBeVisible()

    await searchAndAdd(page, 'salameche')
    // Attend la fin de l'ajout : rafraîchir avant annulerait la requête encore en cours.
    await expect(page.getByTestId('pokemon-card')).toHaveCount(1)
    await page.reload()

    await expect(page.getByRole('heading', { name: 'Salamèche' })).toBeVisible()
    expect(crashes).toEqual([])
  })
}
