import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '~/utils/locales'

interface Language {
  t: ReturnType<typeof useI18n>['t']
  locale: ComputedRef<Locale>
  setLocale: (value: Locale) => void
}

export function useLanguage(): Language {
  const { t, locale } = useI18n({ useScope: 'global' })

  function setLocale(value: Locale): void {
    locale.value = value
    saveLocale(value)
  }

  return { t, locale: computed<Locale>(() => locale.value as Locale), setLocale }
}
