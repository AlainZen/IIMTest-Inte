<script setup lang="ts">
import type { Pokemon } from '~/types/pokemon'
import { PokemonNotFoundError } from '~/utils/pokeapi'

const props = defineProps<{ isInWishlist: (id: number) => boolean; isFull: boolean }>()
const emit = defineEmits<{ add: [pokemon: Pokemon] }>()

const { t, locale } = useLanguage()

const query = ref<string>('')
const result = ref<Pokemon | null>(null)
const error = ref<string>('')
const loading = ref<boolean>(false)

const suggestions = computed<readonly string[]>(() => nameSuggestions(locale.value))

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
        ? t('search.notFound', { query: text })
        : t('search.pokeapiDown')
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
      <label class="sr-only" for="search-input">{{ t('search.label') }}</label>
      <input
        id="search-input"
        v-model="query"
        type="search"
        list="pokemon-names"
        :placeholder="t('search.placeholder')"
        autocomplete="off"
      />
      <datalist id="pokemon-names">
        <option v-for="name in suggestions" :key="name" :value="name" />
      </datalist>
      <button type="submit" :disabled="loading">
        {{ loading ? t('search.searching') : t('search.submit') }}
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
        <NuxtLink class="result-name" :to="pokemonPath(result.id)">
          {{ localizedName(result, locale) }}
        </NuxtLink>
        <PokemonTypes :types="result.types" />
      </div>
      <button
        type="button"
        class="button-primary"
        :disabled="props.isInWishlist(result.id) || isFull"
        @click="addResult"
      >
        <template v-if="props.isInWishlist(result.id)">{{ t('search.already') }}</template>
        <template v-else-if="isFull">{{ t('search.full') }}</template>
        <template v-else>{{ t('search.add') }}</template>
      </button>
    </div>
  </div>
</template>
