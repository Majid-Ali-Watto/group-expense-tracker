<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('groups.transferOwnershipTitle')"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-position="top">
      <GenericDropDown
        :model-value="newOwner"
        :label="t('groups.selectNewOwner')"
        :options="ownerOptions"
        :placeholder="t('groups.selectNewOwnerPlaceholder')"
        size="medium"
        :wrap-form-item="false"
        @update:modelValue="$emit('update:newOwner', $event)"
      />
      <el-alert
        :title="t('groups.transferAcceptNotice')"
        type="info"
        :closable="false"
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="medium"
          style="min-width: 120px"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          size="medium"
          style="min-width: 120px"
          @click="$emit('submit')"
        >
          {{ t('groups.requestTransfer') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { GenericDropDown } from '@/components/generic-components'

const { t } = useI18n()

defineProps({
  modelValue: { type: Boolean, required: true },
  newOwner: { type: String, default: '' },
  ownerOptions: { type: Array, required: true }
})

defineEmits(['update:modelValue', 'update:newOwner', 'submit'])
</script>
