<template>
  <div class="flex justify-between items-center gap-4">
    <span> {{ text }} </span>
    <el-button
      type="primary"
      circle
      size="default"
      @click.stop="$emit('click')"
    >
      <span class="text-lg">+</span>
    </el-button>
  </div>
</template>
<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true
  }
})
</script>
