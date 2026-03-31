<template>
  <div class="flex flex-col">
    <div
      v-if="mode === 'login'"
      class="flex flex-col items-end gap-1 -mt-1 mb-2"
    >
      <GenericButton
        v-if="showResendVerification"
        type="link"
        size="small"
        @click="$emit('resend-verification')"
      >
        Resend Verification Email
      </GenericButton>
      <GenericButton type="link" size="small" @click="$emit('forgot-code')">
        Forgot Password?
      </GenericButton>
    </div>

    <el-checkbox
      :model-value="rememberMe"
      label="Remember Me"
      class="text-sm text-gray-700 mb-4"
      @update:modelValue="$emit('update:rememberMe', $event)"
    />

    <div class="flex items-center justify-between gap-2">
      <!-- <GenericButton
        @click="$emit('reset')"
        type="default"
        size="small"
        custom-class="flex-1"
        :disabled="isSubmitting"
      >
        Reset
      </GenericButton> -->

      <GenericButton
        @click="$emit('submit')"
        type="success"
        size="small"
        custom-class="flex-1"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        {{ mode === 'register' ? 'Register' : 'Login' }}
      </GenericButton>
    </div>

    <p
      v-if="mode === 'login'"
      class="text-center text-xs text-gray-500 mt-3 pt-3"
    >
      New to Kharchafy?
      <GenericButton
        type="link"
        size="small"
        custom-class="font-medium"
        @click="$emit('update:mode', 'register')"
      >
        Register
      </GenericButton>
    </p>

    <p
      v-if="mode === 'register'"
      class="text-center text-xs text-gray-500 mt-3 pt-3"
    >
      Already have an account?
      <GenericButton
        type="link"
        size="small"
        custom-class="font-medium"
        @click="$emit('update:mode', 'login')"
      >
        Login
      </GenericButton>
    </p>
  </div>
</template>

<script setup>
import { GenericButton } from '@/components/generic-components'

defineProps({
  mode: { type: String, required: true },
  rememberMe: { type: Boolean, default: false },
  isSubmitting: { type: Boolean, default: false },
  showResendVerification: { type: Boolean, default: false }
})

defineEmits([
  'update:mode',
  'update:rememberMe',
  'submit',
  'forgot-code',
  'resend-verification'
])
</script>
