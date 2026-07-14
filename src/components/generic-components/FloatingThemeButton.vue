<template>
  <button
    @click="toggleTheme"
    class="theme-toggle-floating"
    :title="
      isDarkTheme
        ? t('headerActions.switchToLightMode')
        : t('headerActions.switchToDarkMode')
    "
  >
    <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
    <SunIcon v-else class="w-5 h-5" />
  </button>
</template>
<script setup>
import { useI18n } from 'vue-i18n'
import { MoonIcon, SunIcon } from '@/components/icons'

const { t } = useI18n()

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
