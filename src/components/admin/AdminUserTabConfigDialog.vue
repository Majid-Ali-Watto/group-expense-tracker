<template>
  <el-dialog
    :model-value="visible"
    :title="t('admin.userTabConfig.title')"
    width="min(96vw, 760px)"
    top="96px"
    append-to-body
    :close-on-click-modal="false"
    destroy-on-close
    class="admin-user-tab-config-dialog"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="user" class="space-y-5">
      <section
        class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {{ user.name || t('admin.userTabConfig.unnamedUser') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ user.email || user.mobile || user.uid }}
            </p>
          </div>
          <div class="text-right text-xs text-gray-500 dark:text-gray-400">
            <p>`user-tab-configs/{{ user.uid }}`</p>
            <p>
              {{
                config
                  ? t('admin.userTabConfig.existingConfigDoc')
                  : t('admin.userTabConfig.noSavedConfigYet')
              }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ t('admin.userTabConfig.tabsAndFeatureAccess') }}
        </p>

        <el-checkbox
          class="!whitespace-normal"
          :model-value="tabSelection.shared"
          @update:model-value="updateSelection('shared', $event)"
        >
          {{ t('auth.tabConfig.sharedFeatures') }}
        </el-checkbox>

        <div v-if="tabSelection.shared" class="mt-3 space-y-2 pl-6 text-sm">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.GROUPS]"
            disabled
          >
            {{ t('tabs.groups') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.USERS]"
            @update:model-value="updateSelection(USER_TAB_KEYS.USERS, $event)"
          >
            {{ t('tabs.users') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.SHARED_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_EXPENSES, $event)
            "
          >
            {{ t('tabs.sharedExpenses') }}
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.SHARED_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_LOANS, $event)
            "
          >
            {{ t('tabs.sharedLoans') }}
          </el-checkbox>
        </div>

        <div
          v-if="
            tabSelection.shared &&
            (tabSelection[USER_TAB_KEYS.SHARED_EXPENSES] ||
              tabSelection[USER_TAB_KEYS.SHARED_LOANS])
          "
          class="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700"
        >
          <p class="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {{ t('admin.userTabConfig.emailPreferences') }}
          </p>
          <div class="space-y-2 pl-6 text-sm">
            <el-checkbox
              v-if="tabSelection[USER_TAB_KEYS.SHARED_EXPENSES]"
              class="!whitespace-normal"
              :model-value="tabSelection.emailSharedExpenses"
              @update:model-value="
                updateSelection('emailSharedExpenses', $event)
              "
            >
              {{ t('admin.userTabConfig.notifySharedExpense') }}
            </el-checkbox>
            <el-checkbox
              v-if="tabSelection[USER_TAB_KEYS.SHARED_LOANS]"
              class="!whitespace-normal"
              :model-value="tabSelection.emailSharedLoans"
              @update:model-value="updateSelection('emailSharedLoans', $event)"
            >
              {{ t('admin.userTabConfig.notifySharedLoan') }}
            </el-checkbox>
          </div>
        </div>

        <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection.personal"
            @update:model-value="updateSelection('personal', $event)"
          >
            {{ t('auth.tabConfig.personalFeatures') }}
          </el-checkbox>
          <div v-if="tabSelection.personal" class="mt-3 space-y-2 pl-6 text-sm">
            <el-checkbox
              class="!whitespace-normal"
              :model-value="tabSelection[USER_TAB_KEYS.PERSONAL_EXPENSES]"
              @update:model-value="
                updateSelection(USER_TAB_KEYS.PERSONAL_EXPENSES, $event)
              "
            >
              {{ t('tabs.personalExpenses') }}
            </el-checkbox>
            <el-checkbox
              class="!whitespace-normal"
              :model-value="tabSelection[USER_TAB_KEYS.PERSONAL_LOANS]"
              @update:model-value="
                updateSelection(USER_TAB_KEYS.PERSONAL_LOANS, $event)
              "
            >
              {{ t('tabs.personalLoans') }}
            </el-checkbox>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          {{ t('admin.userTabConfig.adminOnlyControls') }}
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            :label="t('admin.userTabConfig.allowManageTabs')"
            :value="accessManageTabs"
            @change="accessManageTabs = $event"
          />
          <ToggleRow
            :label="t('admin.userTabConfig.hideBlockedUsersDefault')"
            :value="hideBlockedUsers"
            @change="hideBlockedUsers = $event"
          />
          <ToggleRow
            :label="t('admin.userTabConfig.hideBlockedGroupsDefault')"
            :value="hideBlockedGroups"
            @change="hideBlockedGroups = $event"
          />
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ t('admin.userTabConfig.usageCounters') }}
          </p>
          <el-button size="default" plain @click="resetUsageCounters">
            {{ t('admin.userTabConfig.resetCounters') }}
          </el-button>
        </div>

        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ t('admin.userTabConfig.ocrExtractionsMap') }}
            </p>
            <el-input
              v-model="ocrExtractionsInput"
              type="textarea"
              :rows="8"
              placeholder='{\n  "2026-04": 3\n}'
            />
          </div>

          <div class="space-y-2">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
              {{ t('admin.userTabConfig.emailsSentMap') }}
            </p>
            <el-input
              v-model="emailsSentInput"
              type="textarea"
              :rows="8"
              placeholder='{\n  "2026-04": 7\n}'
            />
          </div>
        </div>

        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {{ t('admin.userTabConfig.jsonHint') }}
        </p>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="$emit('update:visible', false)">{{
          t('common.cancel')
        }}</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          {{ t('admin.userTabConfig.saveConfig') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineComponent, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElSwitch } from 'element-plus'
import {
  USER_TAB_KEYS,
  buildUserTabConfig,
  buildUserTabConfigDocument,
  createUserTabSelectionFromConfig,
  hasEnabledUserTabs
} from '@/helpers'
import { showError } from '@/utils'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  user: { type: Object, default: null },
  config: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'save'])

