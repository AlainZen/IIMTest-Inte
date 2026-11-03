<script setup lang="ts">
import type { Pokemon } from '~/types/pokemon'

useHead({ title: 'Ma wishlist' })

const { items, status, isFull, load, has, add, remove, rename, displayName } = useWishlist()

const actionError = ref<string>('')

async function addFromSearch(pokemon: Pokemon): Promise<void> {
  actionError.value = ''
  const outcome = await add(pokemon)
  if (!outcome.ok) actionError.value = outcome.message
}

async function removeItem(pokemonId: number, name: string): Promise<void> {
  actionError.value = ''
  const removed = await remove(pokemonId)
  if (!removed) actionError.value = `${name} n'a pas été retiré : l'API ne répond pas.`
}
</script>

<template>
  <div>
    <PokemonSearch :is-in-wishlist="has" :is-full="isFull" @add="addFromSearch" />

    <section class="list" aria-labelledby="list-title">
      <div class="list-head">
        <h1 id="list-title">
          Ma wishlist <span class="list-count">({{ items.length }}/{{ MAX_WISHLIST_SIZE }})</span>
        </h1>
        <PrenomsToggle />
      </div>

      <p v-if="actionError" class="search-error page-error" role="alert">
        {{ actionError }}
      </p>

      <div v-if="status === 'error'" class="empty" role="alert">
        <p>L'API ne répond pas. Vérifie qu'elle est lancée, puis réessaie.</p>
        <button type="button" class="button-primary empty-action" @click="load">Réessayer</button>
      </div>

      <p v-else-if="status === 'loading'" class="empty">Chargement de ta wishlist…</p>

      <p v-else-if="items.length === 0" class="empty">
        Ta wishlist est vide. Cherche un Pokémon ou parcours la
        <NuxtLink to="/liste-complete">liste complète</NuxtLink>.
      </p>

      <TransitionGroup v-else name="card" tag="div" class="grid">
        <PokemonCard
          v-for="item in items"
          :key="item.pokemon.id"
          :item="item"
          :title="displayName(item)"
          @remove="removeItem(item.pokemon.id, item.pokemon.name)"
          @rename="rename(item.pokemon.id, $event)"
        />
      </TransitionGroup>
    </section>
  </div>
</template>
