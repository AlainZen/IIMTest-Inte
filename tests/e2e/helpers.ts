import type { APIRequestContext, APIResponse, Page } from '@playwright/test'

export const API_URL = 'http://localhost:3001'

// Un appel raté doit arrêter le test ici, plutôt que provoquer une erreur trompeuse plus loin.
async function expectOk(response: APIResponse, action: string): Promise<void> {
  if (!response.ok()) {
    throw new Error(`${action} : l'API a répondu ${response.status()} ${await response.text()}`)
  }
}

// Vide la vraie wishlist en passant par l'API, avant chaque test.
export async function clearWishlist(request: APIRequestContext): Promise<void> {
  const response = await request.get(`${API_URL}/wishlist`)
  await expectOk(response, 'Lecture de la wishlist')
  const items = (await response.json()) as { id: number }[]

  for (const item of items) {
    const deleted = await request.delete(`${API_URL}/wishlist/${item.id}`)
    await expectOk(deleted, `Suppression de l'entrée ${item.id}`)
  }
}

export async function addThroughApi(request: APIRequestContext, ...ids: number[]): Promise<void> {
  for (const id of ids) {
    const response = await request.post(`${API_URL}/wishlist`, {
      data: { pokemonId: id, name: `Pokémon ${id}`, types: ['normal'], image: null },
    })
    await expectOk(response, `Ajout du Pokémon ${id}`)
  }
}

export async function namesInApi(request: APIRequestContext): Promise<string[]> {
  const response = await request.get(`${API_URL}/wishlist`)
  const items = (await response.json()) as { name: string }[]

  return items.map(item => item.name)
}

// Seule PokeAPI, un service extérieur, est simulée. Le front, Hono et PostgreSQL sont réels.
export async function mockPokeApi(page: Page): Promise<void> {
  await page.route('https://raw.githubusercontent.com/**', route => route.abort())
  await page.route('https://pokeapi.co/api/v2/pokemon/*', route => {
    const id = Number(route.request().url().split('/').pop())

    return Number.isInteger(id)
      ? route.fulfill({
          json: {
            id,
            name: `pokemon-${id}`,
            species: { url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
            types: [{ type: { name: 'fire' } }],
            sprites: { front_default: null },
            height: 4,
            weight: 60,
            abilities: [{ ability: { name: 'lightning-rod' } }],
            stats: [
              { base_stat: 35, stat: { name: 'hp' } },
              { base_stat: 90, stat: { name: 'speed' } },
            ],
          },
        })
      : route.fulfill({ status: 404, body: 'Not Found' })
  })
}

// La plupart des tests lisent l'interface en français. L'anglais par défaut a ses propres tests.
export async function useFrench(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('pokewishlist:locale', JSON.stringify('fr'))
  })
}

export async function searchAndAdd(page: Page, query: string): Promise<void> {
  await page.getByLabel('Nom ou numéro du Pokémon').fill(query)
  await page.getByRole('button', { name: 'Chercher' }).click()
  await page.getByRole('button', { name: 'Ajouter à ma wishlist' }).click()
}
