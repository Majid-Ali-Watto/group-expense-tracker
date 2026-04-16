<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="min(92vw, 560px)"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="showClose"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="space-y-5">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Select the features you want to use. You can keep only the tabs you
        actually need.
      </p>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <el-checkbox
          :model-value="selection.shared"
          @update:model-value="updateSelection('shared', $event)"
        >
          Shared features
        </el-checkbox>
        <div v-if="selection.shared" class="mt-3 space-y-2 pl-6 text-sm">
          <el-checkbox :model-value="selection[USER_TAB_KEYS.GROUPS]" disabled>
            Groups
          </el-checkbox>
          <el-checkbox
            :model-value="selection[USER_TAB_KEYS.USERS]"
            @update:model-value="updateSelection(USER_TAB_KEYS.USERS, $event)"
          >
            Users
          </el-checkbox>
          <el-checkbox
            :model-value="selection[USER_TAB_KEYS.SHARED_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_EXPENSES, $event)
            "
          >
            Shared Expenses
          </el-checkbox>
          <el-checkbox
            :model-value="selection[USER_TAB_KEYS.SHARED_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_LOANS, $event)
            "
          >
            Shared Loans
          </el-checkbox>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <el-checkbox
          :model-value="selection.personal"
          @update:model-value="updateSelection('personal', $event)"
        >
          Personal features
        </el-checkbox>
        <div v-if="selection.personal" class="mt-3 space-y-2 pl-6 text-sm">
          <el-checkbox
            :model-value="selection[USER_TAB_KEYS.PERSONAL_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.PERSONAL_EXPENSES, $event)
            "
          >
            Personal Expenses
          </el-checkbox>
          <el-checkbox
            :model-value="selection[USER_TAB_KEYS.PERSONAL_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.PERSONAL_LOANS, $event)
            "
          >
            Personal Loans
          </el-checkbox>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button size="small" @click="$emit('cancel')">{{
          cancelText
        }}</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { USER_TAB_KEYS } from '@/helpers'

const props = defineProps({
  visible: { type: Boolean, default: false },
  selection: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  title: { type: String, default: 'Choose Your Tabs' },
  confirmText: { type: String, default: 'Continue' },
  cancelText: { type: String, default: 'Cancel' },
  showClose: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:visible',
  'update:selection',
  'confirm',
  'cancel'
])

function updateSelection(key, value) {
  emit('update:selection', {
    ...props.selection,
    [key]: value
  })
}
</script>
