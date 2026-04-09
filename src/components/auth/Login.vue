<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="min-h-screen flex items-center justify-center px-4 pt-[70px]">
    <div
      class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl w-full"
    >
      <el-form
        :model="form"
        :rules="rules"
        ref="loginForm"
        label-position="top"
        class="w-full"
      >
        <AuthModeToggle :mode="mode" @update:mode="mode = $event" />

        <transition name="auth-switch" mode="out-in">
          <div :key="mode" class="space-y-4">
            <AuthInfoAlert :mode="mode" />

            <AuthFormFields
              :mode="mode"
              :model-value="form"
              @update:modelValue="form = $event"
            />

            <AuthActions
              :mode="mode"
              :remember-me="form.rememberMe"
              :is-submitting="isSubmitting"
              :show-resend-verification="showResendVerification"
              @update:rememberMe="updateRememberMe"
              @update:mode="mode = $event"
              @submit="handleSubmit"
              @forgot-code="handleForgotCode"
              @resend-verification="handleResendVerification"
            />
          </div>
        </transition>
      </el-form>

      <PasswordResetDialog
        v-if="emailResetDialogVisible"
        :visible="emailResetDialogVisible"
        :email="resetEmail"
        :is-loading="isEmailResetLoading"
        @update:visible="emailResetDialogVisible = $event"
        @update:email="resetEmail = $event"
        @send="sendResetEmail"
      />

      <UserTabConfigDialog
        :visible="featureSelectionDialogVisible"
        :selection="featureSelection"
        :loading="isSavingFeatureSelection"
        title="Choose Your Tabs"
        confirm-text="Continue"
        cancel-text="Sign out"
        @update:visible="
          (value) => {
            if (!value) cancelFeatureSelection()
          }
        "
        @update:selection="featureSelection = $event"
        @confirm="saveFeatureSelection"
        @cancel="cancelFeatureSelection"
      />
    </div>
  </div>
</template>

<script setup>
import { loginRules as rules } from '@/assets'
import { Login } from '@/scripts/auth'
import { loadAsyncComponent } from '@/utils/async-component'
import {
  AuthActions,
  AuthFormFields,
  AuthInfoAlert,
  AuthModeToggle
} from '@/components/auth/components'
const PasswordResetDialog = loadAsyncComponent(
  () => import('./components/PasswordResetDialog.vue')
)
const UserTabConfigDialog = loadAsyncComponent(
  () => import('../generic-components/UserTabConfigDialog.vue')
)

const {
  form,
  loginForm,
  mode,
  isSubmitting,
  emailResetDialogVisible,
  resetEmail,
  isEmailResetLoading,
  showResendVerification,
  featureSelection,
  featureSelectionDialogVisible,
  isSavingFeatureSelection,
  handleSubmit,
  handleForgotCode,
  sendResetEmail,
  handleResendVerification,
  saveFeatureSelection,
  cancelFeatureSelection
} = Login()

function updateRememberMe(value) {
  form.value = {
    ...form.value,
    rememberMe: value
  }
}
</script>

<style scoped></style>
