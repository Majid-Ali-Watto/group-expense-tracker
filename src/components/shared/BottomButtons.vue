<template>
  <div
    class="flex justify-between flex-wrap gap-y-2 space-x-4 min-[410px]:flex-nowrap"
  >
    <el-button
      @click="confirmUpdate"
      type="warning"
      size="small"
      class="text-white py-2 px-4 rounded-lg"
    >
      Update
    </el-button>
    <el-button
      @click="confirmDelete"
      type="danger"
      size="small"
      class="text-white py-2 px-4 rounded-lg"
    >
      Delete
    </el-button>
    <el-button
      @click="confirmDuplicate"
      type="primary"
      size="small"
      class="py-2 px-4 rounded-lg"
    >
      Duplicate
    </el-button>
    <el-button
      @click="$emit('cancel')"
      type="success"
      size="small"
      class="py-2 px-4 rounded-lg"
    >
      Cancel
    </el-button>
  </div>
</template>

<script setup>
import { BottomButtons } from '@/scripts/shared'

const emit = defineEmits(['update', 'delete', 'duplicate', 'cancel'])

const { confirmUpdate, confirmDelete, confirmDuplicate } = BottomButtons(emit)
</script>

<style scoped>
div :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
