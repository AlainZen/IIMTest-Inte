export const LOCALES = ['en', 'fr', 'es', 'de'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
}

export const LOCALE_COOKIE = 'pokewishlist_locale'

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}
