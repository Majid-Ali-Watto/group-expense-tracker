<template>
  <GenericInputField
    v-if="mode === 'register'"
    :model-value="modelValue.name"
    :label="t('auth.formFields.nameLabel')"
    prop="name"
    required
    :placeholder="t('auth.formFields.namePlaceholder')"
    :maxlength="50"
    @update:modelValue="updateField('name', $event.toCapitalize())"
  />

  <GenericMobileInput
    v-if="mode === 'register'"
    :model-value="modelValue.mobile"
    :label="t('auth.formFields.mobileLabel')"
    prop="mobile"
    required
    :placeholder="t('auth.formFields.mobilePlaceholder')"
    @update:modelValue="updateField('mobile', $event)"
  />

  <GenericInputField
    :model-value="modelValue.email"
    :label="t('auth.formFields.emailLabel')"
    prop="email"
    required
    type="email"
    :placeholder="t('auth.formFields.emailPlaceholder')"
    @update:modelValue="updateField('email', $event)"
  />

  <GenericInputField
    :model-value="modelValue.password"
    :label="t('auth.formFields.passwordLabel')"
    prop="password"
    required
    type="password"
    :placeholder="t('auth.formFields.passwordPlaceholder')"
    :show-password="true"
    :maxlength="15"
    @update:modelValue="updateField('password', $event)"
  />
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import {
  GenericInputField,
  GenericMobileInput
} from '@/components/generic-components'

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
</script>
