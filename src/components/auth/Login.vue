<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="loginForm"
      label-position="top"
      class="w-full"
    >
      <!-- <fieldset class="w-full p-4 border rounded-lg"> -->
      <!-- <legend>Login / Register</legend> -->

      <!-- Mode Toggle -->
      <div class="mb-4">
        <el-segmented
          v-model="mode"
          :options="[
            { label: 'Login', value: 'login' },
            { label: 'Register', value: 'register' }
          ]"
          size="small"
          class="w-full auth-segment"
        />
      </div>

      <transition name="auth-switch" mode="out-in">
        <div :key="mode" class="space-y-4">
          <!-- Info Label -->
          <el-alert
            :title="''"
            :type="mode === 'register' ? 'success' : 'info'"
            :closable="false"
            class="mb-4"
          >
            <template #default>
              <span class="text-sm">
                <template v-if="mode === 'register'">
                  Create a new account with your name, mobile, email, and login
                  code.
                  <strong
                    >You must verify your email within 48 hours to activate your
                    account.</strong
                  >
                </template>
                <template v-else>
                  Login with your email and password.
                </template>
              </span>
            </template>
          </el-alert>

          <!-- Full Name (only in register mode) -->
          <el-form-item
            v-if="mode === 'register'"
            label="Full Name"
            prop="name"
          >
            <el-input
              v-model="form.name"
              placeholder="Enter your full name"
              class="w-full"
              size="small"
              :maxlength="50"
            />
          </el-form-item>

          <!-- Mobile Number (only in register mode) -->
          <el-form-item
            v-if="mode === 'register'"
            label="Mobile Number"
            prop="mobile"
          >
            <el-input
              v-model="form.mobile"
              placeholder="Enter your mobile number"
              class="w-full"
              size="small"
              :maxlength="11"
              @input="form.mobile = form.mobile.replace(/\D/g, '')"
            />
          </el-form-item>

          <!-- Email -->
          <el-form-item label="Email" prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="Enter your email address"
              class="w-full"
              size="small"
            />
          </el-form-item>

          <!-- Password -->
          <el-form-item label="Password" prop="loginCode">
            <el-input
              v-model="form.loginCode"
              type="password"
              placeholder="Enter your password (6-15 characters)"
              class="w-full"
              size="small"
              show-password
              :maxlength="15"
            />
          </el-form-item>

          <!-- Forgot Password Link (only in login mode) -->
          <div
            v-if="mode === 'login'"
            class="flex flex-col items-end gap-1 -mt-1 mb-2"
          >
            <button
              v-if="showResendVerification"
              type="button"
              class="forgot-link"
              @click="handleResendVerification"
            >
              Resend Verification Email
            </button>
            <button type="button" class="forgot-link" @click="handleForgotCode">
              Forgot Password?
            </button>
          </div>

          <div class="flex flex-col">
            <!-- Remember Me -->
            <el-checkbox
              v-model="form.rememberMe"
              label="Remember Me"
              class="text-sm text-gray-700 mb-4"
            ></el-checkbox>
            <!-- Submit Button -->
            <GenericButton @click="handleSubmit" type="success">
              {{ mode === 'register' ? 'Register' : 'Login' }}
            </GenericButton>

            <!-- Switch to Register -->
            <p
              v-if="mode === 'login'"
              class="text-center text-xs text-gray-500 mt-3"
            >
              New to Kharchafy?
              <button
                type="button"
                class="forgot-link font-medium"
                @click="mode = 'register'"
              >
                Register
              </button>
            </p>

            <!-- Switch to Login -->
            <p
              v-if="mode === 'register'"
              class="text-center text-xs text-gray-500 mt-3"
            >
              Already have an account?
              <button
                type="button"
                class="forgot-link font-medium"
                @click="mode = 'login'"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </transition>
      <!-- </fieldset> -->
    </el-form>

    <!-- ── Email Reset Dialog ──────────────────────────────────── -->
    <el-dialog
      v-model="emailResetDialogVisible"
      title="Reset Password via Email"
      width="92%"
      style="max-width: 480px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <el-alert type="info" :closable="false">
          <template #default>
            <div class="text-sm leading-relaxed">
              We'll send a password reset link to your email. Click the link to
              set a new password.
            </div>
          </template>
        </el-alert>

        <el-form-item label="Registered Email Address" labelPosition="top">
          <el-input
            v-model="resetEmail"
            type="email"
            placeholder="Enter your registered email"
            class="w-full"
            size="small"
          />
        </el-form-item>

        <div class="flex gap-3">
          <el-button
            type="primary"
            class="flex-1"
            @click="sendResetEmail"
            :loading="isEmailResetLoading"
            :disabled="isEmailResetLoading"
            size="small"
          >
            Send Reset Link
          </el-button>

          <el-button
            type="default"
            @click="emailResetDialogVisible = false"
            :disabled="isEmailResetLoading"
            size="small"
          >
            Cancel
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { loginRules as rules } from '../../assets/validation-rules'
import { GenericButton } from '../generic-components'
import { Login } from '../../scripts/auth/login'

const {
  form,
  loginForm,
  mode,
  emailResetDialogVisible,
  resetEmail,
  isEmailResetLoading,
  showResendVerification,
  handleSubmit,
  handleForgotCode,
  sendResetEmail,
  handleResendVerification
} = Login()
</script>

<style scoped>
.forgot-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.75rem;
  color: #16a34a;
  cursor: pointer;
  text-decoration: none;
  text-underline-offset: 2px;
  transition:
    color 0.15s ease,
    text-decoration 0.15s ease;
}

.forgot-link:hover {
  color: #15803d;
  text-decoration: underline;
}
</style>
