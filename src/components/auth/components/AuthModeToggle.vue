<template>
  <div class="mb-4">
    <el-segmented
      :model-value="mode"
      :options="options"
      size="small"
      class="w-full auth-segment"
      @update:modelValue="$emit('update:mode', $event)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  mode: { type: String, required: true }
})

defineEmits(['update:mode'])

const { t } = useI18n()
const options = computed(() => [
  { label: t('auth.modeToggle.login'), value: 'login' },
  { label: t('auth.modeToggle.register'), value: 'register' }
])
</script>
