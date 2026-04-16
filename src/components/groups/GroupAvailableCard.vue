<template>
  <div
    class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
  >
    <el-alert
      v-if="isInteractionBlocked"
      :title="blockedMessage"
      type="warning"
      :closable="false"
      class="mb-3"
    />

    <div
      class="mb-3"
      :class="{
        'pointer-events-none opacity-60 select-none': isInteractionBlocked
      }"
    >
      <h3 class="font-semibold text-lg mb-0.5">{{ group.name }}</h3>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 mb-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Owner: {{ ownerName }} ({{
            displayMobileForGroup(group.ownerUid, group)
          }})
        </p>
        <p
          v-if="group.category"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          Category: {{ group.category }}
        </p>
      </div>
      <GroupDetailsAccordion
        :group="group"
        group-type="other"
        :load-group-balances="loadGroupBalances"
        :display-mobile-for-group="displayMobileForGroup"
      />
      <GroupActionButtons :actions="actions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/stores'
import {
  GroupDetailsAccordion,
  GroupActionButtons
} from '@/components/generic-components'

const props = defineProps({
  group: { type: Object, required: true },
  actions: { type: Array, required: true },
  displayMobileForGroup: { type: Function, required: true },
  loadGroupBalances: { type: Function, required: true },
  activeUserBlocked: { type: Boolean, default: false }
})

const userStore = useUserStore()

const ownerName = computed(
  () =>
    userStore.getUserByUid(props.group.ownerUid)?.name || props.group.ownerUid
)

const isInteractionBlocked = computed(
  () => props.activeUserBlocked || props.group?.blocked === true
)

const blockedMessage = computed(() =>
  props.group?.blocked === true
    ? 'This group is blocked by admin. Do not interact with it.'
    : 'Your account is blocked by admin. Group actions are disabled.'
)
</script>

<style scoped>
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}
</style>
