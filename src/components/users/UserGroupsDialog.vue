<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('users.usersGroupsTitle', { name: userName, count: groups.length })"
    width="360px"
    append-to-body
    align-center
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="overflow-y-auto max-h-64 pr-1">
      <div
        v-for="group in groups"
        :key="group.id"
        class="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
      >
        <div
          class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold shrink-0"
        >
          {{ group.name?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm text-gray-700 dialog-group__name">
            {{ group.name }}
          </div>
          <div
            v-if="isMember(group)"
            class="dialog-group__status dialog-group__status--member"
          >
            {{ t('users.member') }}
          </div>
          <div
            v-else-if="hasPendingJoinRequest(group)"
            class="dialog-group__status dialog-group__status--requested"
          >
            {{ t('users.requested') }}
          </div>
        </div>
        <el-button
          v-if="!isMember(group) && !hasPendingJoinRequest(group)"
          size="medium"
          type="success"
          plain
          @click="$emit('join-group', group)"
        >
          {{ t('users.joinGroup') }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  modelValue: { type: Boolean, required: true },
  userName: { type: String, default: '' },
  groups: { type: Array, required: true },
  isMember: { type: Function, default: () => false },
  hasPendingJoinRequest: { type: Function, default: () => false }
})

defineEmits(['update:modelValue', 'join-group'])
</script>

<style scoped>
.dialog-group__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dialog-group__status {
  font-size: 0.68rem;
  font-weight: 500;
  margin-top: 0.1rem;
}

.dialog-group__status--member {
  color: #16a34a;
}

.dialog-group__status--requested {
  color: #d97706;
}

.dark-theme :deep(.el-dialog) {
  --el-dialog-bg-color: #0f172a;
  --el-text-color-primary: #e2e8f0;
}

.dark-theme :deep(.el-dialog__title) {
  color: #e2e8f0;
}

.dark-theme .dialog-group__name {
  color: #e2e8f0;
}

.dark-theme .dialog-group__status--member {
  color: #4ade80;
}

.dark-theme .dialog-group__status--requested {
  color: #fbbf24;
}
</style>
