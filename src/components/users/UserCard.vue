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
      :class="{
        'pointer-events-none opacity-60 select-none': isInteractionBlocked
      }"
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
          <button
            v-for="group in groups.slice(0, 2)"
            :key="group.id"
            class="group-chip"
            @click="$emit('select-group', group)"
          >
            <span class="group-chip__name">{{ group.name }}</span>
            <span
              v-if="groupStatusLabel(group)"
              :class="[
                'group-chip__status',
                `group-chip__status--${getGroupStatus(group)}`
              ]"
            >
              {{ groupStatusLabel(group) }}
            </span>
          </button>
          <button
            v-if="groups.length > 2"
            class="group-chip group-chip--more"
            @click="$emit('open-groups')"
          >
            <span class="group-chip__name">+{{ groups.length - 2 }} more</span>
          </button>
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
          v-if="user.uid !== activeUserUid"
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
  activeUserUid: { type: String, default: null },
  groups: { type: Array, required: true },
  mobile: { type: String, required: true },
  canManage: { type: Boolean, required: true },
  activeUserBlocked: { type: Boolean, default: false },
  isMember: { type: Function, default: () => false },
  hasPendingJoinRequest: { type: Function, default: () => false }
})

defineEmits(['edit', 'delete', 'create-group', 'open-groups', 'select-group'])

const isInteractionBlocked = computed(
  () => props.activeUserBlocked || props.user?.blocked === true
)

const showBlockedWarning = computed(
  () =>
    props.user?.blocked === true ||
    (props.activeUserBlocked && props.user?.uid === props.activeUserUid)
)

const blockedMessage = computed(() =>
  props.user?.blocked === true
    ? 'This user is blocked by admin. Do not interact with this account.'
    : 'Your account is blocked by admin. User actions are disabled.'
)

function getGroupStatus(group) {
  if (props.isMember(group)) return 'member'
  if (props.hasPendingJoinRequest(group)) return 'requested'
  return 'none'
}

function groupStatusLabel(group) {
  const status = getGroupStatus(group)
  if (status === 'member') return 'Member'
  if (status === 'requested') return 'Request Sent'
  return ''
}
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

.group-chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.2rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.07);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
  text-align: left;
}

.group-chip:hover {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.5);
}

.group-chip--more {
  border-style: dashed;
  background: transparent;
}

.group-chip__name {
  font-size: 0.78rem;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary, #1e293b);
}

.group-chip__status {
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1.3;
  margin-top: 0.05rem;
}

.group-chip__status--member {
  color: #16a34a;
}

.group-chip__status--requested {
  color: #d97706;
}

.dark-theme .group-chip {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.06);
}

.dark-theme .group-chip:hover {
  background: rgba(34, 197, 94, 0.12);
}

.dark-theme .group-chip__name {
  color: #e2e8f0;
}

.dark-theme .group-chip__status--member {
  color: #4ade80;
}

.dark-theme .group-chip__status--requested {
  color: #fbbf24;
}
</style>
