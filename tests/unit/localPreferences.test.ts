import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NICKNAMES_KEY,
  PRENOMS_KEY,
  readNicknames,
  readShowPrenoms,
  saveNicknames,
  saveShowPrenoms,
} from '~/utils/localPreferences'

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
  it('relit exactement les surnoms sauvegardés', () => {
    saveNicknames({ 4: 'Salahedine', 25: 'Bachir' })

    expect(readNicknames()).toEqual({ 4: 'Salahedine', 25: 'Bachir' })
  })

  it('écrit les surnoms en JSON sous leur clé', () => {
    saveNicknames({ 4: 'Salahedine' })

    expect(JSON.parse(localStorage.getItem(NICKNAMES_KEY) ?? '')).toEqual({ 4: 'Salahedine' })
  })

  it('remplace l’ancienne sauvegarde', () => {
    saveNicknames({ 4: 'Salahedine' })
    saveNicknames({})

    expect(readNicknames()).toEqual({})
  })

  it('garde le choix d’afficher les prénoms', () => {
    saveShowPrenoms(true)
    expect(readShowPrenoms()).toBe(true)

    saveShowPrenoms(false)
    expect(readShowPrenoms()).toBe(false)
  })
})

describe('stockage vide', () => {
  it('ne renvoie aucun surnom', () => {
    expect(readNicknames()).toEqual({})
  })

  it('n’affiche pas les prénoms par défaut', () => {
    expect(readShowPrenoms()).toBe(false)
  })
})

describe('JSON invalide', () => {
  it.each([
    ['du JSON coupé', '{"4":'],
    ['du texte', 'pas du json'],
    ['une chaîne vide', ''],
    ['null', 'null'],
    ['un nombre', '42'],
    ['une liste', '["Salahedine"]'],
  ])('ne renvoie aucun surnom pour %s', (_label, saved) => {
    localStorage.setItem(NICKNAMES_KEY, saved)

    expect(readNicknames()).toEqual({})
  })

  it('garde les surnoms valides et ignore les autres', () => {
    localStorage.setItem(NICKNAMES_KEY, '{"4":"Salahedine","25":12,"abc":"Bachir"}')

    expect(readNicknames()).toEqual({ 4: 'Salahedine' })
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

  it('la lecture ne plante pas', () => {
    expect(readNicknames()).toEqual({})
    expect(readShowPrenoms()).toBe(false)
  })

  it('la sauvegarde ne plante pas', () => {
    expect(() => saveNicknames({ 4: 'Salahedine' })).not.toThrow()
    expect(() => saveShowPrenoms(true)).not.toThrow()
  })
})
