import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WishlistItem } from '~/types/pokemon'
import {
  isWishlistItem,
  PRENOMS_KEY,
  readShowPrenoms,
  readWishlist,
  saveShowPrenoms,
  saveWishlist,
  WISHLIST_KEY,
} from '~/utils/wishlistStorage'

const SALAMECHE: WishlistItem = {
  pokemon: { id: 4, speciesId: 4, name: 'Salamèche', types: ['fire'], image: 'grande.png' },
  nickname: 'Salahedine',
  addedAt: '2026-11-02T10:00:00.000Z',
}

function createStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorage())
})

describe('sauvegarde et lecture', () => {
  it('relit exactement ce qui a été sauvegardé', () => {
    saveWishlist([SALAMECHE])

    expect(readWishlist()).toEqual([SALAMECHE])
  })

  it('écrit la wishlist en JSON sous sa clé', () => {
    saveWishlist([SALAMECHE])

    expect(JSON.parse(localStorage.getItem(WISHLIST_KEY) ?? '')).toEqual([SALAMECHE])
  })

  it("remplace l'ancienne sauvegarde", () => {
    saveWishlist([SALAMECHE])
    saveWishlist([])

    expect(readWishlist()).toEqual([])
  })

  it("garde le choix d'afficher les prénoms", () => {
    saveShowPrenoms(true)
    expect(readShowPrenoms()).toBe(true)

    saveShowPrenoms(false)
    expect(readShowPrenoms()).toBe(false)
  })
})

describe('stockage vide', () => {
  it('renvoie une wishlist vide', () => {
    expect(readWishlist()).toEqual([])
  })

  it("n'affiche pas les prénoms par défaut", () => {
    expect(readShowPrenoms()).toBe(false)
  })
})

describe('JSON invalide', () => {
  it.each([
    ['du JSON coupé', '[{"pokemon":'],
    ['du texte', 'pas du json'],
    ['une chaîne vide', ''],
  ])('renvoie une wishlist vide pour %s', (_label, saved) => {
    localStorage.setItem(WISHLIST_KEY, saved)

    expect(readWishlist()).toEqual([])
  })

  it.each([
    ['null', 'null'],
    ['un nombre', '42'],
    ['un objet', '{"pokemon":{"id":4}}'],
  ])(
    "renvoie une wishlist vide pour du JSON valide qui n'est pas une liste : %s",
    (_label, saved) => {
      localStorage.setItem(WISHLIST_KEY, saved)

      expect(readWishlist()).toEqual([])
    },
  )

  it('garde les entrées valides et ignore les autres', () => {
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify([null, 12, { pokemon: 'pikachu' }, SALAMECHE]),
    )

    expect(readWishlist()).toEqual([SALAMECHE])
  })

  it('ignore un réglage de prénoms corrompu', () => {
    localStorage.setItem(PRENOMS_KEY, 'oui{')

    expect(readShowPrenoms()).toBe(false)
  })
})

describe('stockage indisponible', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Accès refusé')
      },
      setItem: () => {
        throw new Error('Stockage plein')
      },
    })
  })

  it('la lecture renvoie une wishlist vide', () => {
    expect(readWishlist()).toEqual([])
  })

  it('la sauvegarde ne plante pas', () => {
    expect(() => saveWishlist([SALAMECHE])).not.toThrow()
  })
})

describe('isWishlistItem', () => {
  it('accepte une entrée sans surnom et sans image', () => {
    const item = {
      pokemon: { ...SALAMECHE.pokemon, image: null },
      addedAt: SALAMECHE.addedAt,
    }

    expect(isWishlistItem(item)).toBe(true)
  })

  it.each([
    ['une date manquante', { pokemon: SALAMECHE.pokemon }],
    ["un surnom qui n'est pas du texte", { ...SALAMECHE, nickname: 12 }],
    ['un numéro en texte', { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, id: '4' } }],
    [
      "un numéro d'espèce manquant",
      { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, speciesId: undefined } },
    ],
    ['un nom manquant', { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, name: undefined } }],
    ['une image invalide', { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, image: 12 } }],
    [
      'des types qui ne sont pas une liste',
      { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, types: 'fire' } },
    ],
    [
      "un type qui n'est pas du texte",
      { ...SALAMECHE, pokemon: { ...SALAMECHE.pokemon, types: [1] } },
    ],
  ])('refuse %s', (_label, item) => {
    expect(isWishlistItem(item)).toBe(false)
  })
})
