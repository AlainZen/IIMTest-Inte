<script setup lang="ts">
import type { WishlistItem } from '~/types/pokemon'

const props = defineProps<{ item: WishlistItem; title: string }>()
const emit = defineEmits<{ remove: []; rename: [nickname: string] }>()

const { t, locale } = useLanguage()

const editing = ref<boolean>(false)
const draft = ref<string>('')
const nameInput = ref<HTMLInputElement | null>(null)

const officialName = computed<string>(() => localizedName(props.item.pokemon, locale.value))

async function startEditing(): Promise<void> {
  draft.value = props.title
  editing.value = true
  await nextTick()
  nameInput.value?.select()
}

function saveName(): void {
  emit('rename', draft.value === officialName.value ? '' : draft.value)
  editing.value = false
}
</script>

<template>
  <article class="card" data-testid="pokemon-card">
    <div class="card-art" :style="{ background: typeBackground(item.pokemon.types) }">
      <span class="card-number">{{ t('pokemon.number', { id: item.pokemon.id }) }}</span>
      <img
        v-if="item.pokemon.image"
        :src="item.pokemon.image"
        :alt="officialName"
        width="180"
        height="180"
        loading="lazy"
      />
    </div>

    <div class="card-body">
      <form v-if="editing" class="rename" @submit.prevent="saveName" @keydown.esc="editing = false">
        <label class="sr-only" :for="`nom-${item.pokemon.id}`">
          {{ t('card.newName', { name: officialName }) }}
        </label>
        <input
          :id="`nom-${item.pokemon.id}`"
          ref="nameInput"
          v-model="draft"
          maxlength="30"
          :placeholder="officialName"
        />
        <button type="submit" class="button-primary">{{ t('card.save') }}</button>
      </form>

      <template v-else>
        <h2 class="card-name">
          <NuxtLink :to="pokemonPath(item.pokemon.id)">{{ title }}</NuxtLink>
        </h2>
        <p v-if="title !== officialName" class="card-official">
          {{ officialName }}
        </p>
      </template>

      <PokemonTypes :types="item.pokemon.types" />

      <div class="card-actions">
        <button v-if="!editing" type="button" class="button-text" @click="startEditing">
          {{ t('card.rename') }}
        </button>
        <button
          type="button"
          class="button-text"
          :aria-label="t('card.deleteAria', { name: title })"
          @click="emit('remove')"
        >
          {{ t('card.delete') }}
        </button>
      </div>
    </div>
  </article>
</template>
