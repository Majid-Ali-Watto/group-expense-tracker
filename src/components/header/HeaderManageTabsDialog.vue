<template>
  <UserTabConfigDialog
    :visible="visible"
    :selection="tabSelection"
    :loading="isSavingTabs"
    title="Manage Your Tabs"
    confirm-text="Save Changes"
    cancel-text="Cancel"
    :show-close="true"
    @update:visible="emit('update:visible', $event)"
    @update:selection="tabSelection = $event"
    @confirm="saveManageTabs"
    @cancel="emit('update:visible', false)"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { database, doc, setDoc } from '@/firebase'
import UserTabConfigDialog from '@/components/generic-components/UserTabConfigDialog.vue'
import { useAuthStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import { showError, showSuccess } from '@/utils/showAlerts'
import {
  USER_TAB_KEYS,
  createUserTabSelectionFromConfig,
  buildUserTabConfig,
  hasEnabledUserTabs,
  buildUserTabConfigDocument,
  canAccessManageTabs
} from '@/helpers'

defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible'])

const authStore = useAuthStore()
const userStore = useUserStore()
const isSavingTabs = ref(false)
const tabSelection = ref(
  createUserTabSelectionFromConfig(userStore.getActiveUserTabConfig)
)

watch(
  () => tabSelection.value.shared,
  (enabled) => {
    if (enabled) {
      tabSelection.value[USER_TAB_KEYS.GROUPS] = true
      tabSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = true
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
      tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = true
      return
    }

    tabSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = false
    tabSelection.value[USER_TAB_KEYS.PERSONAL_LOANS] = false
  }
)

async function saveManageTabs() {
  const uid = authStore.getActiveUser
  if (!uid || isSavingTabs.value) return

  isSavingTabs.value = true
  try {
    const sel = tabSelection.value
    if (!sel.shared && !sel.personal) {
      return showError(
        'Please select at least one feature group — Shared or Personal — to save.',
        { duration: 0 }
      )
    }
    if (sel.shared && !sel[USER_TAB_KEYS.SHARED_EXPENSES] && !sel[USER_TAB_KEYS.SHARED_LOANS] && !sel[USER_TAB_KEYS.USERS]) {
      return showError(
        'You selected Shared features but no shared tabs are enabled. Please select at least one shared tab (Shared Expenses, Shared Loans, or Users).',
        { duration: 0 }
      )
    }
    if (sel.personal && !sel[USER_TAB_KEYS.PERSONAL_EXPENSES] && !sel[USER_TAB_KEYS.PERSONAL_LOANS]) {
      return showError(
        'You selected Personal features but no personal tabs are enabled. Please select at least one personal tab (Personal Expenses or Personal Loans).',
        { duration: 0 }
      )
    }
    const userTabConfig = buildUserTabConfig(sel)
    if (!hasEnabledUserTabs(userTabConfig)) {
      return showError('Select at least one actual tab to continue.')
    }

    const payload = buildUserTabConfigDocument(
      uid,
      userTabConfig,
      userStore.getActiveUserTabConfig
    )

    await setDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), payload, {
      merge: true
    })

    userStore.setActiveUserTabAccess({
      config: payload,
      accessManageTabs: canAccessManageTabs(payload)
    })

    showSuccess('Tabs updated successfully.')
    emit('update:visible', false)
  } catch (error) {
    console.error('Failed to update tabs:', error)
    showError(
      error?.code === 'permission-denied'
        ? 'You do not have permission to update tab settings.'
        : error?.message || 'Failed to update tab settings.'
    )
  } finally {
    isSavingTabs.value = false
  }
}
</script>
