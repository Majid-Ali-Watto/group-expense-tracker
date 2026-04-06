<template>
  <div
    :id="`group-card-${group.id}`"
    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
  >
    <div class="mb-3">
      <div class="flex flex-col mb-2">
        <div class="flex items-center justify-between flex-wrap">
          <h3 class="font-semibold text-lg">{{ group.name }}</h3>
          <!-- Pin button — desktop only -->
          <el-button
            size="small"
            text
            class="hidden sm:inline-flex"
            :title="pinned ? 'Unpin group' : 'Pin to top'"
            :type="pinned ? 'warning' : 'info'"
            @click="$emit('toggle-pin', group.id)"
          >
            {{ pinned ? '⭐ Pinned' : '☆ Pin' }}
          </el-button>
          <!-- Dropdown menu — mobile -->
          <el-dropdown trigger="click" class="sm:hidden">
            <el-icon :size="20" class="vertical-dots">
              <MoreFilled />
            </el-icon>
            <template #dropdown>
              <el-dropdown-item @click="$emit('toggle-pin', group.id)">
                <span :class="pinned ? 'text-orange-500' : ''">
                  {{ pinned ? '⭐ Unpin' : '☆ Pin' }}
                </span>
              </el-dropdown-item>
              <el-dropdown-item divided disabled>
                <span class="text-xs text-gray-400">Actions</span>
              </el-dropdown-item>
              <el-dropdown-item
                v-for="action in actions"
                :key="action.label"
                :disabled="action.disabled"
                @click="action.onClick"
              >
                <span :class="{ 'text-red-500': action.type === 'danger' }">
                  {{ action.label }}
                </span>
              </el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
        <div
          class="flex flex-wrap items-center justify-between gap-y-0.5 mt-0.5"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Owner: {{ ownerName }}
            ({{ displayMobileForGroup(group.ownerMobile, group) }})
          </p>
          <p
            v-if="group.category"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            Category: {{ group.category }}
          </p>
        </div>
      </div>

      <GroupNotificationsForCurrentUser
        :group="group"
        :hide-notification="hideNotification"
      />

      <GroupDetailsAccordion
        :group="group"
        group-type="joined"
        :load-group-balances="loadGroupBalances"
        :display-mobile-for-group="displayMobileForGroup"
      >
        <template #your-position>
          <YourPositionInGroup
            :group="group"
            :get-group-balances="getGroupBalances"
          />
        </template>
      </GroupDetailsAccordion>

      <GroupActionButtons class="hidden sm:flex" :actions="actions" />
    </div>

    <GroupRequestButtons
      :group="group"
      :get-join-requests="getJoinRequests"
      :approve-member-join-request="approveMemberJoinRequest"
      :reject-join-request="rejectJoinRequest"
      :approve-group-deletion="approveGroupDeletion"
      :reject-group-deletion="rejectGroupDeletion"
      :approve-edit-request="approveEditRequest"
      :reject-edit-request="rejectEditRequest"
      :approve-add-member-request="approveAddMemberRequest"
      :reject-add-member-request="rejectAddMemberRequest"
      :finalize-add-member="finalizeAddMember"
      :approve-ownership-transfer="approveOwnershipTransfer"
      :reject-ownership-transfer="rejectOwnershipTransfer"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import {
  GroupDetailsAccordion,
  YourPositionInGroup,
  GroupActionButtons,
  GroupRequestButtons,
  GroupNotificationsForCurrentUser
} from '@/components/generic-components'

const props = defineProps({
  group: { type: Object, required: true },
  pinned: { type: Boolean, required: true },
  actions: { type: Array, required: true },
  displayMobileForGroup: { type: Function, required: true },
  hideNotification: { type: Function, required: true },
  loadGroupBalances: { type: Function, required: true },
  getGroupBalances: { type: Function, required: true },
  getJoinRequests: { type: Function, required: true },
  approveMemberJoinRequest: { type: Function, required: true },
  rejectJoinRequest: { type: Function, required: true },
  approveGroupDeletion: { type: Function, required: true },
  rejectGroupDeletion: { type: Function, required: true },
  approveEditRequest: { type: Function, required: true },
  rejectEditRequest: { type: Function, required: true },
  approveAddMemberRequest: { type: Function, required: true },
  rejectAddMemberRequest: { type: Function, required: true },
  finalizeAddMember: { type: Function, required: true },
  approveOwnershipTransfer: { type: Function, required: true },
  rejectOwnershipTransfer: { type: Function, required: true }
})

defineEmits(['toggle-pin'])

const userStore = useUserStore()

const ownerName = computed(
  () =>
    userStore.getUserByMobile(props.group.ownerMobile)?.name ||
    props.group.ownerMobile
)
</script>

<style scoped>
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}
.vertical-dots {
  transform: rotate(90deg);
  cursor: pointer;
}
</style>
