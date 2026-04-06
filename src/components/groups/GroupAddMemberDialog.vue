<template>
  <el-dialog
    :model-value="modelValue"
    title="Request to Add Member"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form label-position="top">
      <GenericDropDown
        :model-value="selectedMember"
        label="Select Member to Add"
        :options="memberOptions"
        placeholder="Select member"
        size="small"
        :wrap-form-item="false"
        @update:modelValue="$emit('update:selectedMember', $event)"
      />
      <el-alert
        title="All current members must approve before this member can be added"
        type="info"
        :closable="false"
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="small"
          style="min-width: 100px"
          @click="$emit('reset')"
        >
          Reset
        </el-button>
        <el-button
          size="small"
          style="min-width: 100px"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          size="small"
          style="min-width: 100px"
          @click="$emit('submit')"
        >
          Send Request
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { GenericDropDown } from '@/components/generic-components'

defineProps({
  modelValue: { type: Boolean, required: true },
  selectedMember: { type: String, default: '' },
  memberOptions: { type: Array, required: true }
})

defineEmits(['update:modelValue', 'update:selectedMember', 'submit', 'reset'])
</script>
