import type { ApiWishlistItem, Pokemon, WishlistItem } from '~/types/pokemon'

export class WishlistApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
  }
}

async function toApiError(response: Response): Promise<WishlistApiError> {
  const body = (await response.json().catch(() => null)) as {
    code?: string
    error?: string
  } | null

  return new WishlistApiError(
    body?.error ?? `L'API a répondu ${response.status}`,
    body?.code ?? 'server_error',
  )
}

export function toWishlistItem(item: ApiWishlistItem): WishlistItem {
  return {
    id: item.id,
    addedAt: item.addedAt,
    pokemon: { id: item.pokemonId, name: item.name, types: item.types, image: item.image },
  }
}

export async function fetchWishlist(baseUrl: string): Promise<WishlistItem[]> {
  const response = await fetch(`${baseUrl}/wishlist`)
  if (!response.ok) throw await toApiError(response)

  return ((await response.json()) as ApiWishlistItem[]).map(toWishlistItem)
}

export async function createWishlistItem(baseUrl: string, pokemon: Pokemon): Promise<WishlistItem> {
  const response = await fetch(`${baseUrl}/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pokemonId: pokemon.id,
      name: pokemon.name,
      types: pokemon.types,
      image: pokemon.image,
    }),
  })
  if (!response.ok) throw await toApiError(response)

  return toWishlistItem((await response.json()) as ApiWishlistItem)
}

export async function deleteWishlistItem(baseUrl: string, id: number): Promise<void> {
  const response = await fetch(`${baseUrl}/wishlist/${id}`, { method: 'DELETE' })

  // Un 404 veut dire que l'entrée n'existe déjà plus : c'est le résultat voulu.
  if (!response.ok && response.status !== 404) throw await toApiError(response)
}
