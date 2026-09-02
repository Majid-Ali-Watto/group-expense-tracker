<template>
  <el-alert
    :title="''"
    :type="mode === 'register' ? 'success' : 'info'"
    :closable="false"
    class="mb-4"
  >
    <template #default>
      <span class="text-sm">
        <template v-if="mode === 'register'">
          <strong>{{ t('auth.infoAlert.registerWarning') }}</strong>
        </template>
        <template v-else>{{ t('auth.infoAlert.loginText') }}</template>
      </span>
    </template>
  </el-alert>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  mode: { type: String, required: true }
})

const { t } = useI18n()
</script>
