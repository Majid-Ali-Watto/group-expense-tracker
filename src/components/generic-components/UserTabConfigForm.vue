<template>
  <div class="space-y-5">
    <p class="text-sm text-gray-600 dark:text-gray-300">
      {{ t('auth.tabConfig.intro') }}
    </p>

    <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
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
          {{ t('tabs.groups') }}
        </el-checkbox>
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection[USER_TAB_KEYS.USERS]"
          @update:model-value="updateSelection(USER_TAB_KEYS.USERS, $event)"
        >
          {{ t('tabs.users') }}
        </el-checkbox>
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection[USER_TAB_KEYS.SHARED_EXPENSES]"
          @update:model-value="
            updateSelection(USER_TAB_KEYS.SHARED_EXPENSES, $event)
          "
        >
          {{ t('tabs.sharedExpenses') }}
        </el-checkbox>
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection[USER_TAB_KEYS.SHARED_LOANS]"
          @update:model-value="
            updateSelection(USER_TAB_KEYS.SHARED_LOANS, $event)
          "
        >
          {{ t('tabs.sharedLoans') }}
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
            @update:model-value="updateSelection('emailSharedExpenses', $event)"
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

    <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
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
          {{ t('tabs.personalExpenses') }}
        </el-checkbox>
        <el-checkbox
          class="!whitespace-normal"
          :model-value="selection[USER_TAB_KEYS.PERSONAL_LOANS]"
          @update:model-value="
            updateSelection(USER_TAB_KEYS.PERSONAL_LOANS, $event)
          "
        >
          {{ t('tabs.personalLoans') }}
        </el-checkbox>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { USER_TAB_KEYS } from '@/helpers'

const { t } = useI18n()

const props = defineProps({
  selection: { type: Object, required: true }
})

const emit = defineEmits(['update:selection'])

function updateSelection(key, value) {
  emit('update:selection', {
    ...props.selection,
    [key]: value
  })
}
</script>
