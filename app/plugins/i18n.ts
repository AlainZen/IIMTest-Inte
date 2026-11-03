import { createI18n } from 'vue-i18n'
import de from '~/locales/de.json'
import en from '~/locales/en.json'
import es from '~/locales/es.json'
import fr from '~/locales/fr.json'
import { DEFAULT_LOCALE } from '~/utils/locales'

export default defineNuxtPlugin(nuxtApp => {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    // L'anglais est la langue par défaut, tant que l'utilisateur n'en a pas choisi une autre.
    locale: readLocale(),
    fallbackLocale: DEFAULT_LOCALE,
    messages: { en, fr, es, de },
  })

  nuxtApp.vueApp.use(i18n)
})
