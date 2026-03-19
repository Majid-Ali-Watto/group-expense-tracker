<template>
  <div class="mb-4">
    <p class="text-sm font-medium receipt-label mb-1">
      Receipt
      <span class="text-gray-400 dark:text-gray-500 font-normal text-xs">
        (optional)
      </span>
      <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ helperText }}
      </span>
    </p>

    <el-upload
      ref="uploadRef"
      :multiple="multiple"
      :auto-upload="false"
      :show-file-list="true"
      accept="image/*"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :disabled="uploading"
    >
      <el-button size="small" :disabled="uploading">
        Choose File
      </el-button>
    </el-upload>

    <div
      v-if="existingUrls.length && !selectedFiles.length"
      class="flex flex-col gap-1 mt-2"
    >
      <a
        v-for="(url, index) in existingUrls"
        :key="url"
        :href="url"
        target="_blank"
        rel="noopener"
        class="text-xs text-blue-500 hover:underline inline-block"
      >
        {{ existingUrls.length > 1 ? `View receipt ${index + 1}` : 'View current receipt' }}
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  selectedFiles: {
    type: Array,
    default: () => []
  },
  existingUrls: {
    type: Array,
    default: () => []
  },
  uploading: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  helperText: {
    type: String,
    default: 'Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file.'
  }
})

const emit = defineEmits(['files-selected', 'remove'])

const uploadRef = ref(null)

function handleChange(file, files) {
  emit('files-selected', files.map((f) => f.raw))
}

function handleRemove(file, files) {
  if (files.length === 0) {
    emit('remove')
  } else {
    emit('files-selected', files.map((f) => f.raw))
  }
}

// When parent clears selectedFiles (e.g. after save or removeReceipt), clear el-upload's list too
watch(
  () => props.selectedFiles.length,
  (length) => {
    if (length === 0) {
      uploadRef.value?.clearFiles()
    }
  }
)
</script>

<style scoped>
.receipt-label {
  color: #111827 !important;
}

:root.dark-theme .receipt-label {
  color: #d1d5db !important;
}
</style>
