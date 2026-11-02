<template>
  <div>
    <NuxtRouteAnnouncer />
    <header class="top">
      <p class="brand">
        Mon Pokédex
      </p>
      <nav
        class="nav"
        aria-label="Pages"
      >
        <NuxtLink to="/">
          Ma wishlist
        </NuxtLink>
        <NuxtLink to="/liste-complete">
          Liste complète
        </NuxtLink>
      </nav>
    </header>

    <main>
      <NuxtPage />
    </main>
  </div>
</template>
