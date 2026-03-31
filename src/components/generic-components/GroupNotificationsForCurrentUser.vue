<template>
  <div v-if="getUserNotifications(group).length > 0" class="mb-3 space-y-1">
    <div
      v-for="notif in getUserNotifications(group)"
      :key="notif.id"
      class="bg-blue-50 border border-blue-200 p-2 rounded flex justify-between items-center"
    >
      <div class="text-xs text-blue-800">
        <span class="font-medium">{{ notif.message }}</span>
        <span
          v-if="notif.updatedBy || notif.rejectedBy"
          class="text-gray-600 ml-2"
          >(by {{ formatActor(notif.updatedBy || notif.rejectedBy) }})</span
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
import { getUserNotifications } from '@/helpers'
import { useUserStore, useAuthStore } from '@/stores'
import { formatUserDisplay } from '@/utils'

const userStore = useUserStore()
const authStore = useAuthStore()
const storeProxy = {
  get getActiveUser() {
    return authStore.getActiveUser
  },
  getUserByMobile: (m) => userStore.getUserByMobile(m)
}

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  hideNotification: {
    type: Function,
    required: true
  }
})

const formatActor = (mobile) =>
  formatUserDisplay(storeProxy, mobile, { group: props.group })
</script>
