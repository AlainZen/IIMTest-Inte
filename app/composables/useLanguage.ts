import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '~/utils/locales'
import { LOCALE_COOKIE } from '~/utils/locales'

interface Language {
  t: ReturnType<typeof useI18n>['t']
  locale: ComputedRef<Locale>
  setLocale: (value: Locale) => void
}

const ONE_YEAR = 60 * 60 * 24 * 365

// La langue est gardée dans un cookie : le serveur doit la connaître pour rendre la page.
export function useLocaleCookie(): Ref<string | null | undefined> {
  return useCookie<string | null | undefined>(LOCALE_COOKIE, {
    maxAge: ONE_YEAR,
    sameSite: 'lax',
    path: '/',
  })
}

export function useLanguage(): Language {
  const { t, locale } = useI18n({ useScope: 'global' })
  const cookie = useLocaleCookie()

  function setLocale(value: Locale): void {
    locale.value = value
    cookie.value = value
  }

  return { t, locale: computed<Locale>(() => locale.value as Locale), setLocale }
}
