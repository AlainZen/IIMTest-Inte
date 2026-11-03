<script setup lang="ts">
const { t, locale } = useLanguage()
const { load } = useWishlist()

useHead({ htmlAttrs: { lang: locale } })

onMounted(load)
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <header class="top">
      <LanguageSwitcher />
      <p class="brand">PokéWishlist</p>
      <nav class="nav" :aria-label="t('nav.pages')">
        <NuxtLink to="/">{{ t('nav.wishlist') }}</NuxtLink>
        <NuxtLink to="/liste-complete">{{ t('nav.pokedex') }}</NuxtLink>
      </nav>
    </header>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>
