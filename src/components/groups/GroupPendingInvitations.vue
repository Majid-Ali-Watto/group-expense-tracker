<template>
  <div v-if="invitations.length > 0" class="mb-4">
    <h4 class="mb-2">
      Pending Invitations
      <el-badge :value="invitations.length" type="warning" class="ml-1" />
    </h4>
    <div
      v-for="group in invitations"
      :key="group.id"
      class="border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-3 bg-orange-50 dark:bg-orange-900/10"
    >
      <el-alert
        v-if="activeUserBlocked || group.blocked"
        :title="
          group.blocked
            ? 'This group is blocked by admin. Do not interact with it.'
            : 'Your account is blocked by admin. Invitation actions are disabled.'
        "
        type="warning"
        :closable="false"
        class="mb-3"
      />
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        :class="{
          'pointer-events-none opacity-60 select-none':
            activeUserBlocked || group.blocked
        }"
      >
        <div>
          <div class="font-semibold text-gray-800 dark:text-gray-100">
            {{ group.name }}
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Invited by
              <span class="font-medium">
                {{ getOwnerName(group) }}
                ({{ displayMobileForGroup(group.ownerMobile, group) }})
              </span>
            </div>
            <div
              v-if="group.category"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              Category: <span class="font-medium">{{ group.category }}</span>
            </div>
          </div>
          <div
            v-if="group.description"
            class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic"
          >
            {{ group.description }}
          </div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <el-button
            size="small"
            type="success"
            :disabled="activeUserBlocked || group.blocked"
            @click="$emit('accept', group.id)"
          >
            Accept
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="activeUserBlocked || group.blocked"
            @click="$emit('reject', group.id)"
          >
            Decline
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores'

defineProps({
  invitations: { type: Array, required: true },
  displayMobileForGroup: { type: Function, required: true },
  activeUserBlocked: { type: Boolean, default: false }
})

defineEmits(['accept', 'reject'])

const userStore = useUserStore()

function getOwnerName(group) {
  return userStore.getUserByMobile(group.ownerMobile)?.name || group.ownerMobile
}
</script>
