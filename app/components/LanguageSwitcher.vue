<script setup lang="ts">
import type { Locale } from '~/utils/locales'
import { LOCALE_LABELS, LOCALES } from '~/utils/locales'

const { t, locale, setLocale } = useLanguage()
</script>

<template>
  <label class="language">
    <span class="sr-only">{{ t('nav.language') }}</span>
    <select
      data-testid="language-select"
      :value="locale"
      @change="setLocale(($event.target as HTMLSelectElement).value as Locale)"
    >
      <option v-for="code in LOCALES" :key="code" :value="code">
        {{ LOCALE_LABELS[code] }}
      </option>
    </select>
  </label>
</template>
