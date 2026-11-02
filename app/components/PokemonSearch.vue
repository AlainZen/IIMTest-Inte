<script setup lang="ts">
import { PokemonNotFoundError, pokemonNameSuggestions } from '~/utils/pokeapi'
import type { Pokemon } from '~/types/pokemon'

const props = defineProps<{ isInWishlist: (id: number) => boolean }>()
const emit = defineEmits<{ add: [pokemon: Pokemon] }>()

const query = ref<string>('')
const result = ref<Pokemon | null>(null)
const error = ref<string>('')
const loading = ref<boolean>(false)

async function search(): Promise<void> {
  const text = query.value.trim()
  if (!text || loading.value) return

  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await fetchPokemon(text)
  } catch (cause) {
    error.value =
      cause instanceof PokemonNotFoundError
        ? `Aucun Pokémon trouvé pour « ${text} ». Vérifie l'orthographe ou essaie son numéro.`
        : 'PokeAPI ne répond pas. Vérifie ta connexion et relance la recherche.'
  } finally {
    loading.value = false
  }
}

function addResult(): void {
  if (!result.value) return
  emit('add', result.value)
  result.value = null
  query.value = ''
}
</script>

<template>
  <div class="search">
    <form class="search-bar" role="search" @submit.prevent="search">
      <label class="sr-only" for="search-input">Nom ou numéro du Pokémon</label>
      <input
        id="search-input"
        v-model="query"
        type="search"
        list="pokemon-names"
        placeholder="Salamèche ou 150"
        autocomplete="off"
      />
      <datalist id="pokemon-names">
        <option v-for="name in pokemonNameSuggestions" :key="name" :value="name" />
      </datalist>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Recherche…' : 'Chercher' }}
      </button>
    </form>

    <p v-if="error" class="search-error" role="alert">
      {{ error }}
    </p>

    <div v-if="result" class="result" aria-live="polite">
      <div class="result-art" :style="{ background: typeBackground(result.types) }">
        <img v-if="result.image" :src="result.image" alt="" width="96" height="96" />
      </div>
      <div class="result-text">
        <strong class="result-name">{{ result.name }}</strong>
        <PokemonTypes :types="result.types" />
      </div>
      <button
        type="button"
        class="button-primary"
        :disabled="props.isInWishlist(result.id)"
        @click="addResult"
      >
        {{ props.isInWishlist(result.id) ? 'Déjà dans ta wishlist' : 'Ajouter à ma wishlist' }}
      </button>
    </div>
  </div>
</template>
