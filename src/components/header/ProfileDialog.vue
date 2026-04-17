<template>
  <el-dialog
    :model-value="visible"
    title="My Profile"
    :width="'min(92vw, 560px)'"
    class="profile-dialog"
    append-to-body
    @update:model-value="handleVisibilityChange"
  >
    <div class="space-y-4">
      <div class="profile-hero flex items-start gap-3 rounded-2xl p-4">
        <div class="profile-avatar">
          <UserIcon class="w-6 h-6 text-white" />
        </div>

        <div class="min-w-0 flex-1">
          <p
            class="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase"
          >
            Account
          </p>
          <h3 class="mt-1 text-xl font-bold text-slate-900">
            {{ profileName }}
          </h3>
          <p class="mt-1 text-sm text-slate-600 break-all">
            {{ profileEmail }}
          </p>
        </div>
      </div>

      <el-alert
        v-if="isBlocked"
        title="Your account is currently blocked. Users and groups remain visible for reference only."
        type="warning"
        :closable="false"
      />

      <el-descriptions :column="1" border>
        <el-descriptions-item label="Email Address">
          {{ profileEmail }}
        </el-descriptions-item>
        <el-descriptions-item label="Full Name">
          <div class="profile-field-value">
            <span>{{ profileName }}</span>
            <el-button
              text
              circle
              size="small"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEditDialog('name')"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Mobile Number">
          <div class="profile-field-value">
            <span>{{ profileMobile }}</span>
            <el-button
              text
              circle
              size="small"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEditDialog('mobile')"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Email Verification">
          <el-tag :type="emailVerified ? 'success' : 'info'" effect="light">
            {{ emailVerified ? 'Verified' : 'Pending' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Account Status">
          <el-tag :type="isBlocked ? 'danger' : 'success'" effect="light">
            {{ isBlocked ? 'Blocked' : 'Active' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <div class="flex justify-between items-center flex-wrap gap-3 help-footer">
        <el-button
          size="small"
          type="warning"
          :disabled="isBlocked"
          @click="showChangePasswordDialog = true"
        >
          Change Password
        </el-button>
        <el-button
          size="small"
          type="primary"
          @click="handleVisibilityChange(false)"
        >
          Close
        </el-button>
      </div>
    </template>
  </el-dialog>

  <ChangePasswordDialog
    v-if="showChangePasswordDialog"
    @close="showChangePasswordDialog = false"
  />

  <el-dialog
    :model-value="editDialogVisible"
    :title="editDialogTitle"
    :width="'min(92vw, 420px)'"
    append-to-body
    @update:model-value="handleEditVisibilityChange"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="space-y-3"
    >
      <el-form-item v-if="editField === 'name'" label="Full Name" prop="name">
        <GenericInputField
          ref="nameInputRef"
          :model-value="form.name"
          :wrap-form-item="false"
          placeholder="Full name"
          :maxlength="50"
          @update:modelValue="form.name = $event.toCapitalize()"
        />
      </el-form-item>

      <el-form-item v-else label="Mobile Number" prop="mobile">
        <GenericInputField
          ref="mobileInputRef"
          :model-value="form.mobile"
          :wrap-form-item="false"
          placeholder="03XXXXXXXXX"
          :maxlength="11"
          type="tel"
          @update:modelValue="form.mobile = $event"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button size="small" @click="resetForm">Reset</el-button>
        <el-button size="small" @click="handleEditVisibilityChange(false)">
          Cancel
        </el-button>
        <el-button
          size="small"
          type="success"
          :loading="isSubmitting"
          :disabled="isSubmitting || isBlocked"
          @click="submitProfileUpdate"
        >
          Save Changes
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { auth, updateProfile } from '@/firebase'
import { UserIcon } from '@/components/icons'
import { GenericInputField } from '@/components/generic-components'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
import { useFireBase } from '@/composables'
import { useGroupStore, useUserStore } from '@/stores'
import { appendNotificationForUser, maskMobile, showError } from '@/utils'
import { DB_NODES } from '@/constants'
import { setUserInStorage } from '@/utils/whoAdded'

const props = defineProps({
  visible: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const groupStore = useGroupStore()
const userStore = useUserStore()
const { read, updateData, isSubmitting } = useFireBase()
const formRef = ref(null)
const editDialogVisible = ref(false)
const editField = ref('name')
const showChangePasswordDialog = ref(false)
const nameInputRef = ref(null)
const mobileInputRef = ref(null)
const form = reactive({
  name: '',
  mobile: ''
})

const profileName = computed(() => props.user?.name || 'Account User')
const profileEmail = computed(() => props.user?.email || 'Not available')
const profileMobile = computed(() => props.user?.mobile || 'Not available')
const emailVerified = computed(() => props.user?.emailVerified !== false)
const isBlocked = computed(() => props.user?.blocked === true)
const editDialogTitle = computed(() =>
  editField.value === 'mobile' ? 'Edit Mobile Number' : 'Edit Full Name'
)

const rules = {
  name: [
    {
      validator: (_, value, callback) => {
        const normalized = normalizeName(value)
        if (!normalized) return callback(new Error('Name is required'))
        if (normalized.length < 3) {
          return callback(new Error('Name should be at least 3 characters'))
        }
        if (!isValidName(normalized)) {
          return callback(
            new Error('Name can only contain alphabets and single spaces')
          )
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  mobile: [
    {
      validator: (_, value, callback) => {
        const normalized = normalizeMobile(value)
        if (!normalized) {
          return callback(new Error('Mobile number is required'))
        }
        if (!isValidMobile(normalized)) {
          return callback(
            new Error('Mobile number must be 11 digits starting with 03')
          )
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ]
}

function normalizeName(value = '') {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizeMobile(value = '') {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
}

function isValidName(name) {
  return /^[a-zA-Z]+(\s[a-zA-Z]+)*$/.test(name)
}

function isValidMobile(mobile) {
  return /^03\d{9}$/.test(mobile)
}

function userMatchesMember(member, userUid) {
  return member?.uid === userUid
}

function syncFormFromUser(user) {
  form.name = user?.name || ''
  form.mobile = user?.mobile || ''
}

async function clearValidation() {
  await nextTick()
  formRef.value?.clearValidate()
}

function resetForm() {
  syncFormFromUser(props.user)
  clearValidation()
}

function handleEditVisibilityChange(nextVisible) {
  if (!nextVisible) {
    editDialogVisible.value = false
    resetForm()
    return
  }
  editDialogVisible.value = true
}

async function openEditDialog(field = 'name') {
  if (isBlocked.value) return

  editField.value = field
  resetForm()
  editDialogVisible.value = true
  await nextTick()

  const targetRef =
    field === 'mobile' ? mobileInputRef.value : nameInputRef.value
  targetRef?.$el?.querySelector('input, textarea')?.focus()
}

function handleVisibilityChange(nextVisible) {
  if (!nextVisible) {
    editDialogVisible.value = false
    showChangePasswordDialog.value = false
    resetForm()
  }
  emit('update:visible', nextVisible)
}

async function notifyGroupsAboutProfileChange({
  uid,
  oldName,
  newName,
  mobileChanged
}) {
  const memberGroups = (groupStore.getGroups || []).filter((group) =>
    (group.members || []).some((member) => userMatchesMember(member, uid))
  )

  for (const group of memberGroups) {
    const coMembers = (group.members || []).filter(
      (member) => !userMatchesMember(member, uid)
    )
    if (!coMembers.length) continue

    const changeParts = []
    if (oldName !== newName) {
      changeParts.push(`changed their name from "${oldName}" to "${newName}"`)
    }
    if (mobileChanged) {
      changeParts.push('updated their mobile number')
    }

    let updatedGroup = { ...group }
    for (const member of coMembers) {
      updatedGroup = appendNotificationForUser(updatedGroup, member.uid, {
        id: Date.now().toString() + Math.random(),
        type: 'member-renamed',
        message: `${newName} has ${changeParts.join(' and ')} in group "${group.name}".`,
        updatedBy: uid,
        timestamp: Date.now()
      })
    }

    await updateData(
      `${DB_NODES.GROUPS}/${group.id}`,
      () => ({ notifications: updatedGroup.notifications }),
      ''
    )
  }
}

async function submitProfileUpdate() {
  if (!props.user?.uid || isBlocked.value) return

  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const uid = props.user.uid
  const newName = normalizeName(form.name)
  const newMobile = normalizeMobile(form.mobile)

  const currentUser = await read(`${DB_NODES.USERS}/${uid}`)
  if (!currentUser) {
    showError('User not found')
    return
  }

  const existingUsers = (await read(DB_NODES.USERS, false)) || {}
  const mobileTaken = Object.entries(existingUsers).some(
    ([otherUid, otherUser]) =>
      otherUid !== uid && normalizeMobile(otherUser?.mobile || '') === newMobile
  )
  if (mobileTaken) {
    showError('An account with this mobile number already exists')
    return
  }

  const oldName = currentUser.name || ''
  const previousMobile = normalizeMobile(currentUser.mobile || '')
  const nameChanged = oldName !== newName
  const mobileChanged = previousMobile !== newMobile

  if (!nameChanged && !mobileChanged) {
    handleEditVisibilityChange(false)
    return
  }

  await updateData(
    `${DB_NODES.USERS}/${uid}`,
    () => ({
      name: newName,
      mobile: newMobile
    }),
    'Profile updated successfully'
  )

  userStore.addUser({
    uid,
    name: newName,
    mobile: newMobile,
    email: currentUser.email || props.user?.email || '',
    emailVerified: currentUser.emailVerified !== false,
    blocked: currentUser.blocked === true,
    maskedMobile: maskMobile(newMobile)
  })

  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: newName
    }).catch(() => {})
  }

  if (localStorage.getItem('rememberMeData')) {
    setUserInStorage({ name: newName, mobile: newMobile })
  }

  await notifyGroupsAboutProfileChange({
    uid,
    oldName,
    newName,
    mobileChanged
  })

  handleEditVisibilityChange(false)
}

watch(
  () => props.user,
  (user) => {
    syncFormFromUser(user)
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm()
    }
  }
)
</script>

<style scoped>
.profile-hero {
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.14),
      transparent 45%
    ),
    linear-gradient(
      135deg,
      rgba(236, 253, 245, 0.95),
      rgba(240, 253, 244, 0.88)
    );
  border: 1px solid rgba(16, 185, 129, 0.18);
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #22c55e, #15803d);
  box-shadow: 0 14px 24px -18px rgba(21, 128, 61, 0.8);
}

.profile-field-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

:global(:root.dark-theme) .profile-hero {
  background:
    radial-gradient(
      circle at top right,
      rgba(74, 222, 128, 0.2),
      transparent 45%
    ),
    linear-gradient(135deg, rgba(17, 24, 39, 0.96), rgba(31, 41, 55, 0.94));
  border-color: rgba(74, 222, 128, 0.2);
}

:global(:root.dark-theme) .profile-hero h3 {
  color: #f9fafb;
}

:global(:root.dark-theme) .profile-hero p {
  color: #d1d5db;
}
</style>
