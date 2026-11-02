<script setup lang="ts">
import type { PokedexEntry } from '~/types/pokemon'

defineProps<{
  entry: PokedexEntry
  title: string
  inWishlist: boolean
  loading: boolean
}>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <article class="entry" :class="{ 'entry-added': inWishlist }" data-testid="pokedex-entry">
    <div class="entry-art">
      <img :src="entry.image" alt="" width="96" height="96" loading="lazy" decoding="async" />
    </div>
    <div class="entry-body">
      <div class="entry-names">
        <p class="entry-number">n° {{ entry.id }}</p>
        <h2 class="entry-name">
          {{ title }}
        </h2>
        <p v-if="title !== entry.name" class="card-official">
          {{ entry.name }}
        </p>
      </div>
      <button
        type="button"
        class="entry-button"
        :disabled="loading"
        :aria-label="`${inWishlist ? 'Retirer' : 'Ajouter'} ${title}`"
        @click="emit('toggle')"
      >
        {{ loading ? 'Ajout…' : inWishlist ? 'Retirer' : 'Ajouter' }}
      </button>
    </div>
  </article>
</template>
