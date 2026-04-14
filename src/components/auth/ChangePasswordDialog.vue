<template>
  <el-dialog
    v-model="dialogVisible"
    title="Change Password"
    :width="'min(95vw, 420px)'"
    append-to-body
    :close-on-click-modal="!isSubmitting"
    :close-on-press-escape="!isSubmitting"
    @closed="emit('close')"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleChangePassword"
    >
      <el-form-item label="Current Password" prop="currentPassword">
        <el-input
          v-model="form.currentPassword"
          type="password"
          show-password
          size="small"
          placeholder="Enter your current password"
          :disabled="isSubmitting"
          autocomplete="current-password"
        />
      </el-form-item>

      <el-form-item label="New Password" prop="newPassword">
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          placeholder="Enter new password (6–15 characters)"
          :disabled="isSubmitting"
          autocomplete="new-password"
          size="small"
        />
      </el-form-item>

      <el-form-item label="Confirm New Password" prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          size="small"
          placeholder="Re-enter new password"
          :disabled="isSubmitting"
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="small" :disabled="isSubmitting" @click="closeDialog"
        >Cancel</el-button
      >
      <el-button
        type="primary"
        size="small"
        :loading="isSubmitting"
        @click="handleChangePassword"
      >
        Change Password
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ChangePassword } from '@/scripts/auth'

const emit = defineEmits(['close'])

const {
  dialogVisible,
  isSubmitting,
  form,
  formRef,
  rules,
  closeDialog,
  handleChangePassword
} = ChangePassword()
</script>
