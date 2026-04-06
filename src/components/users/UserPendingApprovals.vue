<template>
  <div v-if="approvals.length > 0" class="mb-4">
    <h4 class="pending-title mb-2">Pending Approvals</h4>
    <div
      v-for="item in approvals"
      :key="`${item.user.uid}-${item.type}`"
      class="pending-card rounded-lg p-3 mb-2"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm">
            {{ item.user.name }} ({{ displayMobile(item.user.uid) }})
          </div>
          <div class="text-xs text-gray-600 mt-1">
            <span>
              Delete request by
              <strong>
                {{ getRequesterName(item.request.requestedBy) }}
                ({{ displayMobile(item.request.requestedBy) }})
              </strong>
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            Approvals: {{ item.request.approvals?.length || 0 }} /
            {{ item.request.requiredApprovals?.length || 0 }}
          </div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <el-button
            size="small"
            type="success"
            @click="$emit('approve', item.user.uid, item.type)"
          >
            Approve
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="$emit('reject', item.user.uid, item.type, item.user.name)"
          >
            Reject
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores'

defineProps({
  approvals: { type: Array, required: true },
  displayMobile: { type: Function, required: true }
})

defineEmits(['approve', 'reject'])

const userStore = useUserStore()

function getRequesterName(requestedBy) {
  return userStore.getUserByMobile(requestedBy)?.name || requestedBy
}
</script>
