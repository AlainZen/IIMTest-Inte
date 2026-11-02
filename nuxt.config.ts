// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  // La liste vit dans le localStorage, qui n'existe que dans le navigateur :
  // le rendu serveur n'apporterait rien ici et afficherait une liste vide au chargement.
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Mon Pokédex',
      htmlAttrs: { lang: 'fr' },
      meta: [{ name: 'description', content: 'Cherche des Pokémon et garde ta liste dans ton navigateur.' }],
    },
  },
  css: [
    '@fontsource/dela-gothic-one/latin-400.css',
    '@fontsource/m-plus-rounded-1c/latin-400.css',
    '@fontsource/m-plus-rounded-1c/latin-700.css',
    '~/assets/css/main.css',
  ],
  compatibilityDate: '2025-07-15',
})
