<template>
  <div class="mb-4">
    <p class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-300">
      {{ t('receiptUpload.label') }}
      <span class="text-gray-400 dark:text-gray-500 font-normal text-xs">
        ({{ t('common.optional') }})
      </span>
      <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">
        {{ resolvedHelperText }}
      </span>
    </p>

    <el-upload
      ref="uploadRef"
      v-model:file-list="fileList"
      :multiple="multiple"
      :auto-upload="false"
      list-type="picture-card"
      accept="image/*"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-preview="handlePictureCardPreview"
      :disabled="uploading"
      class="receipt-upload [--el-upload-list-picture-card-size:96px] [&_.el-upload--picture-card]:!h-24 [&_.el-upload--picture-card]:!w-24 [&_.el-upload--picture-card]:!rounded-xl [&_.el-upload--picture-card]:!border-dashed [&_.el-upload--picture-card]:!border-slate-400 [&_.el-upload--picture-card]:!bg-white [&_.el-upload--picture-card]:transition-colors [&_.receipt-upload-trigger-icon]:!text-2xl [&_.receipt-upload-trigger-icon]:!text-slate-700 hover:[&_.el-upload--picture-card]:!border-emerald-500 hover:[&_.receipt-upload-trigger-icon]:!text-emerald-600 dark:[&_.el-upload--picture-card]:!border-slate-600 dark:[&_.el-upload--picture-card]:!bg-slate-800 dark:[&_.receipt-upload-trigger-icon]:!text-slate-300"
      :class="{ '[&_.el-upload--picture-card]:hidden': isAtLimit }"
    >
      <el-icon v-if="!isAtLimit" class="receipt-upload-trigger-icon">
        <Plus />
      </el-icon>
    </el-upload>

    <div v-if="existingUrls.length && !selectedFiles.length" class="mt-3">
      <div class="mb-2 text-xs text-slate-500 dark:text-slate-400">
        {{
          existingUrls.length > 1
            ? t('receiptUpload.currentReceiptsCount', {
                count: existingUrls.length
              })
            : t('receiptUpload.currentReceipt')
        }}
      </div>

      <el-carousel
        v-if="existingUrls.length > 1"
        height="220px"
        indicator-position="outside"
        arrow="always"
      >
        <el-carousel-item v-for="(url, index) in existingUrls" :key="url">
          <button
            type="button"
            class="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-0 dark:border-slate-700 dark:bg-slate-800"
            @click="openExistingPreview(index)"
          >
            <AppImage
              :src="url"
              :alt="t('receiptUpload.currentReceiptAlt', { index: index + 1 })"
              class="block h-full w-full object-contain"
              fit="contain"
            />
          </button>
        </el-carousel-item>
      </el-carousel>

      <button
        v-else
        type="button"
        class="block h-[220px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-0 dark:border-slate-700 dark:bg-slate-800"
        @click="openExistingPreview(0)"
      >
        <AppImage
          :src="existingUrls[0]"
          :alt="t('receiptUpload.currentReceipt')"
          class="block h-full w-full object-contain"
          fit="contain"
        />
      </button>
    </div>

    <ImagePreviewDialog
      v-model="dialogVisible"
      :images="previewImages"
      :initial-index="dialogInitialIndex"
      :title="t('receiptUpload.previewTitle')"
    />

    <ImageCropEditorDialog
      :visible="editorVisible"
      :source-url="editorSourceUrl"
      :submitting="false"
      :title="t('receiptUpload.editorTitle')"
      :confirm-label="t('receiptUpload.editorConfirmLabel')"
      :image-alt="t('receiptUpload.editorAlt')"
      preview-shape="square"
      :hint-text="t('receiptUpload.editorHint')"
      @update:visible="handleEditorVisibilityChange"
      @confirm="handleEditorConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import AppImage from './AppImage.vue'
import ImageCropEditorDialog from './ImageCropEditorDialog.vue'
import ImagePreviewDialog from './ImagePreviewDialog.vue'

const { t } = useI18n()

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
    default: ''
  }
})

const resolvedHelperText = computed(
  () => props.helperText || t('common.receiptHelperDefault')
)

const emit = defineEmits(['files-selected', 'remove'])

const uploadRef = ref(null)
const fileList = ref([])
const dialogVisible = ref(false)
const previewImages = ref([])
const dialogInitialIndex = ref(0)
const editorVisible = ref(false)
const editorSourceUrl = ref('')
const objectUrlMap = new Map()
const cropQueue = ref([])
const cropBaseFiles = ref([])
const croppedFiles = ref([])
const activeEditorFile = ref(null)

const isAtLimit = computed(() => !props.multiple && fileList.value.length >= 1)

