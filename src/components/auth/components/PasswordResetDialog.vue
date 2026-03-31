<template>
  <el-dialog
    v-model="dialogVisible"
    title="Reset Password via Email"
    width="92%"
    append-to-body
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

      <GenericInputField
        :model-value="email"
        label="Registered Email Address"
        label-position="top"
        type="email"
        placeholder="Enter your registered email"
        @update:modelValue="$emit('update:email', $event)"
      />

      <div class="flex gap-3">
        <GenericButton
          type="primary"
          custom-class="flex-1"
          :loading="isLoading"
          :disabled="isLoading"
          size="small"
          @click="$emit('send')"
        >
          Send Reset Link
        </GenericButton>

        <GenericButton
          type="default"
          :disabled="isLoading"
          size="small"
          @click="dialogVisible = false"
        >
          Cancel
        </GenericButton>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { GenericButton } from '@/components/generic-components'
import { GenericInputField } from '@/components/generic-components'

const props = defineProps({
  visible: { type: Boolean, default: false },
  email: { type: String, default: '' },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'update:email', 'send'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})
</script>
