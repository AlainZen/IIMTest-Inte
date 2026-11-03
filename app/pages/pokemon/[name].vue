<script setup lang="ts">
import type { PokemonDetails } from '~/types/pokemon'
import { PokemonNotFoundError } from '~/utils/pokeapi'

type SheetStatus = 'loading' | 'ready' | 'not-found' | 'error'

const STAT_MAX = 255

const route = useRoute()
const { t, locale } = useLanguage()
const { isFull, has, add, remove } = useWishlist()

const pokemon = ref<PokemonDetails | null>(null)
const status = ref<SheetStatus>('loading')
const actionError = ref<string>('')

const requestedName = computed<string>(() => String(route.params.name))
const displayedName = computed<string>(() =>
  pokemon.value ? localizedName(pokemon.value, locale.value) : requestedName.value,
)

useHead({ title: () => displayedName.value })

async function load(): Promise<void> {
  status.value = 'loading'
  pokemon.value = null
  actionError.value = ''
  try {
    pokemon.value = await fetchPokemonDetails(requestedName.value)
    status.value = 'ready'
  } catch (error) {
    status.value = error instanceof PokemonNotFoundError ? 'not-found' : 'error'
  }
}

watch(requestedName, load, { immediate: true })

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

    <p v-if="status === 'loading'" class="empty">{{ t('sheet.loading') }}</p>

    <div v-else-if="status === 'not-found'" class="empty" role="alert">
      <h1 class="sheet-missing">{{ t('sheet.notFound', { name: requestedName }) }}</h1>
      <p>{{ t('sheet.notFoundHelp') }}</p>
    </div>

    <div v-else-if="status === 'error'" class="empty" role="alert">
      <p>{{ t('sheet.pokeapiDown') }}</p>
      <button type="button" class="button-primary empty-action" @click="load">
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
