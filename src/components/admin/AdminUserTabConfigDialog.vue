<template>
  <el-dialog
    :model-value="visible"
    title="Edit User Tab Config"
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
              {{ user.name || 'Unnamed User' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ user.email || user.mobile || user.uid }}
            </p>
          </div>
          <div class="text-right text-xs text-gray-500 dark:text-gray-400">
            <p>`user-tab-configs/{{ user.uid }}`</p>
            <p>
              {{ config ? 'Existing config document' : 'No saved config yet' }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          Tabs and feature access
        </p>

        <el-checkbox
          class="!whitespace-normal"
          :model-value="tabSelection.shared"
          @update:model-value="updateSelection('shared', $event)"
        >
          Shared features
        </el-checkbox>

        <div v-if="tabSelection.shared" class="mt-3 space-y-2 pl-6 text-sm">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.GROUPS]"
            disabled
          >
            Groups
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.USERS]"
            @update:model-value="updateSelection(USER_TAB_KEYS.USERS, $event)"
          >
            Users
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.SHARED_EXPENSES]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_EXPENSES, $event)
            "
          >
            Shared Expenses
          </el-checkbox>
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection[USER_TAB_KEYS.SHARED_LOANS]"
            @update:model-value="
              updateSelection(USER_TAB_KEYS.SHARED_LOANS, $event)
            "
          >
            Shared Loans
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
            Email preferences
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
              Notify group when user adds a shared expense
            </el-checkbox>
            <el-checkbox
              v-if="tabSelection[USER_TAB_KEYS.SHARED_LOANS]"
              class="!whitespace-normal"
              :model-value="tabSelection.emailSharedLoans"
              @update:model-value="updateSelection('emailSharedLoans', $event)"
            >
              Notify group when user adds a shared loan
            </el-checkbox>
          </div>
        </div>

        <div class="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
          <el-checkbox
            class="!whitespace-normal"
            :model-value="tabSelection.personal"
            @update:model-value="updateSelection('personal', $event)"
          >
            Personal features
          </el-checkbox>
          <div v-if="tabSelection.personal" class="mt-3 space-y-2 pl-6 text-sm">
            <el-checkbox
              class="!whitespace-normal"
              :model-value="tabSelection[USER_TAB_KEYS.PERSONAL_EXPENSES]"
              @update:model-value="
                updateSelection(USER_TAB_KEYS.PERSONAL_EXPENSES, $event)
              "
            >
              Personal Expenses
            </el-checkbox>
            <el-checkbox
              class="!whitespace-normal"
              :model-value="tabSelection[USER_TAB_KEYS.PERSONAL_LOANS]"
              @update:model-value="
                updateSelection(USER_TAB_KEYS.PERSONAL_LOANS, $event)
              "
            >
              Personal Loans
            </el-checkbox>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
      >
        <p class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
          Admin-only tab config controls
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <ToggleRow
            label="Allow Manage Tabs for this user"
            :value="accessManageTabs"
            @change="accessManageTabs = $event"
          />
          <ToggleRow
            label="Hide blocked users by default"
            :value="hideBlockedUsers"
            @change="hideBlockedUsers = $event"
          />
          <ToggleRow
            label="Hide blocked groups by default"
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
            Usage counters
          </p>
          <el-button size="small" plain @click="resetUsageCounters">
            Reset Counters
          </el-button>
        </div>

        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
              OCR extractions map
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
              Emails sent map
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
          Use JSON objects with month keys like `YYYY-MM` and numeric counts.
        </p>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button @click="$emit('update:visible', false)">Cancel</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          Save Config
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineComponent, h, ref, resolveComponent, watch } from 'vue'
import {
  USER_TAB_KEYS,
  buildUserTabConfig,
  buildUserTabConfigDocument,
  createUserTabSelectionFromConfig,
  hasEnabledUserTabs
} from '@/helpers'
import { showError } from '@/utils'

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
    throw new Error(`${label} must be valid JSON with non-negative numbers.`)
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
    return showError(
      'Select at least one feature group — Shared or Personal — to save.'
    )
  }

  if (
    selection.shared &&
    !selection[USER_TAB_KEYS.SHARED_EXPENSES] &&
    !selection[USER_TAB_KEYS.SHARED_LOANS] &&
    !selection[USER_TAB_KEYS.USERS]
  ) {
    return showError(
      'Shared features require at least one shared tab: Shared Expenses, Shared Loans, or Users.'
    )
  }

  if (
    selection.personal &&
    !selection[USER_TAB_KEYS.PERSONAL_EXPENSES] &&
    !selection[USER_TAB_KEYS.PERSONAL_LOANS]
  ) {
    return showError(
      'Personal features require at least one personal tab: Personal Expenses or Personal Loans.'
    )
  }

  const userTabConfig = buildUserTabConfig(selection)
  if (!hasEnabledUserTabs(userTabConfig)) {
    return showError('Select at least one actual tab to continue.')
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
      'OCR extractions',
      ocrExtractionsInput.value
    )
    payload.emailsSent = parseUsageMap('Emails sent', emailsSentInput.value)

    emit('save', payload)
  } catch (error) {
    showError(error.message || 'Failed to validate user tab config.')
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
          h(resolveComponent('el-switch'), {
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
