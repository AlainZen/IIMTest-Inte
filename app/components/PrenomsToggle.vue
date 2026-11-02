<script setup lang="ts">
const { showPrenoms, setShowPrenoms } = useWishlist()
</script>

<template>
  <label class="toggle">
    <input
      type="checkbox"
      :checked="showPrenoms"
      @change="setShowPrenoms(($event.target as HTMLInputElement).checked)"
    >
    Afficher les prénoms
  </label>
</template>
