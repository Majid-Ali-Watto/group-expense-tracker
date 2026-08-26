<template>
  <div class="kharchafy-brand flex items-center gap-2.5">
    <RouterLink
      :to="brandHomePath"
      class="kharchafy-brand-badge flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl shrink-0"
    >
      <el-icon :size="20" class="text-white"><Wallet /></el-icon>
    </RouterLink>

    <div class="flex flex-col items-start gap-0">
      <RouterLink
        :to="brandHomePath"
        class="kharchafy-brand-title text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide"
      >
        {{ t('footer.brand') }}
      </RouterLink>
      <span
        class="text-xs sm:text-sm tracking-widest uppercase font-light text-white/90"
      >
        {{ t('header.tagline') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet } from '@element-plus/icons-vue'

const { t, locale } = useI18n()
const brandHomePath = computed(() => (locale.value === 'ur' ? '/ur' : '/'))
</script>

<style scoped>
.kharchafy-brand-badge {
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 2px 8px rgba(6, 78, 59, 0.35);
}

.kharchafy-brand-title {
  color: #fff;
  text-shadow: 0 1px 2px rgba(6, 78, 59, 0.35);
  background: linear-gradient(90deg, #ffffff 0%, #d1fae5 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
