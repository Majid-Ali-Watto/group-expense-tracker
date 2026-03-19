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
    <div class="flex items-center gap-2 flex-wrap">
      <el-button size="small" @click="triggerInput" :disabled="uploading">
        {{ selectedFiles.length ? 'Change File' : 'Choose File' }}
      </el-button>
      <span
        v-if="selectedFiles.length"
        v-overflow-popup="{ title: 'Selected File' }"
        class="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[220px]"
      >
        {{ selectedFilesLabel }}
      </span>
      <span v-else class="text-sm text-gray-400 dark:text-gray-500">
        No file chosen
      </span>
      <el-button
        v-if="selectedFiles.length"
        size="small"
        type="danger"
        text
        @click="$emit('remove')"
      >
        ✕
      </el-button>
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        :multiple="multiple"
        @change="handleChange"
      />
    </div>
    <div
      v-if="existingUrls.length && !selectedFiles.length"
      class="flex flex-col gap-1 mt-1"
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
import { computed, ref, watch } from 'vue'

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

const fileInputRef = ref(null)

const selectedFilesLabel = computed(() => {
  if (props.selectedFiles.length <= 1) {
    return props.selectedFiles[0]?.name || ''
  }

  return `${props.selectedFiles[0].name} +${props.selectedFiles.length - 1} more`
})

function triggerInput() {
  fileInputRef.value?.click()
}

function handleChange(event) {
  emit('files-selected', Array.from(event.target.files || []))
}

watch(
  () => props.selectedFiles.length,
  (length) => {
    if (length === 0 && fileInputRef.value) {
      fileInputRef.value.value = ''
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
