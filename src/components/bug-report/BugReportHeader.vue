<template>
  <div class="bug-header">
    <div class="bug-header-icon">
      <AlertTriangleIcon class="w-8 h-8" />
    </div>
    <div class="flex-1">
      <h1 class="bug-title">
        {{ activeView === 'my-reports' ? 'My Reports' : 'Report a Bug' }}
      </h1>
      <p class="bug-subtitle">
        {{
          activeView === 'my-reports'
            ? 'Status updates for your submitted reports'
            : 'Help us improve Kharchafy by describing what went wrong'
        }}
      </p>
    </div>
    <!-- View switcher -->
    <div class="bug-view-switcher">
      <button
        class="bug-view-btn"
        :class="{ 'is-active': activeView === 'form' }"
        @click="$emit('update:activeView', 'form')"
      >
        New Report
      </button>
      <button
        class="bug-view-btn"
        :class="{ 'is-active': activeView === 'my-reports' }"
        @click="$emit('update:activeView', 'my-reports')"
      >
        My Reports
        <span v-if="reportCount" class="bug-view-count">{{ reportCount }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { AlertTriangleIcon } from '@/components/icons'

defineProps({
  activeView: { type: String, required: true },
  reportCount: { type: Number, default: 0 }
})

defineEmits(['update:activeView'])
</script>

<style scoped>
.bug-header {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
  background: #fff7ed;
  border-left: 4px solid #f97316;
  border-radius: 10px;
  margin-bottom: 24px;
}

.bug-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #f97316;
  color: #ffffff;
  flex-shrink: 0;
}

.bug-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px;
}

.bug-subtitle {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  margin: 0;
}

/* ── View switcher ──────────────────────────────────────────── */
.bug-view-switcher {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.bug-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bug-view-btn.is-active {
  border-color: #f97316;
  background: #fff7ed;
  color: #c2410c;
  font-weight: 600;
}

.bug-view-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background: #f97316;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

/* Dark theme */
:root.dark-theme .bug-header {
  background: rgba(249, 115, 22, 0.1);
}
:root.dark-theme .bug-title {
  color: #f3f4f6;
}
:root.dark-theme .bug-subtitle {
  color: #9ca3af;
}
:root.dark-theme .bug-view-btn {
  border-color: #4b5563;
  color: #d1d5db;
}
:root.dark-theme .bug-view-btn.is-active {
  background: rgba(249, 115, 22, 0.1);
  border-color: #f97316;
  color: #fb923c;
}
</style>
