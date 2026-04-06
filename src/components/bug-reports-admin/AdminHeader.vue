<template>
  <div class="bra-header">
    <div class="bra-header-icon">
      <ClipboardDocumentIcon class="w-7 h-7" />
    </div>
    <div class="flex-1">
      <h1 class="bra-title">Bug Reports</h1>
      <p class="bra-subtitle">
        {{ totalCount }} total &nbsp;·&nbsp; {{ openCount }} open
      </p>
    </div>
    <button
      class="bra-refresh-btn"
      :class="{ 'is-spinning': loading }"
      title="Refresh"
      @click="$emit('refresh')"
    >
      <RefreshIcon class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup>
import { ClipboardDocumentIcon, RefreshIcon } from '@/components/icons'

defineProps({
  totalCount: { type: Number, default: 0 },
  openCount: { type: Number, default: 0 },
  loading: { type: Boolean, default: false }
})

defineEmits(['refresh'])
</script>

<style scoped>
.bra-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: #f8fafc;
  border: 1px solid var(--el-border-color);
  border-left: 4px solid #6366f1;
  border-radius: 10px;
  margin-bottom: 18px;
}

.bra-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  background: #6366f1;
  color: #fff;
  flex-shrink: 0;
}

.bra-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 2px;
}

.bra-subtitle {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin: 0;
}

.bra-refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.bra-refresh-btn:hover {
  background: var(--el-fill-color);
}

.bra-refresh-btn.is-spinning svg {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Dark theme */
:root.dark-theme .bra-header {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .bra-title {
  color: #f3f4f6;
}
:root.dark-theme .bra-subtitle {
  color: #9ca3af;
}
:root.dark-theme .bra-refresh-btn {
  border-color: #4b5563;
  color: #9ca3af;
}
:root.dark-theme .bra-refresh-btn:hover {
  background: #374151;
}
</style>
