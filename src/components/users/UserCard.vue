<template>
  <div
    class="user-card border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
  >
    <el-alert
      v-if="showBlockedWarning"
      :title="blockedMessage"
      type="warning"
      :closable="false"
      class="mb-3"
    />

    <div
      class="flex flex-col sm:flex-row sm:items-center gap-3"
      :class="{ 'pointer-events-none opacity-60 select-none': isInteractionBlocked }"
    >
      <!-- Name & Mobile -->
      <div class="flex-1 min-w-0">
        <div
          class="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
        >
          Name / Mobile
        </div>
        <div class="font-semibold text-gray-800">{{ user.name }}</div>
        <div class="text-sm text-gray-500">{{ mobile }}</div>
      </div>

      <!-- Groups -->
      <div class="flex flex-wrap gap-1 sm:flex-1">
        <div
          class="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
        >
          Groups
        </div>
        <template v-if="groups.length > 0">
          <el-tag
            v-for="group in groups.slice(0, 3)"
            :key="group"
            size="small"
            type="success"
          >
            {{ group }}
          </el-tag>
          <el-tag
            v-if="groups.length > 3"
            size="small"
            type="success"
            class="cursor-pointer"
            @click="$emit('open-groups')"
          >
            +{{ groups.length - 3 }} more
          </el-tag>
        </template>
        <span v-else class="text-gray-400 text-xs">No groups</span>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-1 flex-shrink-0 sm:w-48">
        <div
          class="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
        >
          Actions
        </div>

        <el-button
          v-if="user.uid !== activeUser"
          size="small"
          type="success"
          plain
          :disabled="isInteractionBlocked"
          @click="$emit('create-group', user.uid)"
        >
          Create Group
        </el-button>

        <template v-if="canManage">
          <template v-if="!user.deleteRequest">
            <el-button
              size="small"
              type="primary"
              :disabled="isInteractionBlocked"
              @click="$emit('edit')"
            >
              Edit
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="isInteractionBlocked"
              @click="$emit('delete', user.uid, user.name)"
            >
              Delete
            </el-button>
          </template>
          <el-button v-else size="small" disabled>
            Delete Pending ({{ user.deleteRequest.approvals?.length || 0 }}/{{
              user.deleteRequest.requiredApprovals?.length || 0
            }})
          </el-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: { type: Object, required: true },
  activeUser: { type: String, default: null },
  groups: { type: Array, required: true },
  mobile: { type: String, required: true },
  canManage: { type: Boolean, required: true },
  activeUserBlocked: { type: Boolean, default: false }
})

defineEmits(['edit', 'delete', 'create-group', 'open-groups'])

const isInteractionBlocked = computed(
  () => props.activeUserBlocked || props.user?.blocked === true
)

const showBlockedWarning = computed(
  () => props.user?.blocked === true || (props.activeUserBlocked && props.user?.uid === props.activeUser)
)

const blockedMessage = computed(() =>
  props.user?.blocked === true
    ? 'This user is blocked by admin. Do not interact with this account.'
    : 'Your account is blocked by admin. User actions are disabled.'
)
</script>

<style scoped>
.user-card {
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.8),
      rgba(255, 255, 255, 0.95)
    ),
    var(--card-bg);
  transition:
    transform 0.18s var(--motion-swift),
    box-shadow 0.2s var(--motion-smooth),
    border-color 0.2s var(--motion-smooth);
}

.user-card:hover {
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.24);
}

.dark-theme .user-card {
  background: rgba(17, 24, 39, 0.55);
}
</style>
