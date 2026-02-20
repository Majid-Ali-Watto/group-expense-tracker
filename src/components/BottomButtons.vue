<template>
  <div class="flex justify-between space-x-4">
    <el-button
      @click="confirmUpdate"
      type="warning"
      class="text-white py-2 px-4 rounded-lg"
    >
      Update
    </el-button>
    <el-button
      @click="confirmDelete"
      type="danger"
      class="text-white py-2 px-4 rounded-lg"
    >
      Delete
    </el-button>
    <el-button
      @click="$emit('cancel')"
      type="success"
      class="py-2 px-4 rounded-lg"
    >
      Cancel
    </el-button>
  </div>
</template>

<script setup>
import { BottomButtons } from '../scripts/bottom-buttons'

const emit = defineEmits(['update', 'delete', 'cancel'])

const { confirmUpdate, confirmDelete } = BottomButtons(emit)
</script>
