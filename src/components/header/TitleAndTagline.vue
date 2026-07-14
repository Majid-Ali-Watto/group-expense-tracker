<template>
  <div class="kharchafy-brand flex flex-col items-start gap-0">
    <RouterLink
      to="/"
      class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-sm"
    >
      Kharchafy
    </RouterLink>
    <span
      class="text-xs sm:text-sm tracking-widest uppercase font-light text-white/90"
    >
      {{ t('header.tagline') }}
    </span>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
