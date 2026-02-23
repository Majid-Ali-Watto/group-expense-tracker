<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="flex flex-col items-center p-6 max-w-sm mx-auto border rounded-lg shadow-xl bg-white"
  >
    <el-form
      :model="form"
      :rules="rules"
      ref="loginForm"
      label-position="top"
      class="w-full"
    >
      <fieldset class="w-full p-4 border rounded-lg">
        <legend>Login / Register</legend>

        <!-- Mode Toggle -->
        <div class="flex justify-center mb-4">
          <el-segmented
            v-model="mode"
            :options="[
              { label: 'Login', value: 'login' },
              { label: 'Register', value: 'register' }
            ]"
            size="large"
          />
        </div>

        <!-- Info Label -->
        <el-alert
          :title="mode === 'register' ? 'Registration' : 'Login'"
          :type="mode === 'register' ? 'success' : 'info'"
          :closable="false"
          class="mb-4"
        >
          <template #default>
            <span class="text-sm">
              <template v-if="mode === 'register'">
                Create a new account with your name, mobile, email, and login
                code. <strong>You must verify your email within 48 hours to activate your account.</strong>
              </template>
              <template v-else>
                Login with your email and login code.
              </template>
            </span>
          </template>
        </el-alert>

        <!-- Full Name (only in register mode) -->
        <el-form-item v-if="mode === 'register'" label="Full Name" prop="name">
          <el-input
            v-model="form.name"
            placeholder="Enter your full name"
            class="w-full"
            size="large"
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
            size="large"
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
            size="large"
          />
        </el-form-item>

        <!-- Login Code -->
        <el-form-item label="Login Code" prop="loginCode">
          <el-input
            v-model="form.loginCode"
            type="password"
            placeholder="Enter your login code (6-15 characters)"
            class="w-full"
            size="large"
            show-password
            :maxlength="15"
          />
        </el-form-item>

        <!-- Forgot Login Code Link (only in login mode) -->
        <div v-if="mode === 'login'" class="flex flex-col items-end gap-1 mb-3">
          <el-button
            v-if="showResendVerification"
            type="text"
            @click="handleResendVerification"
            class="text-green-600 hover:text-green-800"
          >
            Resend Verification Email
          </el-button>
          <el-button
            type="text"
            @click="handleForgotCode"
            class="text-blue-600 hover:text-blue-800"
          >
            Forgot Login Code?
          </el-button>
        </div>

        <div class="flex justify-between">
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
        </div>
      </fieldset>
    </el-form>

    <!-- ── Email Reset Dialog ──────────────────────────────────── -->
    <el-dialog
      v-model="emailResetDialogVisible"
      title="Reset Login Code via Email"
      width="92%"
      style="max-width: 480px"
      :close-on-click-modal="false"
    >
      <div class="space-y-4">
        <el-alert type="info" :closable="false">
          <template #default>
            <div class="text-sm leading-relaxed">
              We'll send a password reset link to your email. Click the link to
              set a new login code.
            </div>
          </template>
        </el-alert>

        <el-form-item label="Email Address">
          <el-input
            v-model="resetEmail"
            type="email"
            placeholder="Enter your registered email"
            class="w-full"
            size="large"
          />
        </el-form-item>

        <div class="flex gap-3">
          <el-button
            type="primary"
            class="flex-1"
            @click="sendResetEmail"
            :loading="isEmailResetLoading"
            :disabled="isEmailResetLoading"
            size="large"
          >
            Send Reset Link
          </el-button>

          <el-button
            type="default"
            @click="emailResetDialogVisible = false"
            :disabled="isEmailResetLoading"
            size="large"
          >
            Cancel
          </el-button>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { loginRules as rules } from '../assets/validation-rules'
import { GenericButton } from '../components/generic-components'
import { Login } from '../scripts/login'

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
