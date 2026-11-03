<script setup lang="ts">
import type { Pokemon, WishlistItem } from '~/types/pokemon'

const { t, locale } = useLanguage()
const { items, status, isFull, load, has, add, remove, rename, displayName } = useWishlist()

useHead({ title: () => t('nav.wishlist') })

const actionError = ref<string>('')

async function addFromSearch(pokemon: Pokemon): Promise<void> {
  actionError.value = ''
  const outcome = await add(pokemon)
  if (!outcome.ok) actionError.value = outcome.message
}

async function removeItem(item: WishlistItem): Promise<void> {
  actionError.value = ''
  const removed = await remove(item.pokemon.id)
  if (!removed) {
    actionError.value = t('wishlist.removeFailed', {
      name: localizedName(item.pokemon, locale.value),
    })
  }
}
</script>

<template>
  <div>
    <PokemonSearch :is-in-wishlist="has" :is-full="isFull" @add="addFromSearch" />

    <section class="list" aria-labelledby="list-title">
      <div class="list-head">
        <h1 id="list-title">
          {{ t('nav.wishlist') }}
          <span class="list-count">({{ items.length }}/{{ MAX_WISHLIST_SIZE }})</span>
        </h1>
        <PrenomsToggle />
      </div>

      <p v-if="actionError" class="search-error page-error" role="alert">
        {{ actionError }}
      </p>

      <div v-if="status === 'error'" class="empty" role="alert">
        <p>{{ t('wishlist.apiDown') }}</p>
        <button type="button" class="button-primary empty-action" @click="load">
          {{ t('common.retry') }}
        </button>
      </div>

      <p v-else-if="status === 'loading'" class="empty">{{ t('wishlist.loading') }}</p>

      <i18n-t v-else-if="items.length === 0" keypath="wishlist.empty" tag="p" class="empty">
        <template #link>
          <NuxtLink to="/liste-complete">{{ t('wishlist.emptyLink') }}</NuxtLink>
        </template>
      </i18n-t>

      <TransitionGroup v-else name="card" tag="div" class="grid">
        <PokemonCard
          v-for="item in items"
          :key="item.pokemon.id"
          :item="item"
          :title="displayName(item)"
          @remove="removeItem(item)"
          @rename="rename(item.pokemon.id, $event)"
        />
      </TransitionGroup>
    </section>
  </div>
</template>
