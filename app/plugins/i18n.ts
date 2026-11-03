import { createI18n } from 'vue-i18n'
import de from '~/locales/de.json'
import en from '~/locales/en.json'
import es from '~/locales/es.json'
import fr from '~/locales/fr.json'
import type { Locale } from '~/utils/locales'
import { DEFAULT_LOCALE, resolveLocale } from '~/utils/locales'

export default defineNuxtPlugin(nuxtApp => {
  const cookie = useLocaleCookie()

  // La langue du HTML reçu : sans cookie, comme au build, c'est l'anglais par défaut.
  const renderedLocale = useState<Locale>('rendered-locale', () => resolveLocale(cookie.value))

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: renderedLocale.value,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { en, fr, es, de },
  })

  nuxtApp.vueApp.use(i18n)

  // Une page pré-générée est en anglais : elle passe à la langue choisie une fois hydratée.
  // Changer plus tôt créerait un écart entre le HTML reçu et le rendu du navigateur.
  if (import.meta.client) {
    onNuxtReady(() => {
      i18n.global.locale.value = resolveLocale(cookie.value)
    })
  }
})
