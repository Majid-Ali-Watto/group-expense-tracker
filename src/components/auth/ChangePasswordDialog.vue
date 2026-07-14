<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('auth.changePassword.title')"
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
      <el-form-item
        :label="t('auth.changePassword.currentPasswordLabel')"
        prop="currentPassword"
      >
        <el-input
          v-model="form.currentPassword"
          type="password"
          show-password
          size="medium"
          :placeholder="t('auth.changePassword.currentPasswordPlaceholder')"
          :disabled="isSubmitting"
          autocomplete="current-password"
        />
      </el-form-item>

      <el-form-item
        :label="t('auth.changePassword.newPasswordLabel')"
        prop="newPassword"
      >
        <el-input
          v-model="form.newPassword"
          type="password"
          show-password
          :placeholder="t('auth.changePassword.newPasswordPlaceholder')"
          :disabled="isSubmitting"
          autocomplete="new-password"
          size="medium"
        />
      </el-form-item>

      <el-form-item
        :label="t('auth.changePassword.confirmPasswordLabel')"
        prop="confirmPassword"
      >
        <el-input
          v-model="form.confirmPassword"
          type="password"
          show-password
          size="medium"
          :placeholder="t('auth.changePassword.confirmPasswordPlaceholder')"
          :disabled="isSubmitting"
          autocomplete="new-password"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button size="medium" :disabled="isSubmitting" @click="closeDialog"
        >{{ t('common.cancel') }}</el-button
      >
      <el-button
        type="primary"
        size="medium"
        :loading="isSubmitting"
        @click="handleChangePassword"
      >
        {{ t('auth.changePassword.submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ChangePassword } from '@/scripts/auth'

const { t } = useI18n()

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
