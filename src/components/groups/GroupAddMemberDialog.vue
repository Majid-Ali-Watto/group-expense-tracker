<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('groups.requestAddMemberTitle')"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-position="top">
      <GenericDropDown
        :model-value="selectedMember"
        :label="t('groups.selectMemberToAdd')"
        :options="memberOptions"
        :placeholder="t('groups.selectMemberPlaceholder')"
        size="default"
        :wrap-form-item="false"
        @update:modelValue="$emit('update:selectedMember', $event)"
      />
      <el-alert
        :title="t('groups.allMembersApproveNotice')"
        type="info"
        :closable="false"
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <!-- <el-button
          size="small"
          style="min-width: 100px"
          @click="$emit('reset')"
        >
          Reset
        </el-button> -->
        <el-button
          size="default"
          style="min-width: 100px"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.cancel') }}
        </el-button>
        <el-button
          type="primary"
          size="default"
          style="min-width: 100px"
          @click="$emit('submit')"
        >
          {{ t('common.sendRequest') }}
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
  selectedMember: { type: String, default: '' },
  memberOptions: { type: Array, required: true }
})

defineEmits(['update:modelValue', 'update:selectedMember', 'submit', 'reset'])
</script>
