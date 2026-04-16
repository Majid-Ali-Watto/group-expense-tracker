import { ref } from 'vue'
import {
  auth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from '@/firebase'
import { useAuthStore } from '@/stores'
import { showError, showSuccess } from '@/utils'

export const ChangePassword = () => {
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
        message: 'Current password is required',
        trigger: 'blur'
      }
    ],
    newPassword: [
      { required: true, message: 'New password is required', trigger: 'blur' },
      {
        min: 6,
        max: 15,
        message: 'Password must be between 6 and 15 characters',
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        required: true,
        message: 'Please confirm your new password',
        trigger: 'blur'
      },
      {
        validator: (_, value, callback) => {
          if (value !== form.value.newPassword) {
            callback(new Error('Passwords do not match'))
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
      return showError('No authenticated user found. Please log in again.')
    }

    if (form.value.newPassword === form.value.currentPassword) {
      return showError(
        'New password must be different from your current password.'
      )
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

      showSuccess('Password changed successfully!')
      closeDialog()
    } catch (error) {
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showError('Current password is incorrect.')
      } else if (error.code === 'auth/too-many-requests') {
        showError('Too many attempts. Please try again later.')
      } else if (error.code === 'auth/requires-recent-login') {
        showError(
          'Session expired. Please log out and log back in before changing your password.'
        )
      } else {
        showError(
          error.message || 'Failed to change password. Please try again.'
        )
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
