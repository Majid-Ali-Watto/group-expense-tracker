<template>
  <el-dialog
    :model-value="visible"
    :title="t('profile.title')"
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
          :alt="t('users.profilePhotoAlt')"
          :preview-title="t('users.profilePhotoTitle', { name: profileName })"
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
            {{ t('headerActions.account') }}
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
              size="default"
              type="success"
              plain
              :loading="photoSubmitting"
              :disabled="isBlocked || photoSubmitting"
              @click="photoInputRef?.click()"
            >
              {{
                profilePhotoUrl
                  ? t('profile.updatePhoto')
                  : t('profile.addPhoto')
              }}
            </el-button>
            <el-button
              v-if="profilePhotoUrl"
              size="default"
              text
              :loading="photoSubmitting"
              :disabled="isBlocked || photoSubmitting"
              @click="removeProfilePhoto"
            >
              {{ t('common.remove') }}
            </el-button>
          </div>
        </div>
      </div>

      <el-alert
        v-if="isBlocked"
        :title="t('profile.blockedBannerText')"
        type="warning"
        :closable="false"
      />

      <el-descriptions :column="1" border>
        <el-descriptions-item :label="t('profile.emailAddressLabel')">
          <div class="profile-field-value">
            <div class="min-w-0 flex-1">
              <span class="break-all">{{ profileEmail }}</span>
              <p
                v-if="!canEditVerifiedEmail"
                class="mt-1 text-xs text-gray-500"
              >
                {{ t('profile.managedByProvider') }}
              </p>
            </div>
            <el-button
              v-if="canEditVerifiedEmail"
              text
              circle
              size="default"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEmailDialog"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.fullNameLabel')">
          <div class="profile-field-value">
            <span>{{ profileName }}</span>
            <el-button
              text
              circle
              size="default"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEditDialog('name')"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.mobileNumberLabel')">
          <div class="profile-field-value">
            <span>{{ profileMobile }}</span>
            <el-button
              text
              circle
              size="default"
              :icon="Edit"
              :disabled="isBlocked"
              @click="openEditDialog('mobile')"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.emailVerificationLabel')">
          <el-tag :type="emailVerified ? 'success' : 'info'" effect="light">
            {{
              emailVerified ? t('profile.verifiedTag') : t('profile.pendingTag')
            }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item
          :label="t('profile.emailsSentLabel', { month: usageMonthKey })"
        >
          {{ emailsSentCount }} / {{ emailsSentLimitLabel }}
        </el-descriptions-item>
        <el-descriptions-item
          :label="t('profile.ocrExtractionsLabel', { month: usageMonthKey })"
        >
          {{ ocrExtractionsCount }} / {{ ocrExtractionsLimitLabel }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.accountTierLabel')">
          <el-tag :type="accountTierTagType" effect="light">
            {{ accountTierLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.rolesLabel')">
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-if="isAdminUser"
              size="small"
              type="danger"
              effect="light"
            >
              {{ t('profile.adminTag') }}
            </el-tag>
            <el-tag
              v-if="isBugResolver"
              size="small"
              type="warning"
              effect="light"
            >
              {{ t('profile.bugResolverTag') }}
            </el-tag>
            <span
              v-if="!isAdminUser && !isBugResolver"
              class="text-sm text-gray-500"
            >
              {{ t('profile.standardUserTag') }}
            </span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item :label="t('profile.accountStatusLabel')">
          <el-tag :type="isBlocked ? 'danger' : 'success'" effect="light">
            {{ isBlocked ? t('profile.blockedTag') : t('profile.activeTag') }}
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
            size="default"
            type="warning"
            :disabled="isBlocked"
            @click="showChangePasswordDialog = true"
          >
            {{ t('auth.changePassword.title') }}
          </el-button>
          <el-button
            size="default"
            type="danger"
            plain
            :disabled="isBlocked || hasPendingDeleteRequest"
            @click="requestDeleteAccount"
          >
            {{
              hasPendingDeleteRequest
                ? t('users.deletePending', {
                    approved: deleteRequestApprovalsCount,
                    required: deleteRequestRequiredCount
                  })
                : t('profile.deleteAccount')
            }}
          </el-button>
        </div>
        <el-button
          size="default"
          type="primary"
          @click="handleVisibilityChange(false)"
        >
          {{ t('common.close') }}
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
    :title="t('profile.updateVerifiedEmailTitle')"
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
      <el-form-item :label="t('profile.newVerifiedEmailLabel')" prop="email">
        <GenericInputField
          ref="emailInputRef"
          :model-value="emailForm.email"
          :wrap-form-item="false"
          :placeholder="t('profile.newEmailPlaceholder')"
          type="email"
          @update:modelValue="emailForm.email = $event"
        />
      </el-form-item>

      <el-form-item
        :label="t('profile.confirmNewEmailLabel')"
        prop="confirmEmail"
      >
        <GenericInputField
          ref="confirmEmailInputRef"
          :model-value="emailForm.confirmEmail"
          :wrap-form-item="false"
          :placeholder="t('profile.newEmailPlaceholder')"
          type="email"
          @update:modelValue="emailForm.confirmEmail = $event"
        />
      </el-form-item>

      <el-form-item
        :label="t('auth.changePassword.currentPasswordLabel')"
        prop="currentPassword"
      >
        <GenericInputField
          ref="currentPasswordInputRef"
          :model-value="emailForm.currentPassword"
          :wrap-form-item="false"
          :placeholder="t('profile.currentPasswordPlaceholder')"
          type="password"
          show-password
          @update:modelValue="emailForm.currentPassword = $event"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button size="default" @click="resetEmailForm">{{
          t('common.reset')
        }}</el-button>
        <el-button size="default" @click="handleEmailVisibilityChange(false)">
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          size="default"
          type="success"
          :loading="emailSubmitting"
          :disabled="emailSubmitting || isBlocked || !canEditVerifiedEmail"
          @click="submitEmailUpdate"
        >
          {{ t('profile.sendVerification') }}
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
      <el-form-item
        v-if="editField === 'name'"
        :label="t('profile.fullNameLabel')"
        prop="name"
      >
        <GenericInputField
          ref="nameInputRef"
          :model-value="form.name"
          :wrap-form-item="false"
          :placeholder="t('users.fullNamePlaceholder')"
          :maxlength="50"
          @update:modelValue="form.name = $event.toCapitalize()"
        />
      </el-form-item>

      <el-form-item
        v-else
        :label="t('profile.mobileNumberLabel')"
        prop="mobile"
      >
        <GenericInputField
          ref="mobileInputRef"
          :model-value="form.mobile"
          :wrap-form-item="false"
          :placeholder="t('users.mobilePlaceholder')"
          :maxlength="11"
          type="tel"
          @update:modelValue="form.mobile = $event"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <el-button size="default" @click="resetForm">{{
          t('common.reset')
        }}</el-button>
        <el-button size="default" @click="handleEditVisibilityChange(false)">
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          size="default"
          type="success"
          :loading="isSubmitting"
          :disabled="isSubmitting || isBlocked"
          @click="submitProfileUpdate"
        >
          {{ t('profile.saveChanges') }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <ImageCropEditorDialog
    :visible="photoEditorVisible"
    :source-url="photoEditorSourceUrl"
    :submitting="photoSubmitting"
    :title="t('profile.adjustPhotoTitle')"
    :confirm-label="t('profile.uploadPhoto')"
    :image-alt="t('profile.photoEditorAlt')"
    preview-shape="circle"
    @update:visible="(visible) => (visible ? null : closePhotoEditor())"
    @confirm="handleEditedPhotoConfirm"
  />
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
import {
  GenericInputField,
  ImageCropEditorDialog,
  UserAvatar
} from '@/components/generic-components'
import ChangePasswordDialog from '@/components/auth/ChangePasswordDialog.vue'
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

const { t } = useI18n()
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

const profileName = computed(
  () => props.user?.name || t('profile.accountUserFallback')
)
const profileEmail = computed(
  () => props.user?.email || t('profile.notAvailable')
)
const profileMobile = computed(
  () => props.user?.mobile || t('profile.notAvailable')
)
const profilePhotoUrl = computed(() => props.user?.photoUrl || '')
const emailVerified = computed(() => props.user?.emailVerified !== false)
const canEditVerifiedEmail = computed(
  () =>
    auth.currentUser?.providerData?.some(
      (provider) => provider.providerId === 'password'
    ) === true
)
const isBlocked = computed(() => props.user?.blocked === true)
// isAdmin/billedUser/bugResolver live in user-admin-flags/{uid}, not on the
// users/{uid} doc — this dialog is always for the active/logged-in user
// (see Header.vue's :user="activeUserProfile"), so the active-user store
// slice is the correct source here.
const isAdminUser = computed(
  () => userStore.getActiveUserAdminFlags?.isAdmin === true
)
const isBugResolver = computed(
  () => userStore.getActiveUserAdminFlags?.bugResolver === true
)
const isBilledUser = computed(
  () => userStore.getActiveUserAdminFlags?.billedUser === true
)
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
  emailsSentLimit.value == null ? t('profile.unlimited') : emailsSentLimit.value
)
const ocrExtractionsLimitLabel = computed(() =>
  ocrExtractionsLimit.value == null
    ? t('profile.unlimited')
    : ocrExtractionsLimit.value
)

const accountTierLabel = computed(() =>
  isBilledUser.value ? t('profile.paidTierTag') : t('profile.freeTierTag')
)
const accountTierTagType = computed(() =>
  isBilledUser.value ? 'success' : 'info'
)
const editDialogTitle = computed(() =>
  editField.value === 'mobile'
    ? t('profile.editMobileTitle')
    : t('profile.editNameTitle')
)

const rules = {
  name: [
    {
      validator: (_, value, callback) => {
        const normalized = normalizeName(value)
        if (!normalized) return callback(new Error(t('users.nameRequired')))
        if (normalized.length < 3) {
          return callback(new Error(t('users.nameMinLength')))
        }
        if (!isValidName(normalized)) {
          return callback(new Error(t('users.nameInvalid')))
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
          return callback(new Error(t('users.mobileRequired')))
        }
        if (!isValidMobile(normalized)) {
          return callback(new Error(t('users.mobileInvalid')))
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
        if (!normalized) {
          return callback(new Error(t('profile.newEmailRequired')))
        }
        if (!validateEmail(normalized)) {
          return callback(new Error(t('authMessages.invalidEmail')))
        }
        if (normalized === normalizeEmail(profileEmail.value)) {
          return callback(new Error(t('profile.newEmailMustDiffer')))
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
          return callback(new Error(t('profile.confirmNewEmailRequired')))
        }
        if (normalized !== normalizeEmail(emailForm.email)) {
          return callback(new Error(t('profile.emailsDoNotMatch')))
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  currentPassword: [
    {
      required: true,
      message: t('authMessages.changePasswordCurrentRequired'),
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
    showError(t('profile.emailUpdatesPasswordOnly'))
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
    showError(t('profile.photoTypeInvalid'))
    return false
  }
  if (file.size > 1024 * 1024) {
    showError(t('profile.photoSizeTooLarge'))
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
      changeParts.push(t('usersMessages.nameChangedPart', { oldName, newName }))
    }
    if (mobileChanged) {
      changeParts.push(t('usersMessages.mobileUpdatedPart'))
    }

    let updatedGroup = { ...group }
    for (const member of coMembers) {
      updatedGroup = appendNotificationForUser(updatedGroup, member.uid, {
        id: Date.now().toString() + Math.random(),
        type: 'member-renamed',
        message: t('usersMessages.memberRenamedNotif', {
          newName,
          changes: changeParts.join(' and '),
          groupName: group.name
        }),
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
      `${t('users.deleteUserConfirm', { name })}${
        ownerUids.length > 0 ? t('users.deleteUserGroupWarning') : ''
      }`,
      t('profile.deleteAccount'),
      {
        confirmButtonText: t('users.proceed'),
        cancelButtonText: t('common.cancel'),
        type: 'error',
        dangerouslyUseHTMLString: true
      }
    )

    const user = await read(`${DB_NODES.USERS}/${uid}`)
    if (!user) return showError(t('users.userNotFound'))
    if (user.deleteRequest) {
      return showError(t('users.deleteAlreadyPending'))
    }
    if (user.updateRequest) {
      return showError(t('users.updatePendingCannotDelete'))
    }

    if (ownerUids.length === 0) {
      await deleteData(
        `${DB_NODES.USERS}/${uid}`,
        t('users.userDeleted', { name })
      )

      try {
        const currentUser = auth.currentUser
        if (currentUser) {
          await deleteUser(currentUser)
        }
      } catch (authError) {
        console.error('Error deleting user from Firebase Auth:', authError)
        showError(t('profile.accountDeletedAuthFailed'))
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
      t('users.deleteRequestSentToOwners')
    )
    userStore.addUser({ uid, deleteRequest })
  } catch (error) {
    if (error !== 'cancel') {
      showError(error?.message || t('users.failedProcessDeleteRequest'))
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
      showError(t('users.userNotFound'))
      return
    }

    const previousMeta = currentUser.photoMeta || props.user?.photoMeta || null
    if (previousMeta?.url && previousMeta.url !== uploaded.url) {
      deleteReceipt(previousMeta, {
        documentPath: `${DB_NODES.USERS}/${props.user.uid}`
      }).catch(() => {})
    }

    await updateData(
      `${DB_NODES.USERS}/${props.user.uid}`,
      () => ({
        photoUrl: uploaded.url,
        photoMeta: uploaded
      }),
      t('profile.photoUpdated')
    )

    userStore.addUser(
      buildUpdatedUserPayload(currentUser, {
        photoUrl: uploaded.url,
        photoMeta: uploaded
      })
    )
    previewPhotoUrl.value = uploaded.url
  } catch (error) {
    showError(error.message || t('profile.photoUpdateFailed'))
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
      showError(t('users.userNotFound'))
      return
    }

    const previousMeta = currentUser.photoMeta || props.user?.photoMeta || null
    if (previousMeta?.url) {
      deleteReceipt(previousMeta, {
        documentPath: `${DB_NODES.USERS}/${props.user.uid}`
      }).catch(() => {})
    }

    await updateData(
      `${DB_NODES.USERS}/${props.user.uid}`,
      () => ({
        photoUrl: null,
        photoMeta: null
      }),
      t('profile.photoRemoved')
    )

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
    showError(t('users.userNotFound'))
    return
  }

  const existingUsers = (await read(DB_NODES.USERS, false)) || {}
  const mobileTaken = Object.entries(existingUsers).some(
    ([otherUid, otherUser]) =>
      otherUid !== uid && normalizeMobile(otherUser?.mobile || '') === newMobile
  )
  if (mobileTaken) {
    showError(t('users.mobileTaken'))
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
    t('users.userUpdated')
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
      throw new Error(t('authMessages.noAuthenticatedUser'))
    }

    try {
      await emailFormRef.value.validate()
    } catch {
      return
    }

    const newEmail = normalizeEmail(emailForm.email)
    if (newEmail === currentEmail) {
      throw new Error(t('profile.newEmailMustDiffer'))
    }

    const existingUser = await findUserByEmail(newEmail)
    if (existingUser && existingUser.uid !== props.user.uid) {
      throw new Error(t('profile.emailAlreadyExists'))
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

    showSuccess(t('profile.verificationEmailSentBody', { email: newEmail }))
    handleEmailVisibilityChange(false)
  } catch (error) {
    if (
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      showError(t('authMessages.changePasswordIncorrect'))
    } else if (error.code === 'auth/email-already-in-use') {
      showError(t('profile.emailAlreadyExists'))
    } else if (error.code === 'auth/invalid-email') {
      showError(t('authMessages.invalidEmail'))
    } else if (error.code === 'auth/requires-recent-login') {
      showError(t('profile.emailChangeSessionExpired'))
    } else if (error.code === 'auth/too-many-requests') {
      showError(t('authMessages.tooManyRequests'))
    } else {
      showError(error.message || t('profile.sendVerificationFailed'))
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
