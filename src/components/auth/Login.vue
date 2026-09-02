<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="auth-page min-h-screen flex items-center justify-center px-4 pt-[108px] pb-8"
  >
    <div
      class="auth-shell flex w-full max-w-md md:max-w-4xl mx-auto border rounded-2xl shadow-xl overflow-hidden"
    >
      <div class="auth-illustration hidden md:flex">
        <div class="auth-card__brand">
          <span class="auth-card__badge">
            <el-icon :size="20"><Wallet /></el-icon>
          </span>
          <p class="auth-card__title">{{ t('footer.brand') }}</p>
        </div>
        <div class="auth-illustration__frame">
          <img
            src="/expenses.webp"
            alt=""
            class="auth-illustration__image"
            width="1000"
            height="560"
          />
        </div>
        <div class="auth-illustration__copy">
          <p class="auth-illustration__title">
            {{ t('landing.heroTitle') }}
          </p>
          <p class="auth-illustration__text">{{ t('landing.heroText') }}</p>
        </div>
      </div>

      <div class="auth-card flex flex-col w-full">
        <div class="auth-mobile-hero md:hidden">
          <img
            src="/expenses.webp"
            alt=""
            class="auth-mobile-hero__image"
            width="1000"
            height="560"
          />
          <div class="auth-mobile-hero__overlay">
            <span class="auth-card__badge auth-mobile-hero__badge">
              <el-icon :size="16"><Wallet /></el-icon>
            </span>
            <p class="auth-mobile-hero__title">{{ t('footer.brand') }}</p>
            <p class="auth-mobile-hero__tagline">{{ t('footer.tagline') }}</p>
          </div>
        </div>

        <div class="flex flex-col items-center p-6 w-full">
          <el-form
            :model="form"
            :rules="loginRules"
            ref="loginForm"
            label-position="top"
            class="w-full"
          >
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
                  :terms-accepted="form.termsAccepted"
                  :is-submitting="isSubmitting"
                  :show-resend-verification="showResendVerification"
                  @update:rememberMe="updateRememberMe"
                  @update:termsAccepted="updateTermsAccepted"
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
            :confirm-text="t('auth.googleMobileDialog.continue')"
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
            append-to-body
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            :show-close="false"
          >
            <p class="text-sm text-gray-600 mb-4">
              {{ t('auth.googleMobileDialog.instructions') }}
            </p>
            <GenericMobileInput
              v-model="googleMobileInput"
              :placeholder="t('auth.googleMobileDialog.placeholder')"
              :wrap-form-item="false"
              @enter="submitGoogleMobile"
              @country-changed="
                googleMobileCountry = $event?.iso2 || $event?.countryCode || ''
              "
            />
            <GenericInputField
              v-model="googleMobileWalletProvider"
              :placeholder="t('common.mobileWalletProviderPlaceholder')"
              :wrap-form-item="false"
              :maxlength="30"
              class="mt-2"
            />
            <p class="mt-1 text-xs text-gray-500">
              {{ t('common.mobileWalletProviderNote') }}
            </p>
            <TermsConsentCheckbox
              v-model="googleMobileTermsAccepted"
              class="mt-4"
            />
            <template #footer>
              <GenericButton
                type="default"
                size="default"
                :disabled="isGoogleMobileSubmitting"
                @click="cancelGoogleMobileDialog"
              >
                {{ t('common.cancel') }}
              </GenericButton>
              <GenericButton
                type="success"
                size="default"
                :loading="isGoogleMobileSubmitting"
                :disabled="
                  isGoogleMobileSubmitting || !googleMobileTermsAccepted
                "
                @click="submitGoogleMobile"
              >
                {{ t('auth.googleMobileDialog.continue') }}
              </GenericButton>
            </template>
          </el-dialog>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet } from '@element-plus/icons-vue'
import { getLoginRules } from '@/assets'
import { Login } from '@/scripts/auth'
import { loadAsyncComponent } from '@/utils/async-component'
import {
  GenericButton,
  GenericInputField,
  GenericMobileInput
} from '@/components/generic-components'
import {
  AuthActions,
  AuthFormFields,
  AuthInfoAlert,
  TermsConsentCheckbox
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
  googleMobileWalletProvider,
  googleMobileCountry,
  googleMobileTermsAccepted,
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

function updateTermsAccepted(value) {
  form.value = {
    ...form.value,
    termsAccepted: value
  }
}
</script>

<style scoped>
/* Decorative page-level glow — same blurred-blob pattern as the public
   marketing pages (.public-page::before/::after in LandingPage.vue etc.),
   so the auth screen doesn't sit alone as a flat, undecorated page. Shows
   on every screen size, not just desktop. */
.auth-page {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.auth-page::before,
.auth-page::after {
  content: '';
  position: absolute;
  z-index: -1;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.auth-page::before {
  top: -80px;
  right: -60px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.25), transparent 70%);
}

.auth-page::after {
  bottom: -80px;
  left: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.18),
    transparent 70%
  );
}

.auth-shell {
  position: relative;
  border-color: var(--border-color);
  box-shadow: 0 20px 45px -20px rgba(22, 163, 74, 0.28);
}

.auth-illustration {
  position: relative;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  width: 45%;
  flex-shrink: 0;
  padding: 40px 32px;
  background: linear-gradient(
    160deg,
    var(--success-50) 0%,
    var(--card-bg) 100%
  );
  border-inline-end: 1px solid var(--border-color);
}

:root.dark-theme .auth-illustration {
  background: linear-gradient(160deg, #0f3d24 0%, var(--card-bg) 100%);
}

.auth-illustration__frame {
  position: relative;
}

.auth-illustration__frame::before {
  content: '';
  position: absolute;
  inset: -16px;
  z-index: -1;
  border-radius: 24px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.3), transparent 72%);
  filter: blur(8px);
}

.auth-illustration__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 16px 34px -14px rgba(22, 163, 74, 0.45);
  transition: transform 0.25s ease;
}

.auth-illustration:hover .auth-illustration__image {
  transform: translateY(-2px) rotate(-0.6deg);
}

/* Mobile-only hero banner — replaces the plain brand line that used to be
   the entire mobile view of this page (the illustration panel above is
   `hidden md:flex`, so without this, mobile got no imagery at all). */
.auth-mobile-hero {
  position: relative;
  height: 168px;
  overflow: hidden;
}

.auth-mobile-hero__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-mobile-hero__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  padding: 16px;
  background: linear-gradient(
    180deg,
    rgba(6, 38, 20, 0) 0%,
    rgba(6, 38, 20, 0.78) 100%
  );
}

.auth-mobile-hero__badge {
  width: 34px;
  height: 34px;
  margin-bottom: 4px;
}

.auth-mobile-hero__title {
  margin: 0;
  color: #ffffff;
  font-weight: 800;
  font-size: 1.05rem;
}

.auth-mobile-hero__tagline {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.75rem;
  line-height: 1.4;
}

.auth-illustration__title {
  margin: 0 0 8px;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-primary);
}

.auth-illustration__text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-secondary, #6b7280);
}

.auth-card {
  background: var(--card-bg);
  box-shadow: none;
}

.auth-card__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.auth-card__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  color: #15803d;
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
}

:root.dark-theme .auth-card__badge {
  color: #6ee7b7;
  background: linear-gradient(135deg, #14532d 0%, #0f3d24 100%);
}

.auth-card__title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}
</style>
