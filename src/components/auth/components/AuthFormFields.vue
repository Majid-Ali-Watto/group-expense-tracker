<template>
  <GenericInputField
    v-if="mode === 'register'"
    :model-value="modelValue.name"
    :label="t('auth.formFields.nameLabel')"
    prop="name"
    :placeholder="t('auth.formFields.namePlaceholder')"
    :maxlength="50"
    @update:modelValue="updateField('name', $event.toCapitalize())"
  />

  <GenericInputField
    v-if="mode === 'register'"
    :model-value="modelValue.mobile"
    :label="t('auth.formFields.mobileLabel')"
    prop="mobile"
    :placeholder="t('auth.formFields.mobilePlaceholder')"
    :maxlength="11"
    @update:modelValue="updateField('mobile', sanitizeMobile($event))"
  />

  <GenericInputField
    :model-value="modelValue.email"
    :label="t('auth.formFields.emailLabel')"
    prop="email"
    type="email"
    :placeholder="t('auth.formFields.emailPlaceholder')"
    @update:modelValue="updateField('email', $event)"
  />

  <GenericInputField
    :model-value="modelValue.password"
    :label="t('auth.formFields.passwordLabel')"
    prop="password"
    type="password"
    :placeholder="t('auth.formFields.passwordPlaceholder')"
    :show-password="true"
    :maxlength="15"
    @update:modelValue="updateField('password', $event)"
  />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { GenericInputField } from '@/components/generic-components'

const { t } = useI18n()

const props = defineProps({
  mode: { type: String, required: true },
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

function updateField(field, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

function sanitizeMobile(value) {
  return value.replace(/\D/g, '')
}
</script>
