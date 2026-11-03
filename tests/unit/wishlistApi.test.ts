import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiWishlistItem, Pokemon } from '~/types/pokemon'
import {
  createWishlistItem,
  deleteWishlistItem,
  fetchWishlist,
  likeWishlistItem,
  WishlistApiError,
} from '~/utils/wishlistApi'

const BASE_URL = 'http://api.test'

const API_ITEM: ApiWishlistItem = {
  id: 7,
  pokemonId: 25,
  name: 'Pikachu',
  types: ['electric'],
  image: 'pikachu.png',
  likes: 2,
  addedAt: '2026-11-03T10:00:00.000Z',
}

const PIKACHU: Pokemon = { id: 25, name: 'Pikachu', types: ['electric'], image: 'pikachu.png' }

const fetchMock = vi.fn<typeof fetch>()

function respondWith(status: number, body?: unknown): void {
  fetchMock.mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

describe('fetchWishlist', () => {
  it('appelle GET /wishlist et convertit les entrées', async () => {
    respondWith(200, [API_ITEM])

    await expect(fetchWishlist(BASE_URL, 'fr')).resolves.toEqual([
      { id: 7, addedAt: API_ITEM.addedAt, likes: 2, pokemon: PIKACHU },
    ])
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${BASE_URL}/wishlist`, {
      headers: { 'Accept-Language': 'fr' },
    })
  })

  it('lance une erreur si l’API répond 500', async () => {
    respondWith(500, { code: 'server_error', error: 'Panne' })

    await expect(fetchWishlist(BASE_URL, 'fr')).rejects.toMatchObject({
      code: 'server_error',
      message: 'Panne',
    })
  })

  it('gère une erreur sans corps JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }))

    await expect(fetchWishlist(BASE_URL, 'fr')).rejects.toMatchObject({
      code: 'server_error',
      message: "L'API a répondu 502",
    })
  })
})

describe('createWishlistItem', () => {
  it('envoie le Pokémon en POST et renvoie l’entrée créée', async () => {
    respondWith(201, API_ITEM)

    await expect(createWishlistItem(BASE_URL, PIKACHU, 'fr')).resolves.toMatchObject({
      id: 7,
      pokemon: PIKACHU,
    })

    const [url, options] = fetchMock.mock.calls[0] ?? []
    expect(url).toBe(`${BASE_URL}/wishlist`)
    expect(options?.method).toBe('POST')
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      'Accept-Language': 'fr',
    })
    expect(JSON.parse(String(options?.body))).toEqual({
      pokemonId: 25,
      name: 'Pikachu',
      types: ['electric'],
      image: 'pikachu.png',
    })
  })

  it.each(['duplicate', 'full'])('transmet le refus %s de l’API', async code => {
    respondWith(409, { code, error: 'Refusé' })

    const error = await createWishlistItem(BASE_URL, PIKACHU, 'fr').catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(WishlistApiError)
    expect(error).toMatchObject({ code })
  })
})

describe('deleteWishlistItem', () => {
  it('appelle DELETE /wishlist/:id', async () => {
    respondWith(204)

    await deleteWishlistItem(BASE_URL, 7, 'fr')

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${BASE_URL}/wishlist/7`, {
      method: 'DELETE',
      headers: { 'Accept-Language': 'fr' },
    })
  })

  it('accepte un 404 : l’entrée n’existe déjà plus', async () => {
    respondWith(404, { code: 'not_found', error: 'Absent' })

    await expect(deleteWishlistItem(BASE_URL, 7, 'fr')).resolves.toBeUndefined()
  })

  it('lance une erreur si l’API répond 500', async () => {
    respondWith(500, { code: 'server_error', error: 'Panne' })

    await expect(deleteWishlistItem(BASE_URL, 7, 'fr')).rejects.toBeInstanceOf(WishlistApiError)
  })
})

describe('likeWishlistItem', () => {
  it('appelle POST /wishlist/:id/like et renvoie le nouveau total', async () => {
    respondWith(200, { ...API_ITEM, likes: 3 })

    await expect(likeWishlistItem(BASE_URL, 7, 'de')).resolves.toMatchObject({ id: 7, likes: 3 })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${BASE_URL}/wishlist/7/like`, {
      method: 'POST',
      headers: { 'Accept-Language': 'de' },
    })
  })

  it('lance une erreur si l’entrée n’existe plus', async () => {
    respondWith(404, { code: 'not_found', error: 'Aucune entrée' })

    await expect(likeWishlistItem(BASE_URL, 7, 'fr')).rejects.toBeInstanceOf(WishlistApiError)
  })
})
