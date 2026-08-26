import { uploadToCloudinary, deleteFromCloudinary } from './cloudinaryUpload'
import { getStorageConfig } from '@/composables'

// ── Upload ──────────────────────────────────────────────────────────────────
/**
 * Upload a single file to Cloudinary.
 * Returns a meta object: { url, provider, ...providerSpecificFields }
 */
export async function uploadReceipt(file, { maxSizeBytes } = {}) {
  const cfg = getStorageConfig()

  if (!cfg.cloudinary) {
    throw new Error('Receipt storage is unavailable. Please try again later.')
  }

  try {
    const result = await uploadToCloudinary(file, { maxSizeBytes })
    return {
      url: result.url,
      provider: 'cloudinary',
      publicId: result.publicId,
      resourceType: result.resourceType
    }
  } catch (err) {
    console.warn('[uploadReceipt] cloudinary upload failed:', err.message)
    throw new Error('Failed to upload receipt. Receipt storage is unavailable.')
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────
/**
 * Delete a single Cloudinary receipt using its stored meta object.
 * Legacy meta without a provider field is treated as Cloudinary.
 */
export async function deleteReceipt(meta, context = null) {
  if (!meta) return
  if (meta.provider && meta.provider !== 'cloudinary') return

  if (meta.publicId) {
    await deleteFromCloudinary(meta.publicId, meta.resourceType, context)
  }
}

// ── Cleanup helper ──────────────────────────────────────────────────────────
/**
 * Delete any receipts that were present before an update but are no longer
 * in the new set.
 */
export function cleanupOldReceipts(oldMeta, newMeta, context = null) {
  if (!oldMeta || !newMeta) return
  const oldMetas = Array.isArray(oldMeta) ? oldMeta : [oldMeta]
  const newUrls = new Set(
    (Array.isArray(newMeta) ? newMeta : [newMeta]).map((m) => m.url)
  )
  oldMetas.forEach((m) => {
    if (!newUrls.has(m.url)) deleteReceipt(m, context)
  })
}
