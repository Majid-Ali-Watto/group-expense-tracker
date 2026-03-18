<template>
  <el-button
    :type="type"
    :size="size"
    class="focus:ring focus:ring-blue-200 text-white px-4 py-2 rounded"
    @click="$emit('click', $event)"
  >
    <slot></slot>
  </el-button>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'default'
  }
})

defineEmits(['click'])
</script>
