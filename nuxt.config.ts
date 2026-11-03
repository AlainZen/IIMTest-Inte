// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  // L'application tourne dans le navigateur : elle y lit ses préférences et y appelle l'API.
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title: 'PokéWishlist',
      htmlAttrs: { lang: 'fr' },
      meta: [
        {
          name: 'description',
          content: 'Choisis les 6 Pokémon que tu veux capturer.',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Se règle avec la variable NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:3001',
    },
  },
  css: [
    '@fontsource/dela-gothic-one/latin-400.css',
    '@fontsource/m-plus-rounded-1c/latin-400.css',
    '@fontsource/m-plus-rounded-1c/latin-700.css',
    '~/assets/css/main.css',
  ],
  compatibilityDate: '2025-07-15',
  typescript: {
    // Vérifie aussi les types des tests.
    tsConfig: { include: ['../tests/**/*.ts'] },
  },
})
