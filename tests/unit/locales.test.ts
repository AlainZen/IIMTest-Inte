import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, isLocale, resolveLocale } from '~/utils/locales'

describe('langues', () => {
  it('a l’anglais pour langue par défaut', () => {
    expect(DEFAULT_LOCALE).toBe('en')
  })

  it.each(['en', 'fr', 'es', 'de'])('accepte %s', locale => {
    expect(isLocale(locale)).toBe(true)
    expect(resolveLocale(locale)).toBe(locale)
  })

  it.each(['ja', '', null, undefined, 12])('revient à l’anglais pour %s', value => {
    expect(isLocale(value)).toBe(false)
    expect(resolveLocale(value)).toBe('en')
  })
})
