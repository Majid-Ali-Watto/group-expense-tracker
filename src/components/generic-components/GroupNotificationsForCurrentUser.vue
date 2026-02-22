<template>
  <div v-if="getUserNotifications(group).length > 0" class="mb-3 space-y-1">
    <div
      v-for="notif in getUserNotifications(group)"
      :key="notif.id"
      class="bg-blue-50 border border-blue-200 p-2 rounded flex justify-between items-center"
    >
      <div class="text-xs text-blue-800">
        <span class="font-medium">{{ notif.message }}</span>
        <span class="text-gray-600 ml-2"
          >(by {{ notif.updatedByName || notif.rejectedByName }})</span
        >
      </div>
      <el-button
        size="small"
        text
        @click="hideNotification(group.id, notif.id)"
      >
        ✕
      </el-button>
    </div>
  </div>
</template>
<script setup>
import { getUserNotifications } from '../../helpers/users'

defineProps({
  group: {
    type: Object,
    required: true
  },
  hideNotification: {
    type: Function,
    required: true
  }
})
</script>
