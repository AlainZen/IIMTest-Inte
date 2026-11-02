<script setup lang="ts">
import type { PokemonType } from '~/types/pokemon'

defineProps<{ types: PokemonType[] }>()
</script>

<template>
  <ul class="types">
    <li
      v-for="type in types"
      :key="type"
      class="type"
      :style="{ background: typeStyle(type).color, color: typeStyle(type).ink }"
    >
      {{ typeStyle(type).label }}
    </li>
  </ul>
</template>
