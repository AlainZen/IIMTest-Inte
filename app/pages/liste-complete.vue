<script setup lang="ts">
import type { PokedexEntry } from '~/types/pokemon'
import { pokedexEntries } from '~/utils/pokeapi'

useHead({ title: 'Liste complète' })

const { showPrenoms, has, add, remove } = useWishlist()

const filter = ref<string>('')
const pendingIds = ref<Set<number>>(new Set())
const error = ref<string>('')

function titleOf(entry: PokedexEntry): string {
  return showPrenoms.value ? prenomOf(entry.id) : entry.name
}

function matches(entry: PokedexEntry, text: string): boolean {
  return String(entry.id) === text
    || normalize(entry.name).includes(text)
    || (showPrenoms.value && normalize(prenomOf(entry.id)).includes(text))
}

const visibleEntries = computed<readonly PokedexEntry[]>(() => {
  const text = normalize(filter.value)
  return text ? pokedexEntries.filter(entry => matches(entry, text)) : pokedexEntries
})

// Les détails du Pokémon ne sont demandés à PokeAPI qu'au moment de l'ajouter.
async function toggle(entry: PokedexEntry): Promise<void> {
  error.value = ''
  if (has(entry.id)) {
    remove(entry.id)
    return
  }

  pendingIds.value.add(entry.id)
  try {
    add(await fetchPokemon(String(entry.id)))
  }
  catch {
    error.value = `${entry.name} n'a pas été ajouté : PokeAPI ne répond pas. Réessaie dans un instant.`
  }
  finally {
    pendingIds.value.delete(entry.id)
  }
}
</script>

<template>
  <div>
    <form
      class="search search-sticky"
      role="search"
      @submit.prevent
    >
      <div class="search-bar">
        <label
          class="sr-only"
          for="filter-input"
        >Filtrer la liste</label>
        <input
          id="filter-input"
          v-model="filter"
          type="search"
          placeholder="Filtrer par nom ou numéro"
          autocomplete="off"
        >
      </div>
    </form>

    <section
      class="list"
      aria-labelledby="pokedex-title"
    >
      <div class="list-head">
        <h1 id="pokedex-title">
          Liste complète <span class="list-count">({{ visibleEntries.length }})</span>
        </h1>
        <PrenomsToggle />
      </div>

      <p
        v-if="error"
        class="search-error pokedex-error"
        role="alert"
      >
        {{ error }}
      </p>

      <p
        v-if="visibleEntries.length === 0"
        class="empty"
      >
        Aucun Pokémon ne correspond à « {{ filter }} ». Essaie un autre nom.
      </p>

      <div
        v-else
        class="pokedex"
      >
        <PokedexEntryCard
          v-for="entry in visibleEntries"
          :key="entry.id"
          :entry="entry"
          :title="titleOf(entry)"
          :in-wishlist="has(entry.id)"
          :loading="pendingIds.has(entry.id)"
          @toggle="toggle(entry)"
        />
      </div>
    </section>
  </div>
</template>
