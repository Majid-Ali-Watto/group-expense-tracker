<template>
  <el-dialog
    :model-value="modelValue"
    title="Transfer Ownership"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-position="top">
      <GenericDropDown
        :model-value="newOwner"
        label="Select New Owner"
        :options="ownerOptions"
        placeholder="Select new owner"
        size="small"
        :wrap-form-item="false"
        @update:modelValue="$emit('update:newOwner', $event)"
      />
      <el-alert
        title="The selected member must accept this transfer before it takes effect."
        type="info"
        :closable="false"
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="small"
          style="min-width: 120px"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          size="small"
          style="min-width: 120px"
          @click="$emit('submit')"
        >
          Request Transfer
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { GenericDropDown } from '@/components/generic-components'

defineProps({
  modelValue: { type: Boolean, required: true },
  newOwner: { type: String, default: '' },
  ownerOptions: { type: Array, required: true }
})

defineEmits(['update:modelValue', 'update:newOwner', 'submit'])
</script>
