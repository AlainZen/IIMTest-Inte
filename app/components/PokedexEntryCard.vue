<script setup lang="ts">
import type { PokedexEntry } from '~/types/pokemon'

defineProps<{
  entry: PokedexEntry
  name: string
  title: string
  inWishlist: boolean
  isFull: boolean
  loading: boolean
}>()
const emit = defineEmits<{ toggle: [] }>()

const { t } = useLanguage()
</script>

<template>
  <article class="entry" :class="{ 'entry-added': inWishlist }" data-testid="pokedex-entry">
    <NuxtLink class="entry-art" :to="pokemonPath(entry.id)" :aria-label="name" tabindex="-1">
      <img :src="entry.image" alt="" width="96" height="96" loading="lazy" decoding="async" />
    </NuxtLink>
    <div class="entry-body">
      <div class="entry-names">
        <p class="entry-number">{{ t('pokemon.number', { id: entry.id }) }}</p>
        <h2 class="entry-name">
          <NuxtLink :to="pokemonPath(entry.id)">{{ title }}</NuxtLink>
        </h2>
        <p v-if="title !== name" class="card-official">
          {{ name }}
        </p>
      </div>
      <button
        type="button"
        class="entry-button"
        :disabled="loading || (isFull && !inWishlist)"
        :aria-label="t(inWishlist ? 'pokedex.removeAria' : 'pokedex.addAria', { name: title })"
        @click="emit('toggle')"
      >
        <template v-if="loading">{{ t('pokedex.wait') }}</template>
        <template v-else-if="inWishlist">{{ t('pokedex.remove') }}</template>
        <template v-else-if="isFull">{{ t('pokedex.full') }}</template>
        <template v-else>{{ t('pokedex.add') }}</template>
      </button>
    </div>
  </article>
</template>
