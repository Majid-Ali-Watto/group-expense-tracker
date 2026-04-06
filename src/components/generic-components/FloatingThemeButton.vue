<template>
  <button
    @click="toggleTheme"
    class="theme-toggle-floating"
    :title="isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
  >
    <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
    <SunIcon v-else class="w-5 h-5" />
  </button>
</template>
<script setup>
import { MoonIcon, SunIcon } from '@/components/icons'

defineProps({
  isDarkTheme: {
    type: Boolean,
    required: true
  },
  toggleTheme: {
    type: Function,
    required: true
  }
})
</script>
