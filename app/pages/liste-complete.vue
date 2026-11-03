<script setup lang="ts">
import type { PokedexEntry } from '~/types/pokemon'
import { pokedexEntries } from '~/utils/pokeapi'

const { t, locale } = useLanguage()
const pokeApiBase = useRuntimeConfig().public.pokeApiBase
const { items, showPrenoms, isFull, has, add, remove } = useWishlist()

useHead({ title: () => t('nav.pokedex') })

const filter = ref<string>('')
const pendingIds = ref<Set<number>>(new Set())
const error = ref<string>('')

function nameOf(entry: PokedexEntry): string {
  return pokedexName(entry.id, locale.value)
}

function titleOf(entry: PokedexEntry): string {
  return showPrenoms.value ? prenomOf(entry.id) : nameOf(entry)
}

function matches(entry: PokedexEntry, text: string): boolean {
  return (
    matchesPokedexEntry(entry.id, text) ||
    (showPrenoms.value && normalize(prenomOf(entry.id)).includes(text))
  )
}

const visibleEntries = computed<readonly PokedexEntry[]>(() => {
  const text = normalize(filter.value)
  return text ? pokedexEntries.filter(entry => matches(entry, text)) : pokedexEntries
})

async function addEntry(entry: PokedexEntry): Promise<void> {
  // Les détails du Pokémon ne sont demandés à PokeAPI qu'au moment de l'ajouter.
  let pokemon
  try {
    pokemon = await fetchPokemon(String(entry.id), pokeApiBase)
  } catch {
    error.value = t('pokedex.pokeapiDown', { name: nameOf(entry) })
    return
  }

  const outcome = await add(pokemon)
  if (!outcome.ok) error.value = outcome.message
}

async function toggle(entry: PokedexEntry): Promise<void> {
  error.value = ''
  pendingIds.value.add(entry.id)

  if (has(entry.id)) {
    const removed = await remove(entry.id)
    if (!removed) error.value = t('wishlist.removeFailed', { name: nameOf(entry) })
  } else {
    await addEntry(entry)
  }

  pendingIds.value.delete(entry.id)
}
</script>

<template>
  <div>
    <form class="search search-sticky" role="search" @submit.prevent>
      <div class="search-bar">
        <label class="sr-only" for="filter-input">{{ t('pokedex.filterLabel') }}</label>
        <input
          id="filter-input"
          v-model="filter"
          type="search"
          :placeholder="t('pokedex.filterPlaceholder')"
          autocomplete="off"
        />
      </div>
    </form>

    <section class="list" aria-labelledby="pokedex-title">
      <div class="list-head">
        <div>
          <h1 id="pokedex-title">
            {{ t('nav.pokedex') }}
            <span class="list-count">({{ visibleEntries.length }})</span>
          </h1>
          <p class="wishlist-meter">
            {{ t('pokedex.meter', { count: items.length, max: MAX_WISHLIST_SIZE }) }}
          </p>
        </div>
        <PrenomsToggle />
      </div>

      <p v-if="error" class="search-error pokedex-error" role="alert">
        {{ error }}
      </p>

      <p v-if="visibleEntries.length === 0" class="empty">
        {{ t('pokedex.noMatch', { filter }) }}
      </p>

      <div v-else class="pokedex">
        <PokedexEntryCard
          v-for="entry in visibleEntries"
          :key="entry.id"
          :entry="entry"
          :name="nameOf(entry)"
          :title="titleOf(entry)"
          :in-wishlist="has(entry.id)"
          :is-full="isFull"
          :loading="pendingIds.has(entry.id)"
          @toggle="toggle(entry)"
        />
      </div>
    </section>
  </div>
</template>
