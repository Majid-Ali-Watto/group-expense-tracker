<template>
  <GenericInputField
    v-if="mode === 'register'"
    :model-value="modelValue.name"
    label="Full Name"
    prop="name"
    placeholder="Enter your full name"
    :maxlength="50"
    @update:modelValue="updateField('name', $event)"
  />

  <GenericInputField
    v-if="mode === 'register'"
    :model-value="modelValue.mobile"
    label="Mobile Number"
    prop="mobile"
    placeholder="Enter your mobile number"
    :maxlength="11"
    @update:modelValue="updateField('mobile', sanitizeMobile($event))"
  />

  <GenericInputField
    :model-value="modelValue.email"
    label="Email"
    prop="email"
    type="email"
    placeholder="Enter your email address"
    @update:modelValue="updateField('email', $event)"
  />

  <GenericInputField
    :model-value="modelValue.loginCode"
    label="Password"
    prop="loginCode"
    type="password"
    placeholder="Enter your password (6-15 characters)"
    :show-password="true"
    :maxlength="15"
    @update:modelValue="updateField('loginCode', $event)"
  />
</template>

<script setup>
import GenericInputField from '../../generic-components/GenericInputField.vue'

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
