import type { Locale } from '~/utils/locales'
import { DEFAULT_LOCALE, isLocale } from '~/utils/locales'

export const LOCALE_KEY = 'pokewishlist:locale'
export const NICKNAMES_KEY = 'pokewishlist:nicknames'
export const PRENOMS_KEY = 'pokewishlist:show-prenoms'

export type Nicknames = Record<number, string>

// Le localStorage peut être modifié à la main, plein ou bloqué :
// une lecture ou une écriture ratée ne doit jamais faire planter l'application.
function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Stockage plein ou bloqué : le réglage reste actif jusqu'au prochain rafraîchissement.
  }
}

// Ne garde que les entrées valides : un numéro de Pokémon et un surnom en texte.
export function readNicknames(): Nicknames {
  const saved = readJson(NICKNAMES_KEY)
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return {}

  return Object.fromEntries(
    Object.entries(saved).filter(
      ([id, nickname]) => Number.isInteger(Number(id)) && typeof nickname === 'string',
    ),
  )
}

export function saveNicknames(nicknames: Nicknames): void {
  writeJson(NICKNAMES_KEY, nicknames)
}

export function readShowPrenoms(): boolean {
  return readJson(PRENOMS_KEY) === true
}

export function saveShowPrenoms(value: boolean): void {
  writeJson(PRENOMS_KEY, value)
}

export function readLocale(): Locale {
  const saved = readJson(LOCALE_KEY)
  return isLocale(saved) ? saved : DEFAULT_LOCALE
}

export function saveLocale(value: Locale): void {
  writeJson(LOCALE_KEY, value)
}
