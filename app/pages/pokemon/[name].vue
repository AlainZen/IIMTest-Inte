<script setup lang="ts">
import type { PokemonDetails } from '~/types/pokemon'
import { PokemonNotFoundError } from '~/utils/pokeapi'

type SheetResult = { found: true; pokemon: PokemonDetails } | { found: false }

const STAT_MAX = 255

const route = useRoute()
const event = useRequestEvent()
const pokeApiBase = useRuntimeConfig().public.pokeApiBase
const { t, locale } = useLanguage()
const { isFull, has, add, remove } = useWishlist()

const requestedName = computed<string>(() => String(route.params.name))
const actionError = ref<string>('')

// Sur une première visite, le serveur lit PokeAPI et envoie la fiche déjà remplie.
const { data, status, refresh } = await useAsyncData<SheetResult>(
  () => `pokemon-${requestedName.value}`,
  async () => {
    try {
      return { found: true, pokemon: await fetchPokemonDetails(requestedName.value, pokeApiBase) }
    } catch (error) {
      if (error instanceof PokemonNotFoundError) return { found: false }
      throw error
    }
  },
)

const pokemon = computed<PokemonDetails | null>(() =>
  data.value?.found ? data.value.pokemon : null,
)
const isNotFound = computed<boolean>(() => data.value?.found === false)
const displayedName = computed<string>(() =>
  pokemon.value ? localizedName(pokemon.value, locale.value) : requestedName.value,
)

// Une fiche inconnue répond un vrai 404, pas une page vide en 200.
if (isNotFound.value && event) setResponseStatus(event, 404)

useHead({ title: () => displayedName.value })

function formatNumber(value: number): string {
  return value.toLocaleString(locale.value)
}

function formatAbility(ability: string): string {
  return ability.replaceAll('-', ' ')
}

async function toggleWishlist(current: PokemonDetails): Promise<void> {
  actionError.value = ''
  if (has(current.id)) {
    const removed = await remove(current.id)
    if (!removed) actionError.value = t('wishlist.removeFailed', { name: displayedName.value })
    return
  }

  const outcome = await add(current)
  if (!outcome.ok) actionError.value = outcome.message
}
</script>

<template>
  <div class="sheet-page">
    <NuxtLink class="sheet-back" to="/liste-complete">{{ t('sheet.back') }}</NuxtLink>

    <p v-if="status === 'pending'" class="empty">{{ t('sheet.loading') }}</p>

    <div v-else-if="isNotFound" class="empty" role="alert">
      <h1 class="sheet-missing">{{ t('sheet.notFound', { name: requestedName }) }}</h1>
      <p>{{ t('sheet.notFoundHelp') }}</p>
    </div>

    <div v-else-if="status === 'error'" class="empty" role="alert">
      <p>{{ t('sheet.pokeapiDown') }}</p>
      <button type="button" class="button-primary empty-action" @click="refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <article v-else-if="pokemon" class="sheet" data-testid="pokemon-sheet">
      <div class="sheet-art" :style="{ background: typeBackground(pokemon.types) }">
        <span class="card-number">{{ t('pokemon.number', { id: pokemon.id }) }}</span>
        <img
          v-if="pokemon.image"
          :src="pokemon.image"
          :alt="displayedName"
          width="320"
          height="320"
        />
      </div>

      <div class="sheet-body">
        <h1 class="sheet-name">{{ displayedName }}</h1>
        <PokemonTypes :types="pokemon.types" />

        <dl class="sheet-facts">
          <div>
            <dt>{{ t('sheet.height') }}</dt>
            <dd>{{ formatNumber(pokemon.height) }} m</dd>
          </div>
          <div>
            <dt>{{ t('sheet.weight') }}</dt>
            <dd>{{ formatNumber(pokemon.weight) }} kg</dd>
          </div>
          <div>
            <dt>{{ t('sheet.abilities') }}</dt>
            <dd class="sheet-abilities">
              {{ pokemon.abilities.map(formatAbility).join(', ') }}
            </dd>
          </div>
        </dl>

        <h2 class="sheet-title">{{ t('sheet.stats') }}</h2>
        <ul class="stats">
          <li v-for="stat in pokemon.stats" :key="stat.name" class="stat">
            <span>{{ t(`stats.${stat.name}`, stat.name) }}</span>
            <strong>{{ stat.value }}</strong>
            <span class="stat-bar">
              <span :style="{ width: `${(stat.value / STAT_MAX) * 100}%` }" />
            </span>
          </li>
        </ul>

        <p v-if="actionError" class="search-error" role="alert">{{ actionError }}</p>

        <button
          type="button"
          class="button-primary sheet-action"
          :disabled="isFull && !has(pokemon.id)"
          @click="toggleWishlist(pokemon)"
        >
          <template v-if="has(pokemon.id)">{{ t('pokedex.remove') }}</template>
          <template v-else-if="isFull">{{ t('search.full') }}</template>
          <template v-else>{{ t('search.add') }}</template>
        </button>
      </div>
    </article>
  </div>
</template>
