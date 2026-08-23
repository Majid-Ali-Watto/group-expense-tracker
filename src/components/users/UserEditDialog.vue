<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('users.editUser')"
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
      <el-form-item :label="t('users.mobileNumber')" prop="mobile">
        <GenericMobileInput
          :model-value="localForm.mobile"
          :wrap-form-item="false"
          :placeholder="t('users.mobilePlaceholder')"
          @update:modelValue="localForm.mobile = $event"
        />
      </el-form-item>
      <el-form-item :label="t('users.fullName')" prop="name">
        <GenericInputField
          :model-value="localForm.name"
          :wrap-form-item="false"
          :placeholder="t('users.fullNamePlaceholder')"
          :maxlength="50"
          @update:modelValue="localForm.name = $event.toCapitalize()"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex gap-2 justify-end">
        <el-button size="default" @click="handleReset">{{
          t('common.reset')
        }}</el-button>
        <el-button size="default" @click="$emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </el-button>
        <el-button type="primary" size="default" @click="handleSave">
          {{ t('users.save') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  GenericInputField,
  GenericMobileInput
} from '@/components/generic-components'

const { t } = useI18n()

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
