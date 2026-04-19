<template>
  <div v-if="uploadAllowed">
    <ReceiptUploadField
      :selected-files="selectedFiles"
      :existing-urls="existingUrls"
      :uploading="uploading || extracting"
      :multiple="multiple"
      :helper-text="helperText"
      @files-selected="$emit('files-selected', $event)"
      @remove="$emit('remove', $event)"
    />

    <template v-if="ocrExtractAllowed">
      <template v-if="canExtract">
        <div class="mt-3 flex justify-end">
          <el-button
            type="primary"
            plain
            size="small"
            :loading="extracting"
            :disabled="
              uploading ||
              extracting ||
              (!selectedFiles.length && !existingUrls.length)
            "
            @click="$emit('extract')"
          >
            {{ extracting ? 'Extracting...' : 'Extract Text' }}
          </el-button>
        </div>
        <p
          v-if="selectedFiles.length || existingUrls.length"
          class="mt-2 text-xs text-amber-600"
        >
          Verify the extracted data before saving. Receipt extraction can make
          mistakes.
        </p>
      </template>
      <p v-else class="mt-2 text-xs text-orange-500 text-right">
        {{ limitReachedMessage }}
      </p>
    </template>

    <p v-else class="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">
      Receipt text extraction coming soon.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getOcrConfig, getStorageConfig } from '@/composables/useAppConfig'
import { useOcrLimit } from '@/composables/useOcrLimit'
import ReceiptUploadField from './ReceiptUploadField.vue'

defineProps({
  selectedFiles: { type: Array, default: () => [] },
  existingUrls: { type: Array, default: () => [] },
  uploading: { type: Boolean, default: false },
  extracting: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  helperText: { type: String, default: '' }
})

defineEmits(['files-selected', 'remove', 'extract'])

const uploadAllowed = computed(() => getStorageConfig().upload_allowed)
const ocrExtractAllowed = computed(() => getOcrConfig().extract_allowed)
const { canExtract, limitReachedMessage } = useOcrLimit()
</script>
