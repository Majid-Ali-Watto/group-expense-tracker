<template>
  <el-dialog
    :model-value="modelValue"
    title="Edit User"
    width="90%"
    append-to-body
    style="max-width: 400px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="localForm"
      :rules="rules"
      ref="formRef"
      label-position="top"
    >
      <el-form-item label="Mobile Number" prop="mobile">
        <GenericInputField
          :model-value="localForm.mobile"
          :wrap-form-item="false"
          placeholder="03XXXXXXXXX"
          :maxlength="11"
          type="tel"
          @update:modelValue="localForm.mobile = $event"
        />
      </el-form-item>
      <el-form-item label="Full Name" prop="name">
        <GenericInputField
          :model-value="localForm.name"
          :wrap-form-item="false"
          placeholder="Full name"
          :maxlength="50"
          @update:modelValue="localForm.name = $event.toCapitalize()"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <el-button size="small" @click="handleReset">Reset</el-button>
        <el-button size="small" @click="$emit('update:modelValue', false)">
          Cancel
        </el-button>
        <el-button type="primary" size="small" @click="handleSave">
          Save
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { GenericInputField } from '@/components/generic-components'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  form: { type: Object, required: true },
  rules: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'save', 'reset'])

const formRef = ref(null)
const localForm = reactive({ uid: '', name: '', mobile: '' })

watch(
  () => props.form,
  (val) => {
    localForm.uid = val.uid
    localForm.name = val.name
    localForm.mobile = val.mobile
  },
  { immediate: true }
)

function handleSave() {
  formRef.value?.validate((valid) => {
    if (!valid) return
    emit('save', { ...localForm })
  })
}

function handleReset() {
  emit('reset')
  nextTick(() => formRef.value?.clearValidate())
}
</script>
