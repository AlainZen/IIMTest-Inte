// https://nuxt.com/docs/api/configuration/nuxt-config

const DEFAULT_POKEAPI_URL = 'https://pokeapi.co/api/v2'
// La première génération suffit pour le TP et évite 1025 appels à PokeAPI à chaque build.
const DEFAULT_PRERENDER_LIMIT = 151

async function fetchPrerenderRoutes(): Promise<string[]> {
  const limit = Number(process.env.PRERENDER_LIMIT ?? DEFAULT_PRERENDER_LIMIT)
  if (!limit) return []

  const baseUrl = process.env.NUXT_PUBLIC_POKE_API_BASE ?? DEFAULT_POKEAPI_URL
  const response = await fetch(`${baseUrl}/pokemon-species?limit=${limit}`)
  if (!response.ok) throw new Error(`PokeAPI a répondu ${response.status} pendant le build`)

  const { results } = (await response.json()) as { results: { name: string }[] }
  return results.map(pokemon => `/pokemon/${pokemon.name}`)
}

export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  devtools: { enabled: true },
  app: {
    head: {
      title: 'PokéWishlist',
      meta: [
        {
          name: 'description',
          content: 'Choose the 6 Pokémon you want to catch.',
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Se règle avec la variable NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:3001',
      // Se règle avec la variable NUXT_PUBLIC_POKE_API_BASE.
      pokeApiBase: DEFAULT_POKEAPI_URL,
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
  nitro: {
    hooks: {
      // Injecte les fiches à générer. Ce hook ne tourne qu'au build, pas à l'installation.
      // Avec nuxt build, les autres fiches sont rendues par le serveur à la demande.
      // Avec nuxt generate, Nitro suit aussi les liens de la liste complète : les 1025 fiches sont écrites.
      async 'prerender:routes'(routes) {
        for (const route of await fetchPrerenderRoutes()) routes.add(route)
      },
    },
  },
})
