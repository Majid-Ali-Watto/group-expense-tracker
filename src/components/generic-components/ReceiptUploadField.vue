<template>
  <div class="mb-4">
    <p class="mb-1 text-sm font-medium text-slate-900 dark:text-slate-300">
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
            ? `Current receipts (${existingUrls.length})`
            : 'Current receipt'
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
            <img
              :src="url"
              :alt="`Current receipt ${index + 1}`"
              class="block h-full w-full object-contain"
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
        <img
          :src="existingUrls[0]"
          alt="Current receipt"
          class="block h-full w-full object-contain"
        />
      </button>
    </div>

    <el-dialog v-model="dialogVisible" append-to-body width="min(92vw, 720px)">
      <el-carousel
        v-if="previewImages.length > 1"
        :initial-index="dialogInitialIndex"
        height="420px"
        indicator-position="outside"
        arrow="always"
      >
        <el-carousel-item
          v-for="(image, index) in previewImages"
          :key="`${image.url}-${index}`"
        >
          <img
            :src="image.url"
            :alt="image.name"
            class="block h-full max-h-[70vh] w-full object-contain"
          />
        </el-carousel-item>
      </el-carousel>

      <img
        v-else-if="previewImages[0]"
        :src="previewImages[0].url"
        :alt="previewImages[0].name"
        class="block h-full max-h-[70vh] w-full object-contain"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'

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
    default:
      'Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed. Max size: 1MB per file.'
  }
})

const emit = defineEmits(['files-selected', 'remove'])

const uploadRef = ref(null)
const fileList = ref([])
const dialogVisible = ref(false)
const previewImages = ref([])
const dialogInitialIndex = ref(0)
const objectUrlMap = new Map()

const isAtLimit = computed(() => !props.multiple && fileList.value.length >= 1)

function getFileKey(file, index = 0) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`
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

function handleChange(file, files) {
  fileList.value = files
  emit(
    'files-selected',
    files.map((f) => f.raw)
  )
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
      name: item.name || 'Receipt preview'
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
    name: `Receipt ${imageIndex + 1}`
  }))
  dialogInitialIndex.value = index
  dialogVisible.value = previewImages.value.length > 0
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
})
</script>
