<template>
  <div class="bug-success">
    <svg
      class="w-8 h-8 success-icon"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
    <p class="bug-success-title">Report submitted successfully!</p>
    <p v-if="bugNumber" class="bug-success-number">
      Bug Number: <strong>#{{ bugNumber }}</strong>
    </p>
    <p class="bug-success-text">
      Thank you for helping us improve. We'll look into it as soon as possible.
    </p>
    <GenericButton type="default" size="small" @click="$emit('reset')"
      >Submit another report</GenericButton
    >
  </div>
</template>

<script setup>
import { GenericButton } from '@/components/generic-components'

defineProps({
  bugNumber: { type: [String, Number], default: null }
})

defineEmits(['reset'])
</script>

<style scoped>
.bug-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 40px 24px;
  border: 1px solid #22c55e;
  border-radius: 10px;
  background: var(--el-color-primary-light-9, #f0fdf4);
  margin-bottom: 24px;
}

.success-icon {
  color: #22c55e;
}

.bug-success-title {
  font-size: 16px;
  font-weight: 700;
  color: #16a34a;
  margin: 0;
}

.bug-success-text {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  margin: 0;
}

.bug-success-number {
  margin: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* Dark theme */
:root.dark-theme .bug-success {
  background: rgba(34, 197, 94, 0.1);
  border-color: #374151;
}
:root.dark-theme .bug-success-number {
  background: rgba(34, 197, 94, 0.14);
  color: #86efac;
}
:root.dark-theme .bug-success-text {
  color: #9ca3af;
}
</style>
