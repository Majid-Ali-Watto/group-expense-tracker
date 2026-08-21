<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('auth.passwordReset.title')"
    width="92%"
    append-to-body
    style="max-width: 480px"
    :close-on-click-modal="false"
  >
    <div class="space-y-4">
      <el-alert type="info" :closable="false">
        <template #default>
          <div class="text-sm leading-relaxed">
            {{ t('auth.passwordReset.info') }}
          </div>
        </template>
      </el-alert>

      <GenericInputField
        :model-value="email"
        :label="t('auth.passwordReset.label')"
        label-position="top"
        type="email"
        :placeholder="t('auth.passwordReset.placeholder')"
        @update:modelValue="$emit('update:email', $event)"
      />

      <div class="flex gap-3">
        <GenericButton
          type="primary"
          custom-class="flex-1"
          :loading="isLoading"
          :disabled="isLoading"
          size="default"
          @click="$emit('send')"
        >
          {{ t('auth.passwordReset.send') }}
        </GenericButton>

        <GenericButton
          type="default"
          :disabled="isLoading"
          size="default"
          @click="dialogVisible = false"
        >
          {{ t('auth.passwordReset.cancel') }}
        </GenericButton>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GenericButton } from '@/components/generic-components'
import { GenericInputField } from '@/components/generic-components'

const { t } = useI18n()

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