const tabSelection = ref(createUserTabSelectionFromConfig(null))
const accessManageTabs = ref(true)
const hideBlockedUsers = ref(false)
const hideBlockedGroups = ref(false)
const ocrExtractionsInput = ref('{}')
const emailsSentInput = ref('{}')

watch(
  () => tabSelection.value.shared,
  (enabled) => {
    if (enabled) {
      tabSelection.value[USER_TAB_KEYS.GROUPS] = true
      tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] =
        tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] === true
      return
    }

    tabSelection.value[USER_TAB_KEYS.GROUPS] = false
    tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = false
    tabSelection.value[USER_TAB_KEYS.SHARED_LOANS] = false
    tabSelection.value[USER_TAB_KEYS.USERS] = false
  }
)

watch(
  () => tabSelection.value.personal,
  (enabled) => {
    if (enabled) {
      tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] =
        tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] === true
      return
    }

    tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = false
    tabSelection.value[USER_TAB_KEYS.PERSONAL_LOANS] = false
  }
)

watch(
  [() => props.visible, () => props.config, () => props.user],
  ([visible]) => {
    if (!visible) return
    syncForm()
  },
  { immediate: true }
)

function updateSelection(key, value) {
  tabSelection.value = {
    ...tabSelection.value,
    [key]: value
  }
}

function normalizeUsageMap(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => typeof key === 'string' && key.trim())
      .map(([key, rawValue]) => [
        key,
        Math.max(0, Math.trunc(Number(rawValue) || 0))
      ])
  )
}

function formatUsageMap(value) {
  return JSON.stringify(normalizeUsageMap(value), null, 2)
}

function parseUsageMap(label, text) {
  try {
    const raw = text.trim() || '{}'
    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Expected an object.')
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => {
        const numericValue = Number(value)
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          throw new Error(`Invalid value for "${key}".`)
        }
        return [key, Math.trunc(numericValue)]
      })
    )
  } catch {
    throw new Error(t('admin.userTabConfig.validJsonError', { label }))
  }
}

function syncForm() {
  tabSelection.value = createUserTabSelectionFromConfig(props.config)
  accessManageTabs.value = props.config?.accessManageTabs !== false
  hideBlockedUsers.value = props.config?.hideBlockedUsers === true
  hideBlockedGroups.value = props.config?.hideBlockedGroups === true
  ocrExtractionsInput.value = formatUsageMap(props.config?.ocrExtractions)
  emailsSentInput.value = formatUsageMap(props.config?.emailsSent)
}

function resetUsageCounters() {
  ocrExtractionsInput.value = '{}'
  emailsSentInput.value = '{}'
}

function handleSave() {
  if (!props.user?.uid) return

  const selection = tabSelection.value
  if (!selection.shared && !selection.personal) {
    return showError(t('admin.userTabConfig.selectFeatureGroupError'))
  }

  if (
    selection.shared &&
    !selection[USER_TAB_KEYS.SHARED_EXPENSES] &&
    !selection[USER_TAB_KEYS.SHARED_LOANS] &&
    !selection[USER_TAB_KEYS.USERS]
  ) {
    return showError(t('admin.userTabConfig.sharedRequiresTabError'))
  }

  if (
    selection.personal &&
    !selection[USER_TAB_KEYS.PERSONAL_EXPENSES] &&
    !selection[USER_TAB_KEYS.PERSONAL_LOANS]
  ) {
    return showError(t('admin.userTabConfig.personalRequiresTabError'))
  }

  const userTabConfig = buildUserTabConfig(selection)
  if (!hasEnabledUserTabs(userTabConfig)) {
    return showError(t('authMessages.selectAtLeastOneTab'))
  }

  try {
    const payload = buildUserTabConfigDocument(
      props.user.uid,
      userTabConfig,
      props.config
    )

    payload.accessManageTabs = accessManageTabs.value
    payload.hideBlockedUsers = hideBlockedUsers.value
    payload.hideBlockedGroups = hideBlockedGroups.value
    payload.ocrExtractions = parseUsageMap(
      t('admin.userTabConfig.ocrExtractionsMap'),
      ocrExtractionsInput.value
    )
    payload.emailsSent = parseUsageMap(
      t('admin.userTabConfig.emailsSentMap'),
      emailsSentInput.value
    )

    emit('save', payload)
  } catch (error) {
    showError(error.message || t('admin.userTabConfig.validateFailed'))
  }
}

const ToggleRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Boolean, default: false }
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        {
          class:
            'flex items-center justify-between gap-4 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-700'
        },
        [
          h(
            'span',
            { class: 'text-sm text-gray-700 dark:text-gray-300' },
            props.label
          ),
          h(ElSwitch, {
            modelValue: props.value,
            'onUpdate:modelValue': (value) => emit('change', value)
          })
        ]
      )
  }
})
</script>

<style>
.admin-user-tab-config-dialog .el-dialog__body {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

@media (max-width: 640px) {
  .admin-user-tab-config-dialog .el-dialog {
    margin: 0 auto;
    width: min(96vw, 760px) !important;
  }

  .admin-user-tab-config-dialog .el-dialog__body {
    max-height: calc(100vh - 180px);
  }
}
</style>
