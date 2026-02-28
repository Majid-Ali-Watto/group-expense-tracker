<template>
  <div class="flex items-center gap-2">
    <div class="flex flex-row flex-wrap gap-2">
      <el-button
        v-for="action in actions"
        :key="action.label"
        size="small"
        :type="action.type"
        :disabled="action.disabled"
        @click="action.onClick"
      >
        {{ action.label }}
      </el-button>
    </div>
  </div>
</template>
<script setup>
defineProps({
  actions: {
    type: Array,
    required: true
  }
})
</script>
