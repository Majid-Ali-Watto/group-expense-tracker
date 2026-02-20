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

        <!-- Info Label -->
        <el-alert
          title="Login Code Required"
          type="info"
          :closable="false"
          class="mb-4"
        >
          <template #default>
            <span class="text-sm">
              For new users, you'll be asked to create a login code. For
              existing users, enter your login code to continue.
            </span>
          </template>
        </el-alert>

        <!-- Full Name -->
        <el-form-item label="Full Name" prop="name">
          <el-input
            v-model="form.name"
            placeholder="Enter your full name"
            class="w-full"
            size="large"
          />
        </el-form-item>
        <!-- Mobile Number -->
        <el-form-item label="Mobile Number" prop="mobile">
          <el-input
            v-model="form.mobile"
            placeholder="Enter your mobile number"
            class="w-full"
            size="large"
          />
        </el-form-item>
        <!-- Login Code -->
        <el-form-item label="Login Code" prop="loginCode">
          <el-input
            v-model="form.loginCode"
            type="password"
            placeholder="Enter your login code"
            class="w-full"
            size="large"
            show-password
          />
        </el-form-item>

        <!-- Forgot Login Code Link -->
        <div class="text-right mb-3">
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
            Login / Continue
          </GenericButton>
        </div>
      </fieldset>
    </el-form>

    <!-- ── Recovery Codes Setup Dialog ──────────────────────────────────── -->
    <el-dialog
      v-model="recoveryCodesDialogVisible"
      title="Save Your Recovery Passcodes"
      width="92%"
      style="max-width: 480px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="space-y-3">
        <el-alert
          v-if="!pendingLoginData?.isRegenerationFlow"
          type="warning"
          :closable="false"
        >
          <template #default>
            <div class="text-sm leading-relaxed">
              <strong>Important:</strong> If you forget your login code, one of
              these passcodes lets you reset it. Each code works
              <strong>only once</strong>. Store them somewhere safe before
              continuing.
            </div>
          </template>
        </el-alert>

        <el-alert v-else type="info" :closable="false">
          <template #default>
            <div class="text-sm leading-relaxed">
              <strong>New Recovery Codes Generated!</strong> Your last recovery
              code was used to reset your login code. Here are
              {{ RECOVERY_CODES_COUNT }} brand new passcodes to keep you secure.
              Save them safely before continuing.
            </div>
          </template>
        </el-alert>

        <!-- Code list -->
        <div v-if="pendingLoginData" class="mt-2 space-y-2">
          <div
            v-for="(code, i) in pendingLoginData.codes"
            :key="i"
            class="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg"
          >
            <span class="text-gray-400 text-sm w-5 shrink-0">{{ i + 1 }}.</span>
            <span
              class="font-mono font-bold tracking-widest text-base select-all"
            >
              {{ code }}
            </span>
          </div>
        </div>

        <!-- Print button -->
        <el-button class="w-full mt-2" @click="handlePrintCodes">
          🖨️ Print / Save as PDF
        </el-button>
      </div>

      <template #footer>
        <el-button type="primary" class="w-full" @click="confirmRecoveryCodes">
          {{
            pendingLoginData?.isRegenerationFlow
              ? "I've Saved My New Codes — Login"
              : "I've Saved My Recovery Codes — Continue"
          }}
        </el-button>
      </template>
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
  recoveryCodesDialogVisible,
  pendingLoginData,
  handleSubmit,
  handleForgotCode,
  confirmRecoveryCodes,
  handlePrintCodes,
  RECOVERY_CODES_COUNT
} = Login()
</script>
