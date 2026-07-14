<template>
  <el-dialog
    :model-value="visible"
    :title="resolvedTitle"
    width="min(92vw, 560px)"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="showClose"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="space-y-5">
      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ t('auth.tabConfig.intro') }}
      </p>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection.shared"
          @update:model-value="updateSelection('shared', $event)"
        >
          {{ t('auth.tabConfig.sharedFeatures') }}
        </el-checkbox>
        <div v-if="selection.shared" class="mt-3 space-y-2 ps-6 text-sm">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.GROUPS]"
            disabled
          >
            {{ t('auth.tabConfig.groups') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.USERS]"
            @update:model-value="updateSelection(USER_TAB_KEYS.USERS, $event)"
          >
            {{ t('auth.tabConfig.users') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.SHARED_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_EXPENSES, $event)
            "
          >
            {{ t('auth.tabConfig.sharedExpenses') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.SHARED_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_LOANS, $event)
            "
          >
            {{ t('auth.tabConfig.sharedLoans') }}
          </el-checkbox>
        </div>

        <div
          v-if="
            selection.shared &&
            (selection[USER_TAB_KEYS.SHARED_EXPENSES] ||
              selection[USER_TAB_KEYS.SHARED_LOANS])
          "
          class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700"
        >
          <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('auth.tabConfig.emailNotifications') }}
          </p>
          <div class="space-y-2 ps-6 text-sm">
            <el-checkbox
              class="!whitespace-normal"
              v-if="selection[USER_TAB_KEYS.SHARED_EXPENSES]"
              :model-value="selection.emailSharedExpenses"
              @update:model-value="
                updateSelection('emailSharedExpenses', $event)
              "
            >
              {{ t('auth.tabConfig.notifySharedExpense') }}
            </el-checkbox>
            <el-checkbox
              class="!whitespace-normal"
              v-if="selection[USER_TAB_KEYS.SHARED_LOANS]"
              :model-value="selection.emailSharedLoans"
              @update:model-value="updateSelection('emailSharedLoans', $event)"
            >
              {{ t('auth.tabConfig.notifySharedLoan') }}
            </el-checkbox>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection.personal"
          @update:model-value="updateSelection('personal', $event)"
        >
          {{ t('auth.tabConfig.personalFeatures') }}
        </el-checkbox>
        <div v-if="selection.personal" class="mt-3 space-y-2 ps-6 text-sm">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.PERSONAL_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.PERSONAL_EXPENSES, $event)
            "
          >
            {{ t('auth.tabConfig.personalExpenses') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="selection[USER_TAB_KEYS.PERSONAL_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.PERSONAL_LOANS, $event)
            "
          >
            {{ t('auth.tabConfig.personalLoans') }}
          </el-checkbox>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button size="medium" @click="$emit('cancel')">{{
          resolvedCancelText
        }}</el-button>
        <el-button
          type="primary"
          size="medium"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ resolvedConfirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { USER_TAB_KEYS } from '@/helpers'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  selection: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  title: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  cancelText: { type: String, default: '' },
  showClose: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:visible',
  'update:selection',
  'confirm',
  'cancel'
])

const resolvedTitle = computed(() => props.title || t('auth.tabConfig.title'))
const resolvedConfirmText = computed(
  () => props.confirmText || t('auth.tabConfig.confirm')
)
const resolvedCancelText = computed(
  () => props.cancelText || t('common.cancel')
)

function updateSelection(key, value) {
  emit('update:selection', {
    ...props.selection,
    [key]: value
  })
}
</script>
