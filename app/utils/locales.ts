export const LOCALES = ['en', 'fr', 'es', 'de'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  de: 'Deutsch',
}

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}
