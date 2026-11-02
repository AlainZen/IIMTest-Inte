<script setup lang="ts">
import type { WishlistItem } from '~/types/pokemon'

const props = defineProps<{ item: WishlistItem; title: string }>()
const emit = defineEmits<{ remove: []; rename: [nickname: string] }>()

const editing = ref<boolean>(false)
const draft = ref<string>('')
const nameInput = ref<HTMLInputElement | null>(null)

async function startEditing(): Promise<void> {
  draft.value = props.title
  editing.value = true
  await nextTick()
  nameInput.value?.select()
}

function saveName(): void {
  emit('rename', draft.value === props.item.pokemon.name ? '' : draft.value)
  editing.value = false
}
</script>

<template>
  <article class="card" data-testid="pokemon-card">
    <div class="card-art" :style="{ background: typeBackground(item.pokemon.types) }">
      <span class="card-number">n° {{ item.pokemon.speciesId }}</span>
      <img
        v-if="item.pokemon.image"
        :src="item.pokemon.image"
        :alt="item.pokemon.name"
        width="180"
        height="180"
        loading="lazy"
      />
    </div>

    <div class="card-body">
      <form v-if="editing" class="rename" @submit.prevent="saveName" @keydown.esc="editing = false">
        <label class="sr-only" :for="`nom-${item.pokemon.id}`"
          >Nouveau nom de {{ item.pokemon.name }}</label
        >
        <input
          :id="`nom-${item.pokemon.id}`"
          ref="nameInput"
          v-model="draft"
          maxlength="30"
          :placeholder="item.pokemon.name"
        />
        <button type="submit" class="button-primary">Enregistrer</button>
      </form>

      <template v-else>
        <h2 class="card-name">
          {{ title }}
        </h2>
        <p v-if="title !== item.pokemon.name" class="card-official">
          {{ item.pokemon.name }}
        </p>
      </template>

      <PokemonTypes :types="item.pokemon.types" />

      <div class="card-actions">
        <button v-if="!editing" type="button" class="button-text" @click="startEditing">
          Renommer
        </button>
        <button
          type="button"
          class="button-text"
          :aria-label="`Supprimer ${title}`"
          @click="emit('remove')"
        >
          Supprimer
        </button>
      </div>
    </div>
  </article>
</template>