function getFileKey(file, index = 0) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`
}

function getFileSignature(file) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function getObjectUrl(file, index = 0) {
  const key = getFileKey(file, index)

  if (!objectUrlMap.has(key)) {
    objectUrlMap.set(key, URL.createObjectURL(file))
  }

  return objectUrlMap.get(key)
}

function syncFileList(files = []) {
  const normalizedFiles = Array.isArray(files) ? files : []
  const activeKeys = new Set(
    normalizedFiles.map((file, index) => getFileKey(file, index))
  )

  objectUrlMap.forEach((url, key) => {
    if (!activeKeys.has(key)) {
      URL.revokeObjectURL(url)
      objectUrlMap.delete(key)
    }
  })

  fileList.value = normalizedFiles.map((file, index) => ({
    name: file.name,
    url: getObjectUrl(file, index),
    status: 'success',
    uid: getFileKey(file, index),
    raw: file
  }))
}

function revokeEditorSourceUrl() {
  if (editorSourceUrl.value) {
    URL.revokeObjectURL(editorSourceUrl.value)
  }
  editorSourceUrl.value = ''
}

function resetEditorQueue() {
  cropQueue.value = []
  cropBaseFiles.value = []
  croppedFiles.value = []
  activeEditorFile.value = null
  editorVisible.value = false
  revokeEditorSourceUrl()
}

function buildReplacementFile(blob, originalFile) {
  const extension = blob.type === 'image/png' ? 'png' : 'jpg'
  const safeBaseName =
    originalFile?.name?.replace(/\.[^.]+$/, '') || 'receipt-image'

  return new File([blob], `${safeBaseName}.${extension}`, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now()
  })
}

function emitSelectedFiles(files = []) {
  if (files.length) {
    emit('files-selected', files)
  } else {
    emit('remove')
  }
}

function openNextEditor() {
  const [nextFile, ...remaining] = cropQueue.value
  if (!nextFile) {
    const nextFiles = props.multiple
      ? [...cropBaseFiles.value, ...croppedFiles.value]
      : croppedFiles.value.slice(0, 1)

    emitSelectedFiles(nextFiles)
    resetEditorQueue()
    return
  }

  cropQueue.value = remaining
  activeEditorFile.value = nextFile
  revokeEditorSourceUrl()
  editorSourceUrl.value = URL.createObjectURL(nextFile)
  editorVisible.value = true
}

function handleChange(file, files) {
  const normalizedFiles = files.map((entry) => entry.raw).filter(Boolean)
  const existingFiles = Array.isArray(props.selectedFiles)
    ? props.selectedFiles
    : []

  const normalizedKeys = new Set(
    normalizedFiles.map((selectedFile) => getFileSignature(selectedFile))
  )
  const existingKeys = new Set(
    existingFiles.map((selectedFile) => getFileSignature(selectedFile))
  )
  const newFiles = normalizedFiles.filter(
    (selectedFile) => !existingKeys.has(getFileSignature(selectedFile))
  )

  if (!newFiles.length) {
    syncFileList(existingFiles)
    return
  }

  const newFileKeys = new Set(
    newFiles.map((selectedFile) => getFileSignature(selectedFile))
  )
  cropBaseFiles.value = props.multiple
    ? existingFiles.filter((selectedFile) => {
        const key = getFileSignature(selectedFile)
        return normalizedKeys.has(key) && !newFileKeys.has(key)
      })
    : []
  croppedFiles.value = []
  cropQueue.value = [...newFiles]
  openNextEditor()
}

function handleRemove(file, files) {
  fileList.value = files

  if (files.length === 0) {
    emit('remove')
  } else {
    emit(
      'files-selected',
      files.map((f) => f.raw)
    )
  }
}

function handlePictureCardPreview(file) {
  previewImages.value = fileList.value
    .map((item) => ({
      url: item.url,
      name: item.name || t('receiptUpload.previewFallbackName')
    }))
    .filter((item) => item.url)

  dialogInitialIndex.value = Math.max(
    fileList.value.findIndex((item) => item.uid === file.uid),
    0
  )
  dialogVisible.value = previewImages.value.length > 0
}

function openExistingPreview(index = 0) {
  previewImages.value = props.existingUrls.map((url, imageIndex) => ({
    url,
    name: t('receiptUpload.receiptIndexName', { index: imageIndex + 1 })
  }))
  dialogInitialIndex.value = index
  dialogVisible.value = previewImages.value.length > 0
}

function handleEditorVisibilityChange(visible) {
  if (visible) {
    editorVisible.value = true
    return
  }

  const nextFiles = props.multiple
    ? [...cropBaseFiles.value, ...croppedFiles.value]
    : croppedFiles.value.slice(0, 1)
  emitSelectedFiles(nextFiles)
  resetEditorQueue()
}

function handleEditorConfirm(blob) {
  if (!activeEditorFile.value) return

  croppedFiles.value.push(buildReplacementFile(blob, activeEditorFile.value))
  activeEditorFile.value = null
  editorVisible.value = false
  revokeEditorSourceUrl()
  openNextEditor()
}

watch(
  () => props.selectedFiles,
  (files) => {
    syncFileList(files)

    if (!files.length) {
      uploadRef.value?.clearFiles()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  objectUrlMap.forEach((url) => URL.revokeObjectURL(url))
  objectUrlMap.clear()
  revokeEditorSourceUrl()
})
</script>
