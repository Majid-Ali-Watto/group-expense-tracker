<template>
  <el-dialog
    :model-value="modelValue"
    :title="`${userName}'s Groups (${groups.length})`"
    width="300px"
    append-to-body
    align-center
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="overflow-y-auto max-h-64 pr-1">
      <div
        v-for="(group, i) in groups"
        :key="i"
        class="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
      >
        <div
          class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold shrink-0"
        >
          {{ group.charAt(0).toUpperCase() }}
        </div>
        <div class="text-sm text-gray-700">{{ group }}</div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  userName: { type: String, default: '' },
  groups: { type: Array, required: true }
})

defineEmits(['update:modelValue'])
</script>
