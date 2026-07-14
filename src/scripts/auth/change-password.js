import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  auth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from '@/firebase'
import { useAuthStore } from '@/stores'
import { showError, showSuccess } from '@/utils'

export const ChangePassword = () => {
  const { t } = useI18n()
  const authStore = useAuthStore()

  const dialogVisible = ref(true)
  const isSubmitting = ref(false)

  const form = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const formRef = ref(null)

  const rules = {
    currentPassword: [
      {
        required: true,
        message: t('authMessages.changePasswordCurrentRequired'),
        trigger: 'blur'
      }
    ],
    newPassword: [
      {
        required: true,
        message: t('authMessages.changePasswordNewRequired'),
        trigger: 'blur'
      },
      {
        min: 6,
        max: 15,
        message: t('authMessages.passwordLength'),
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        required: true,
        message: t('authMessages.changePasswordConfirmRequired'),
        trigger: 'blur'
      },
      {
        validator: (_, value, callback) => {
          if (value !== form.value.newPassword) {
            callback(new Error(t('authMessages.changePasswordMismatch')))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  function openDialog() {
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    dialogVisible.value = true
  }

  function closeDialog() {
    dialogVisible.value = false
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    formRef.value?.resetFields()
  }

  async function handleChangePassword() {
    if (!formRef.value || isSubmitting.value) return

    try {
      await formRef.value.validate()
    } catch {
      return
    }

    const user = auth.currentUser
    if (!user || !user.email) {
      return showError(t('authMessages.noAuthenticatedUser'))
    }

    if (form.value.newPassword === form.value.currentPassword) {
      return showError(t('authMessages.changePasswordSameAsCurrent'))
    }

    isSubmitting.value = true
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        form.value.currentPassword
      )
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, form.value.newPassword)

      // Keep the stored password in sync so session remains valid
      authStore.setActivePassword(form.value.newPassword)

      showSuccess(t('authMessages.changePasswordSuccess'))
      closeDialog()
    } catch (error) {
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showError(t('authMessages.changePasswordIncorrect'))
      } else if (error.code === 'auth/too-many-requests') {
        showError(t('authMessages.tooManyRequests'))
      } else if (error.code === 'auth/requires-recent-login') {
        showError(t('authMessages.changePasswordSessionExpired'))
      } else {
        showError(error.message || t('authMessages.changePasswordFailed'))
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    dialogVisible,
    isSubmitting,
    form,
    formRef,
    rules,
    openDialog,
    closeDialog,
    handleChangePassword
  }
}
