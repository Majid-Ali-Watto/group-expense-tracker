<template>
  <div class="mb-4">
    <el-segmented
      :model-value="mode"
      :options="options"
      size="small"
      class="w-full auth-segment"
      @update:modelValue="$emit('update:mode', $event)"
    />
  </div>
</template>

<script setup>
defineProps({
  mode: { type: String, required: true }
})

defineEmits(['update:mode'])

const options = [
  { label: 'Login', value: 'login' },
  { label: 'Register', value: 'register' }
]
</script>
