<script setup lang="ts">
import type { PokemonType } from '~/types/pokemon'

defineProps<{ types: PokemonType[] }>()

const { t } = useLanguage()
</script>

<template>
  <ul class="types">
    <li
      v-for="type in types"
      :key="type"
      class="type"
      :style="{ background: typeStyle(type).color, color: typeStyle(type).ink }"
    >
      {{ t(`types.${type}`, t('types.unknown')) }}
    </li>
  </ul>
</template>
