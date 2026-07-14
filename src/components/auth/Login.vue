<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="min-h-screen flex items-center justify-center px-4 pt-[70px]">
    <div
      class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl w-full"
    >
      <el-form
        :model="form"
        :rules="loginRules"
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
              @google-sign-in="handleGoogleSignIn"
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
        :title="t('auth.tabConfig.title')"
        :confirm-text="t('auth.tabConfig.confirm')"
        :cancel-text="t('auth.tabConfig.cancelSignOut')"
        @update:visible="
          (value) => {
            if (!value) cancelFeatureSelection()
          }
        "
        @update:selection="featureSelection = $event"
        @confirm="saveFeatureSelection"
        @cancel="cancelFeatureSelection"
      />

      <el-dialog
        v-model="googleMobileDialogVisible"
        :title="t('auth.googleMobileDialog.title')"
        width="320px"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        :show-close="false"
      >
        <p class="text-sm text-gray-600 mb-4">
          {{ t('auth.googleMobileDialog.instructions') }}<br />
          <span>{{ t('auth.googleMobileDialog.prioritize') }}</span>
        </p>
        <el-input
          v-model="googleMobileInput"
          :placeholder="t('auth.googleMobileDialog.placeholder')"
          maxlength="11"
          @input="googleMobileInput = googleMobileInput.replace(/\D/g, '')"
          @keyup.enter="submitGoogleMobile"
        />
        <template #footer>
          <GenericButton
            type="default"
            size="medium"
            :disabled="isGoogleMobileSubmitting"
            @click="cancelGoogleMobileDialog"
          >
            {{ t('auth.googleMobileDialog.cancel') }}
          </GenericButton>
          <GenericButton
            type="success"
            size="medium"
            :loading="isGoogleMobileSubmitting"
            :disabled="isGoogleMobileSubmitting"
            @click="submitGoogleMobile"
          >
            {{ t('auth.googleMobileDialog.continue') }}
          </GenericButton>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getLoginRules } from '@/assets'
import { Login } from '@/scripts/auth'
import { loadAsyncComponent } from '@/utils/async-component'
import { GenericButton } from '@/components/generic-components'
import {
  AuthActions,
  AuthFormFields,
  AuthInfoAlert,
  AuthModeToggle
} from '@/components/auth/components'

const { t, locale } = useI18n()
const loginRules = computed(() => getLoginRules(locale.value))
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
  googleMobileDialogVisible,
  googleMobileInput,
  isGoogleMobileSubmitting,
  handleSubmit,
  handleForgotCode,
  sendResetEmail,
  handleResendVerification,
  saveFeatureSelection,
  cancelFeatureSelection,
  handleGoogleSignIn,
  submitGoogleMobile,
  cancelGoogleMobileDialog
} = Login()

function updateRememberMe(value) {
  form.value = {
    ...form.value,
    rememberMe: value
  }
}
</script>

<style scoped></style>
