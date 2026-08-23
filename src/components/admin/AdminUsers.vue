<template>
  <el-card shadow="never" class="sm:col-span-2">
    <template #header>
      <div class="flex items-baseline gap-2">
        <span class="font-semibold text-gray-800 dark:text-gray-100">{{
          t('tabs.users')
        }}</span>
        <span class="text-xs text-gray-400">users/{uid}</span>
      </div>
    </template>

    <div v-if="loading" class="py-6 text-center text-sm text-gray-400">
      {{ t('admin.users.loadingUsers') }}
    </div>

    <template v-else>
      <!-- Search -->
      <input
        v-model="search"
        type="text"
        :placeholder="t('admin.users.searchPlaceholder')"
        class="w-full mb-4 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <!-- Column headers — hidden on mobile -->
      <div
        class="hidden sm:grid sm:grid-cols-[1fr_1fr_repeat(4,6rem)_8.5rem] gap-x-3 px-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide"
      >
        <span>{{ t('groups.nameLabel') }}</span>
        <span>{{ t('common.email') }}</span>
        <span class="text-center">{{ t('admin.users.blockedColumn') }}</span>
        <span class="text-center">{{
          t('admin.users.bugResolverColumn')
        }}</span>
        <span class="text-center">{{ t('common.admin') }}</span>
        <span class="text-center">{{ t('admin.users.paidTierColumn') }}</span>
        <span class="text-center">{{ t('admin.users.tabConfigColumn') }}</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="user in filteredUsers"
          :key="user.uid"
          class="grid sm:grid-cols-[1fr_1fr_repeat(4,6rem)_8.5rem] gap-x-3 gap-y-2 items-center px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <!-- Name -->
          <div
            class="font-medium text-sm text-gray-800 dark:text-gray-100 truncate"
          >
            {{ user.name || '—' }}
          </div>

          <!-- Email -->
          <div class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ user.email || '—' }}
          </div>

          <!-- Flags — on mobile shown as labeled rows -->
          <div
            class="sm:contents flex flex-wrap gap-4 col-span-full sm:col-span-1"
          >
            <FlagToggle
              :label="t('admin.users.blockedColumn')"
              :value="user.blocked === true"
              :danger="true"
              @change="updateUserFlag(user.uid, 'blocked', $event)"
            />
            <FlagToggle
              :label="t('admin.users.bugResolverColumn')"
              :value="user.bugResolver === true"
              @change="updateUserFlag(user.uid, 'bugResolver', $event)"
            />
            <FlagToggle
              :label="t('common.admin')"
              :value="user.isAdmin === true"
              @change="updateUserFlag(user.uid, 'isAdmin', $event)"
            />
            <FlagToggle
              :label="t('admin.users.paidTierColumn')"
              :value="user.billedUser === true"
              @change="updateUserFlag(user.uid, 'billedUser', $event)"
            />
            <div
              class="flex flex-col items-center gap-1 sm:justify-self-center"
            >
              <span class="text-xs text-gray-400 sm:hidden">{{
                t('admin.users.tabConfigColumn')
              }}</span>
              <el-button
                size="default"
                plain
                :loading="
                  saving &&
                  selectedUser?.uid === user.uid &&
                  tabConfigDialogVisible
                "
                @click="openTabConfigDialog(user)"
              >
                {{
                  getUserTabConfig(user.uid)
                    ? t('common.edit')
                    : t('groups.create')
                }}
              </el-button>
            </div>
          </div>
        </div>

        <div
          v-if="filteredUsers.length === 0"
          class="py-4 text-center text-sm text-gray-400"
        >
          {{ t('admin.users.noUsersMatch') }}
        </div>
      </div>

      <AdminUserTabConfigDialog
        v-model:visible="tabConfigDialogVisible"
        :user="selectedUser"
        :config="selectedUserConfig"
        :loading="saving"
        @save="handleSaveTabConfig"
      />
    </template>
  </el-card>
</template>

<script setup>
import { ref, computed, defineComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElSwitch } from 'element-plus'
import { AdminUsers } from '@/scripts/admin/admin-users'
import AdminUserTabConfigDialog from './AdminUserTabConfigDialog.vue'

const { t } = useI18n()
const {
  users,
  loading,
  saving,
  updateUserFlag,
  getUserTabConfig,
  saveUserTabConfig
} = AdminUsers()

const search = ref('')
const selectedUser = ref(null)
const tabConfigDialogVisible = ref(false)

const filteredUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

const selectedUserConfig = computed(() =>
  selectedUser.value ? getUserTabConfig(selectedUser.value.uid) : null
)

function openTabConfigDialog(user) {
  selectedUser.value = user
  tabConfigDialogVisible.value = true
}

async function handleSaveTabConfig(payload) {
  if (!selectedUser.value?.uid) return

  const saved = await saveUserTabConfig(selectedUser.value.uid, payload)
  if (saved) {
    tabConfigDialogVisible.value = false
  }
}

const FlagToggle = defineComponent({
  props: {
    label: String,
    value: Boolean,
    danger: { type: Boolean, default: false }
  },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h(
        'div',
        { class: 'flex flex-col items-center gap-0.5 sm:justify-self-center' },
        [
          h('span', { class: 'text-xs text-gray-400 sm:hidden' }, props.label),
          h(ElSwitch, {
            modelValue: props.value,
            activeColor: props.danger ? '#ef4444' : undefined,
            'onUpdate:modelValue': (v) => emit('change', v)
          })
        ]
      )
  }
})
</script>
