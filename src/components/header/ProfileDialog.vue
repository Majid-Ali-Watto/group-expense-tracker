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
        <UserAvatar
          :image-url="previewPhotoUrl || profilePhotoUrl"
          :preview-url="previewPhotoUrl || profilePhotoUrl"
          alt="Profile photo"
          :preview-title="`${profileName}'s Profile Photo`"
          :preview-on-click="true"
          :disabled="!(previewPhotoUrl || profilePhotoUrl)"
          size="lg"
          variant="profile"
          icon-size="lg"
          icon-tone="white"
        />

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
          <div class="mt-2 flex flex-wrap gap-2">
            <input
              ref="photoInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handlePhotoSelected"
            />
            <el-button
              size="small"
              type="success"
              plain
              :loading="photoSubmitting"
              :disabled="isBlocked || photoSubmitting"
              @click="photoInputRef?.click()"
            >
              {{ profilePhotoUrl ? 'Update Photo' : 'Add Photo' }}
            </el-button>
            <el-button
              v-if="profilePhotoUrl"
              size="small"
              text
              :loading="photoSubmitting"
              :disabled="isBlocked || photoSubmitting"
              @click="removeProfilePhoto"
            >
              Remove
            </el-button>
          </div>
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
          <div class="profile-field-value">
            <div class="min-w-0 flex-1">
              <span class="break-all">{{ profileEmail }}</span>
              <p
                v-if="!canEditVerifiedEmail"
                class="mt-1 text-xs text-gray-500"
              >
                Managed by your current sign-in provider.
              </p>
            </div>
            <el-button
              v-if="canEditVerifiedEmail"
              text
              circle
              size="small"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEmailDialog"
            />
          </div>
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

        <el-descriptions-item :label="`Emails Sent (${usageMonthKey})`">
          {{ emailsSentCount }} / {{ emailsSentLimitLabel }}
        </el-descriptions-item>
        <el-descriptions-item :label="`OCR Extractions (${usageMonthKey})`">
          {{ ocrExtractionsCount }} / {{ ocrExtractionsLimitLabel }}
        </el-descriptions-item>
        <el-descriptions-item label="Account Tier">
          <el-tag :type="accountTierTagType" effect="light">
            {{ accountTierLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Roles">
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-if="isAdminUser"
              size="small"
              type="danger"
              effect="light"
            >
              Admin
            </el-tag>
            <el-tag
              v-if="isBugResolver"
              size="small"
              type="warning"
              effect="light"
            >
              Bug Resolver
            </el-tag>
            <span
              v-if="!isAdminUser && !isBugResolver"
              class="text-sm text-gray-500"
            >
              Standard user
            </span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Account Status">
          <el-tag :type="isBlocked ? 'danger' : 'success'" effect="light">
            {{ isBlocked ? 'Blocked' : 'Active' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <div
        class="flex justify-between items-center flex-wrap gap-3 help-footer"
      >
        <div class="flex flex-wrap items-center gap-2">
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
            type="danger"
            plain
            :disabled="isBlocked || hasPendingDeleteRequest"
            @click="requestDeleteAccount"
          >
            {{
              hasPendingDeleteRequest
                ? `Delete Pending (${deleteRequestApprovalsCount}/${deleteRequestRequiredCount})`
                : 'Delete Account'
            }}
          </el-button>
        </div>
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
    :model-value="emailDialogVisible"
    title="Update Verified Email"
    :width="'min(92vw, 440px)'"
    append-to-body
    @update:model-value="handleEmailVisibilityChange"
  >
    <el-form
      ref="emailFormRef"
      :model="emailForm"
      :rules="emailRules"
      label-position="top"
      class="space-y-3 w-full flex flex-col items-center"
    >
      <el-form-item label="New Verified Email" prop="email">
        <GenericInputField
          ref="emailInputRef"
          :model-value="emailForm.email"
          :wrap-form-item="false"
          placeholder="new@example.com"
          type="email"
          @update:modelValue="emailForm.email = $event"
        />
      </el-form-item>

      <el-form-item label="Confirm New Email" prop="confirmEmail">
        <GenericInputField
          ref="confirmEmailInputRef"
          :model-value="emailForm.confirmEmail"
          :wrap-form-item="false"
          placeholder="new@example.com"
          type="email"
          @update:modelValue="emailForm.confirmEmail = $event"
        />
      </el-form-item>

      <el-form-item label="Current Password" prop="currentPassword">
        <GenericInputField
          ref="currentPasswordInputRef"
          :model-value="emailForm.currentPassword"
          :wrap-form-item="false"
          placeholder="Current password"
          type="password"
          show-password
          @update:modelValue="emailForm.currentPassword = $event"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button size="small" @click="resetEmailForm">Reset</el-button>
        <el-button size="small" @click="handleEmailVisibilityChange(false)">
          Cancel
        </el-button>
        <el-button
          size="small"
          type="success"
          :loading="emailSubmitting"
          :disabled="emailSubmitting || isBlocked || !canEditVerifiedEmail"
          @click="submitEmailUpdate"
        >
          Send Verification
        </el-button>
      </div>
    </template>
  </el-dialog>

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

  <ProfilePhotoEditorDialog
    :visible="photoEditorVisible"
    :source-url="photoEditorSourceUrl"
    :submitting="photoSubmitting"
    @update:visible="(visible) => (visible ? null : closePhotoEditor())"
    @confirm="handleEditedPhotoConfirm"
  />
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import {
  auth,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
  verifyBeforeUpdateEmail
} from '@/firebase'
import { GenericInputField, UserAvatar } from '@/components/generic-components'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
import ProfilePhotoEditorDialog from '@/components/header/ProfilePhotoEditorDialog.vue'
import { getEmailConfig, getOcrConfig, useFireBase } from '@/composables'
import { findUserByEmail, validateEmail } from '@/helpers'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import {
  appendNotificationForUser,
  deleteReceipt,
  maskMobile,
  showError,
  showSuccess,
  uploadReceipt
} from '@/utils'
import { DB_NODES } from '@/constants'
import { setUserInStorage } from '@/utils/whoAdded'

const props = defineProps({
  visible: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['update:visible'])

const authStore = useAuthStore()
const groupStore = useGroupStore()
const userStore = useUserStore()
const { read, updateData, deleteData, isSubmitting } = useFireBase()
const formRef = ref(null)
const emailFormRef = ref(null)
const editDialogVisible = ref(false)
const emailDialogVisible = ref(false)
const editField = ref('name')
const showChangePasswordDialog = ref(false)
const photoInputRef = ref(null)
const nameInputRef = ref(null)
const mobileInputRef = ref(null)
const emailInputRef = ref(null)
const confirmEmailInputRef = ref(null)
const currentPasswordInputRef = ref(null)
const previewPhotoUrl = ref('')
const photoSubmitting = ref(false)
const emailSubmitting = ref(false)
const photoEditorVisible = ref(false)
const photoEditorSourceUrl = ref('')
const selectedPhotoName = ref('profile-photo.jpg')
const form = reactive({
  name: '',
  mobile: ''
})
const emailForm = reactive({
  email: '',
  confirmEmail: '',
  currentPassword: ''
})

const profileName = computed(() => props.user?.name || 'Account User')
const profileEmail = computed(() => props.user?.email || 'Not available')
const profileMobile = computed(() => props.user?.mobile || 'Not available')
const profilePhotoUrl = computed(() => props.user?.photoUrl || '')
const emailVerified = computed(() => props.user?.emailVerified !== false)
const canEditVerifiedEmail = computed(
  () =>
    auth.currentUser?.providerData?.some(
      (provider) => provider.providerId === 'password'
    ) === true
)
const isBlocked = computed(() => props.user?.blocked === true)
const isAdminUser = computed(() => props.user?.isAdmin === true)
const isBugResolver = computed(() => props.user?.bugResolver === true)
const isBilledUser = computed(() => props.user?.billedUser === true)
const activeUserTabConfig = computed(
  () => userStore.getActiveUserTabConfig || {}
)
const currentDeleteRequest = computed(
  () =>
    props.user?.deleteRequest ||
    userStore.getUserByUid(props.user?.uid)?.deleteRequest ||
    null
)
const hasPendingDeleteRequest = computed(() => !!currentDeleteRequest.value)
const deleteRequestApprovalsCount = computed(
  () => currentDeleteRequest.value?.approvals?.length || 0
)
const deleteRequestRequiredCount = computed(
  () => currentDeleteRequest.value?.requiredApprovals?.length || 0
)
const usageMonthKey = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})
const emailsSentCount = computed(
  () => activeUserTabConfig.value?.emailsSent?.[usageMonthKey.value] ?? 0
)
const emailsSentLimit = computed(() => {
  const cfg = getEmailConfig()
  const raw = isBilledUser.value
    ? cfg.paid_emails_limit_per_month
    : cfg.free_email_limit_per_month
  return raw != null ? Number(raw) : null
})
const ocrExtractionsCount = computed(
  () => activeUserTabConfig.value?.ocrExtractions?.[usageMonthKey.value] ?? 0
)
const ocrExtractionsLimit = computed(() => {
  const cfg = getOcrConfig()
  const raw = isBilledUser.value
    ? cfg.paid_extraction_limit_per_month
    : cfg.free_extraction_limit_per_month
  return raw != null ? Number(raw) : null
})
const emailsSentLimitLabel = computed(() =>
  emailsSentLimit.value == null ? 'Unlimited' : emailsSentLimit.value
)
const ocrExtractionsLimitLabel = computed(() =>
  ocrExtractionsLimit.value == null ? 'Unlimited' : ocrExtractionsLimit.value
)

const accountTierLabel = computed(() =>
  isBilledUser.value ? 'Paid Tier' : 'Free Tier'
)
const accountTierTagType = computed(() =>
  isBilledUser.value ? 'success' : 'info'
)
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

const emailRules = {
  email: [
    {
      validator: (_, value, callback) => {
        const normalized = normalizeEmail(value)
        if (!normalized) return callback(new Error('New email is required'))
        if (!validateEmail(normalized)) {
          return callback(new Error('Please enter a valid email address'))
        }
        if (normalized === normalizeEmail(profileEmail.value)) {
          return callback(
            new Error('New email must be different from your current email')
          )
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  confirmEmail: [
    {
      validator: (_, value, callback) => {
        const normalized = normalizeEmail(value)
        if (!normalized) {
          return callback(new Error('Please confirm your new email'))
        }
        if (normalized !== normalizeEmail(emailForm.email)) {
          return callback(new Error('Email addresses do not match'))
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  currentPassword: [
    {
      required: true,
      message: 'Current password is required',
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

function normalizeEmail(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
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

function syncPreviewPhoto(user) {
  previewPhotoUrl.value = user?.photoUrl || ''
}

function resetEmailForm() {
  emailForm.email = ''
  emailForm.confirmEmail = ''
  emailForm.currentPassword = ''
  nextTick(() => emailFormRef.value?.clearValidate())
}

async function clearValidation() {
  await nextTick()
  formRef.value?.clearValidate()
}

function resetForm() {
  syncFormFromUser(props.user)
  syncPreviewPhoto(props.user)
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

function handleEmailVisibilityChange(nextVisible) {
  if (!nextVisible) {
    emailDialogVisible.value = false
    resetEmailForm()
    return
  }
  emailDialogVisible.value = true
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

async function openEmailDialog() {
  if (isBlocked.value) return
  if (!canEditVerifiedEmail.value) {
    showError('Email updates are only available for password-based accounts.')
    return
  }

  resetEmailForm()
  emailDialogVisible.value = true
  await nextTick()
  emailInputRef.value?.$el?.querySelector('input, textarea')?.focus()
}

function handleVisibilityChange(nextVisible) {
  if (!nextVisible) {
    editDialogVisible.value = false
    emailDialogVisible.value = false
    showChangePasswordDialog.value = false
    closePhotoEditor()
    resetForm()
    resetEmailForm()
  }
  emit('update:visible', nextVisible)
}

function validateProfilePhoto(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showError('Only JPG, PNG, and WEBP images are allowed.')
    return false
  }
  if (file.size > 1024 * 1024) {
    showError('Profile photo size must be less than 1MB.')
    return false
  }

  return true
}

function closePhotoEditor() {
  photoEditorVisible.value = false

  if (photoEditorSourceUrl.value) {
    URL.revokeObjectURL(photoEditorSourceUrl.value)
  }

  photoEditorSourceUrl.value = ''
  selectedPhotoName.value = 'profile-photo.jpg'
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

function buildUpdatedUserPayload(currentUser, overrides = {}) {
  return {
    uid: currentUser.uid || props.user?.uid || '',
    name: overrides.name ?? currentUser.name ?? props.user?.name ?? '',
    mobile: overrides.mobile ?? currentUser.mobile ?? props.user?.mobile ?? '',
    email: currentUser.email || props.user?.email || '',
    emailVerified: currentUser.emailVerified !== false,
    blocked: currentUser.blocked === true,
    maskedMobile: maskMobile(
      overrides.mobile ?? currentUser.mobile ?? props.user?.mobile ?? ''
    ),
    photoUrl:
      overrides.photoUrl ?? currentUser.photoUrl ?? props.user?.photoUrl ?? '',
    photoMeta:
      overrides.photoMeta ??
      currentUser.photoMeta ??
      props.user?.photoMeta ??
      null,
    deleteRequest:
      overrides.deleteRequest ??
      currentUser.deleteRequest ??
      props.user?.deleteRequest ??
      null
  }
}

function getGroupOwnerUids(userUid) {
  return [
    ...new Set(
      (groupStore.getGroups || [])
        .filter((group) =>
          (group.members || []).some((member) =>
            userMatchesMember(member, userUid)
          )
        )
        .map((group) => group.ownerUid)
        .filter(Boolean)
    )
  ]
}

async function clearDeletedSession(uid) {
  userStore.setUsers(
    [...(userStore.getUsers || [])].filter((user) => user.uid !== uid)
  )
  authStore.setActiveUserUid(null)
  authStore.setSessionToken(null)
  authStore.setActivePassword(null)
  groupStore.setActiveGroup(null)
  sessionStorage.removeItem('_session')
  emit('update:visible', false)
}

async function requestDeleteAccount() {
  const uid = props.user?.uid
  const name = profileName.value
  if (!uid || isBlocked.value || hasPendingDeleteRequest.value) return

  try {
    const ownerUids = getGroupOwnerUids(uid)
    await ElMessageBox.confirm(
      `Are you sure you want to delete <strong>${name}</strong>?${
        ownerUids.length > 0
          ? '<br><br>Your account is in one or more groups. All group owners must approve before deletion.'
          : ''
      }`,
      'Delete Account',
      {
        confirmButtonText: 'Proceed',
        cancelButtonText: 'Cancel',
        type: 'error',
        dangerouslyUseHTMLString: true
      }
    )

    const user = await read(`${DB_NODES.USERS}/${uid}`)
    if (!user) return showError('User not found')
    if (user.deleteRequest) {
      return showError('A delete request is already pending for this account')
    }
    if (user.updateRequest) {
      return showError(
        'An update request is pending. Resolve it before deleting the account.'
      )
    }

    if (ownerUids.length === 0) {
      await deleteData(`${DB_NODES.USERS}/${uid}`, `User ${name} deleted`)

      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          await deleteUser(currentUser)
        }
      } catch (authError) {
        console.error('Error deleting user from Firebase Auth:', authError)
        showError(
          'Account deleted from database but Firebase Authentication deletion failed. You may need to sign in again to complete deletion.'
        )
      }

      await clearDeletedSession(uid)
      return
    }

    const deleteRequest = {
      requestedBy: uid,
      requiredApprovals: ownerUids,
      approvals: []
    }

    await updateData(
      `${DB_NODES.USERS}/${uid}`,
      () => ({ deleteRequest }),
      'Delete request sent to group owners for approval'
    )
    userStore.addUser({ uid, deleteRequest })
  } catch (error) {
    if (error !== 'cancel') {
      showError(error?.message || 'Failed to process delete request')
    }
  }
}

async function persistProfilePhoto(file) {
  if (!props.user?.uid || isBlocked.value) return

  if (!validateProfilePhoto(file)) {
    return
  }

  photoSubmitting.value = true
  try {
    const uploaded = await uploadReceipt(file)
    const currentUser = await read(`${DB_NODES.USERS}/${props.user.uid}`)
    if (!currentUser) {
      showError('User not found')
      return
    }

    const previousMeta = currentUser.photoMeta || props.user?.photoMeta || null
    await updateData(
      `${DB_NODES.USERS}/${props.user.uid}`,
      () => ({
        photoUrl: uploaded.url,
        photoMeta: uploaded
      }),
      'Profile photo updated successfully'
    )

    if (previousMeta?.url && previousMeta.url !== uploaded.url) {
      deleteReceipt(previousMeta).catch(() => {})
    }

    userStore.addUser(
      buildUpdatedUserPayload(currentUser, {
        photoUrl: uploaded.url,
        photoMeta: uploaded
      })
    )
    previewPhotoUrl.value = uploaded.url
  } catch (error) {
    showError(error.message || 'Failed to update profile photo.')
  } finally {
    photoSubmitting.value = false
    if (photoInputRef.value) photoInputRef.value.value = ''
  }
}

async function handlePhotoSelected(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  if (!validateProfilePhoto(file)) {
    if (photoInputRef.value) photoInputRef.value.value = ''
    return
  }

  closePhotoEditor()
  selectedPhotoName.value = file.name || 'profile-photo.jpg'
  photoEditorSourceUrl.value = URL.createObjectURL(file)
  photoEditorVisible.value = true

  if (photoInputRef.value) photoInputRef.value.value = ''
}

async function handleEditedPhotoConfirm(blob) {
  const editedPhoto = new File([blob], selectedPhotoName.value, {
    type: 'image/jpeg'
  })

  await persistProfilePhoto(editedPhoto)
  closePhotoEditor()
}

async function removeProfilePhoto() {
  if (!props.user?.uid || isBlocked.value) return

  photoSubmitting.value = true
  try {
    const currentUser = await read(`${DB_NODES.USERS}/${props.user.uid}`)
    if (!currentUser) {
      showError('User not found')
      return
    }

    const previousMeta = currentUser.photoMeta || props.user?.photoMeta || null
    await updateData(
      `${DB_NODES.USERS}/${props.user.uid}`,
      () => ({
        photoUrl: null,
        photoMeta: null
      }),
      'Profile photo removed successfully'
    )

    if (previousMeta?.url) {
      deleteReceipt(previousMeta).catch(() => {})
    }

    userStore.addUser(
      buildUpdatedUserPayload(currentUser, {
        photoUrl: '',
        photoMeta: null
      })
    )
    previewPhotoUrl.value = ''
  } finally {
    photoSubmitting.value = false
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
    ...buildUpdatedUserPayload(currentUser, {
      name: newName,
      mobile: newMobile
    })
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

async function submitEmailUpdate() {
  if (
    !props.user?.uid ||
    isBlocked.value ||
    emailSubmitting.value ||
    !canEditVerifiedEmail.value
  ) {
    return
  }

  if (!emailFormRef.value) return

  const currentAuthUser = auth.currentUser
  const currentEmail = normalizeEmail(currentAuthUser?.email)
  emailSubmitting.value = true
  try {
    if (!currentAuthUser || !currentEmail) {
      throw new Error('No authenticated user found. Please log in again.')
    }

    try {
      await emailFormRef.value.validate()
    } catch {
      return
    }

    const newEmail = normalizeEmail(emailForm.email)
    if (newEmail === currentEmail) {
      throw new Error('New email must be different from your current email.')
    }

    const existingUser = await findUserByEmail(newEmail)
    if (existingUser && existingUser.uid !== props.user.uid) {
      throw new Error('An account with this email already exists.')
    }

    const credential = EmailAuthProvider.credential(
      currentAuthUser.email,
      emailForm.currentPassword
    )
    await reauthenticateWithCredential(currentAuthUser, credential)
    await verifyBeforeUpdateEmail(currentAuthUser, newEmail, {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false
    })

    showSuccess(
      `Verification email sent to ${newEmail}. Open that link to complete the change, then sign in again with the new email.`
    )
    handleEmailVisibilityChange(false)
  } catch (error) {
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      showError('Current password is incorrect.')
    } else if (error.code === 'auth/email-already-in-use') {
      showError('An account with this email already exists.')
    } else if (error.code === 'auth/invalid-email') {
      showError('Please enter a valid email address.')
    } else if (error.code === 'auth/requires-recent-login') {
      showError(
        'Session expired. Please log out and log back in before changing your email.'
      )
    } else if (error.code === 'auth/too-many-requests') {
      showError('Too many attempts. Please try again later.')
    } else {
      showError(error.message || 'Failed to send email verification.')
    }
  } finally {
    emailSubmitting.value = false
  }
}

watch(
  () => props.user,
  (user) => {
    syncFormFromUser(user)
    syncPreviewPhoto(user)
    resetEmailForm()
  },
  { immediate: true }
)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm()
      resetEmailForm()
    } else {
      emailDialogVisible.value = false
      closePhotoEditor()
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
