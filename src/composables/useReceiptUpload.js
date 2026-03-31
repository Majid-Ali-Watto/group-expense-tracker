import { computed, ref, unref } from 'vue'
import { uploadReceipt, deleteReceipt, showError } from '@/utils'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
]

const MAX_FILE_SIZE = 1024 * 1024

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return value ? [value] : []
}

function resolveMaxFiles(maxFiles) {
  const resolved =
    typeof maxFiles === 'function' ? maxFiles() : unref(maxFiles ?? 1)

  if (resolved === Infinity) {
    return Infinity
  }

  const parsed = Number(resolved)
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1
}

function deleteReceiptMetas(metas = []) {
  metas.forEach((meta) => {
    if (meta?.url) deleteReceipt(meta)
  })
}

export function useReceiptUpload({ existingUrls, existingMeta, maxFiles = 1 }) {
  const receiptFiles = ref([])
  const receiptUploading = ref(false)

  const existingReceiptUrls = computed(() => normalizeList(unref(existingUrls)))
  const existingReceiptMeta = computed(() => normalizeList(unref(existingMeta)))
  const receiptFile = computed(() => receiptFiles.value[0] || null)
  const allowsMultiple = computed(() => resolveMaxFiles(maxFiles) > 1)

  async function setSelectedFiles(files = []) {
    const normalizedFiles = Array.from(files)

    if (!normalizedFiles.length) {
      receiptFiles.value = []
      return true
    }

    for (const file of normalizedFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showError('Only image files (JPG, PNG, GIF, BMP, WEBP) are allowed.')
        receiptFiles.value = []
        return false
      }

      if (file.size > MAX_FILE_SIZE) {
        showError('File size must be less than 1MB.')
        receiptFiles.value = []
        return false
      }
    }

    const limit = resolveMaxFiles(maxFiles)
    receiptFiles.value =
      limit === Infinity ? normalizedFiles : normalizedFiles.slice(0, limit)

    return true
  }

  function trimSelectedFiles() {
    const limit = resolveMaxFiles(maxFiles)

    if (limit !== Infinity && receiptFiles.value.length > limit) {
      receiptFiles.value = receiptFiles.value.slice(0, limit)
    }
  }

  function removeReceipt() {
    receiptFiles.value = []
  }

  async function uploadSelectedFiles({ replaceExisting = false } = {}) {
    const previousUrls = [...existingReceiptUrls.value]
    const previousMeta = [...existingReceiptMeta.value]

    if (!receiptFiles.value.length) {
      return {
        receiptUrls: previousUrls,
        receiptMeta: previousMeta
      }
    }

    try {
      receiptUploading.value = true
      const uploaded = await Promise.all(
        receiptFiles.value.map((file) => uploadReceipt(file))
      )
      const receiptUrls = uploaded.map((item) => item.url)
      const receiptMeta = uploaded // already full meta objects with provider field

      if (replaceExisting) {
        deleteReceiptMetas(previousMeta)
      }

      return {
        receiptUrls,
        receiptMeta
      }
    } catch {
      showError('Failed to upload receipt. Please try again.')
      return null
    } finally {
      receiptUploading.value = false
    }
  }

  function deleteExistingReceipts() {
    deleteReceiptMetas(existingReceiptMeta.value)
  }

  return {
    receiptFiles,
    receiptFile,
    receiptUploading,
    allowsMultiple,
    existingReceiptUrls,
    existingReceiptMeta,
    setSelectedFiles,
    trimSelectedFiles,
    removeReceipt,
    uploadSelectedFiles,
    deleteExistingReceipts
  }
}
