<template>
  <!-- Notifications for current user -->
  <div class="mb-4 space-y-2">
    <div
      v-for="notif in userNotifications"
      :key="notif.id"
      :class="[
        'border p-3 rounded-lg flex justify-between items-center',
        notif.type === 'approved'
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      ]"
    >
      <div
        :class="[
          'text-sm',
          notif.type === 'approved' ? 'text-green-800' : 'text-red-800'
        ]"
      >
        <span class="font-medium">{{ notif.message }}</span>
        <span v-if="notif.byName" class="text-gray-600 ml-2"
          >({{ notif.byName }})</span
        >
      </div>
      <el-button size="small" text @click="dismissNotification(notif.id)">
        ✕
      </el-button>
    </div>
  </div>
</template>
<script setup>
import { ElButton } from 'element-plus'

defineProps({
  userNotifications: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['dismiss'])

const dismissNotification = (id) => {
  emit('dismiss', id)
}
</script>
