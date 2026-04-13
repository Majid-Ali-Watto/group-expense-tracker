<template>
  <div class="relative">
    <el-popover
      :visible="visible"
      placement="bottom-end"
      :width="320"
      trigger="click"
      popper-class="notif-popover-popper"
      @update:visible="emit('update:visible', $event)"
    >
      <template #reference>
        <button
          class="bell-btn"
          :title="`${notificationCount} pending actions`"
        >
          <BellIcon class="w-5 h-5" />
          <span v-if="notificationCount > 0" class="notif-badge">
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </span>
        </button>
      </template>

      <div class="notif-panel">
        <div class="notif-panel-header">
          <span class="font-semibold text-sm">Notifications</span>
          <span
            v-if="notificationCount > 0"
            class="text-xs text-amber-600 font-medium"
          >
            {{ notificationCount }} pending
          </span>
        </div>

        <div v-if="notifications.length === 0" class="notif-empty">
          ✅ No pending actions
        </div>

        <div v-else class="notif-list">
          <template v-for="category in notifCategories" :key="category">
            <div class="notif-category-label">{{ category }}</div>
            <div
              v-for="notif in notifsByCategory[category]"
              :key="notif.id"
              class="notif-item"
              @click="emit('navigate', notif)"
            >
              <span class="notif-icon">{{ notif.icon }}</span>
              <div class="notif-text">
                <div
                  v-overflow-popup="{ title: 'Notification' }"
                  class="notif-desc"
                >
                  {{ notif.description }}
                </div>
                <div
                  v-overflow-popup="{ title: 'Related Section' }"
                  class="notif-group"
                >
                  {{ notif.title }}
                </div>
              </div>
              <span class="notif-arrow">›</span>
            </div>
          </template>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BellIcon } from '@/components/icons'

const props = defineProps({
  visible: { type: Boolean, default: false },
  notifications: { type: Array, default: () => [] },
  notificationCount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'navigate'])

const notifsByCategory = computed(() => {
  const map = {}
  props.notifications.forEach((notification) => {
    if (!map[notification.category]) map[notification.category] = []
    map[notification.category].push(notification)
  })
  return map
})

const notifCategories = computed(() => Object.keys(notifsByCategory.value))
</script>

<style scoped>
.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}

.bell-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.notif-panel {
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 10px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.notif-empty {
  padding: 24px 0;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-category-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
  padding: 10px 4px 4px;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.notif-item:hover {
  background-color: #f3f4f6;
}

.notif-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

.notif-text {
  flex: 1;
  min-width: 0;
}

.notif-desc {
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-group {
  font-size: 11px;
  color: #6b7280;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-arrow {
  font-size: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}

:root.dark-theme :deep(.notif-popover-popper) {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

:root.dark-theme :deep(.notif-popover-popper .el-popper__arrow::before) {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

:root.dark-theme .notif-panel-header {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

:root.dark-theme .notif-panel-header .text-amber-600 {
  color: #fbbf24 !important;
}

:root.dark-theme .notif-empty {
  color: #9ca3af;
}

:root.dark-theme .notif-category-label {
  color: #6b7280;
}

:root.dark-theme .notif-item:hover {
  background-color: #374151;
}

:root.dark-theme .notif-desc {
  color: #e5e7eb;
}

:root.dark-theme .notif-group {
  color: #9ca3af;
}

:root.dark-theme .notif-arrow {
  color: #6b7280;
}
</style>
