<script setup lang="ts">
const { t } = useLanguage()
const { showPrenoms, setShowPrenoms } = useWishlist()
</script>

<template>
  <label class="toggle">
    <input
      type="checkbox"
      :checked="showPrenoms"
      @change="setShowPrenoms(($event.target as HTMLInputElement).checked)"
    />
    {{ t('common.prenoms') }}
  </label>
</template>
