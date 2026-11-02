<script setup lang="ts">
useHead({ title: 'Ma wishlist' })

const { items, has, add, remove, rename, displayName } = useWishlist()
</script>

<template>
  <div>
    <PokemonSearch
      :is-in-wishlist="has"
      @add="add"
    />

    <section
      class="list"
      aria-labelledby="list-title"
    >
      <div class="list-head">
        <h1 id="list-title">
          Ma wishlist <span class="list-count">({{ items.length }})</span>
        </h1>
        <PrenomsToggle />
      </div>

      <p
        v-if="items.length === 0"
        class="empty"
      >
        Ta wishlist est vide. Cherche un Pokémon ou parcours la
        <NuxtLink to="/liste-complete">liste complète</NuxtLink>.
      </p>

      <TransitionGroup
        v-else
        name="card"
        tag="div"
        class="grid"
      >
        <PokemonCard
          v-for="item in items"
          :key="item.pokemon.id"
          :item="item"
          :title="displayName(item)"
          @remove="remove(item.pokemon.id)"
          @rename="rename(item.pokemon.id, $event)"
        />
      </TransitionGroup>
    </section>
  </div>
</template>
