<template>
  <div class="bra-header">
    <div class="bra-header-icon">
      <svg
        class="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
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
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
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
