<template>
  <el-dialog
    :model-value="modelValue"
    title="Edit Group"
    width="90%"
    append-to-body
    style="max-width: 500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="localForm"
      :rules="rules"
      ref="formRef"
      label-position="top"
    >
      <GenericInputField
        v-model="localForm.name"
        label="Group Name"
        prop="name"
        placeholder="Enter group name"
        :maxlength="50"
      />
      <GenericInputField
        v-model="localForm.description"
        label="Description"
        type="textarea"
        :rows="3"
        placeholder="Enter group description (optional)"
        :maxlength="100"
      />
      <GenericDropDown
        v-model="localForm.members"
        label="Members"
        prop="members"
        :options="memberOptions"
        placeholder="Select members"
        size="small"
        multiple
      />
    </el-form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button
          size="small"
          style="min-width: 80px"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          size="small"
          style="min-width: 80px"
          @click="handleSave"
        >
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { groupRules } from '@/assets'
import {
  GenericInputField,
  GenericDropDown
} from '@/components/generic-components'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form: { type: Object, required: true },
  memberOptions: { type: Array, required: true }
})

const emit = defineEmits(['update:modelValue', 'save'])

const rules = groupRules
const formRef = ref(null)
const localForm = reactive({ name: '', description: '', members: [] })

watch(
  () => props.form,
  (val) => {
    localForm.name = val.name ?? ''
    localForm.description = val.description ?? ''
    localForm.members = val.members ? [...val.members] : []
  },
  { immediate: true }
)

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('save', { ...localForm })
  })
}
</script>
