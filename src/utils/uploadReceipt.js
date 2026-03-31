/**
 * Unified receipt upload/delete with dual-provider resilience.
 *
 * Strategy when both providers are healthy:
 *   - Alternate between Cloudinary and Firebase Storage on each upload
 *     to distribute usage across both free tiers.
 *
 * Fallback:
 *   - If a provider throws any error (quota, network, auth) during an upload,
 *     it is marked as degraded for the remainder of the browser session.
 *   - The other provider is tried immediately.
 *   - If both fail, an error is thrown so the caller can surface it.
 *
 * Deletion:
 *   - Each meta object stores a `provider` field ('cloudinary' | 'firebase').
 *   - deleteReceipt() dispatches to the correct service automatically.
 *   - Legacy meta without a `provider` field is treated as Cloudinary.
 */

import { uploadToCloudinary, deleteFromCloudinary } from './cloudinaryUpload'
import {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage
} from './firebaseStorageUpload'
import { getStorageConfig } from '../composables/useAppConfig'

// ── Session-level provider health ──────────────────────────────────────────
let _cloudinaryHealthy = true
let _firebaseHealthy = true
// Alternates which provider is tried first when both are healthy
let _uploadCounter = 0

function getProviderOrder() {
  const cfg = getStorageConfig()
  const cloudinaryEnabled = cfg.cloudinary && _cloudinaryHealthy
  const firebaseEnabled = cfg.firebase && _firebaseHealthy

  if (!cloudinaryEnabled && !firebaseEnabled) return []
  if (!cloudinaryEnabled) return ['firebase']
  if (!firebaseEnabled) return ['cloudinary']
  // Both enabled and healthy — alternate to distribute load
  return _uploadCounter++ % 2 === 0
    ? ['cloudinary', 'firebase']
    : ['firebase', 'cloudinary']
}

// ── Upload ──────────────────────────────────────────────────────────────────
/**
 * Upload a single file to the best available provider.
 * Returns a meta object: { url, provider, ...providerSpecificFields }
 */
export async function uploadReceipt(file) {
  const order = getProviderOrder()

  if (order.length === 0) {
    throw new Error(
      'All storage providers are unavailable. Please try again later.'
    )
  }

  for (const provider of order) {
    try {
      if (provider === 'cloudinary') {
        const result = await uploadToCloudinary(file)
        _cloudinaryHealthy = true
        return {
          url: result.url,
          provider: 'cloudinary',
          publicId: result.publicId,
          resourceType: result.resourceType
        }
      } else {
        const result = await uploadToFirebaseStorage(file)
        _firebaseHealthy = true
        return {
          url: result.url,
          provider: 'firebase',
          path: result.path
        }
      }
    } catch (err) {
      console.warn(`[uploadReceipt] ${provider} upload failed:`, err.message)
      if (provider === 'cloudinary') _cloudinaryHealthy = false
      else _firebaseHealthy = false
      // Only fall through to next provider if it is also enabled in config
      const cfg = getStorageConfig()
      if (provider === 'cloudinary' && !cfg.firebase) break
      if (provider === 'firebase' && !cfg.cloudinary) break
    }
  }

  throw new Error(
    'Failed to upload receipt. Both storage providers are unavailable.'
  )
}

// ── Delete ──────────────────────────────────────────────────────────────────
/**
 * Delete a single receipt using its stored meta object.
 * Handles both Cloudinary and Firebase Storage, plus legacy meta without a
 * provider field (treated as Cloudinary for backwards compatibility).
 */
export async function deleteReceipt(meta) {
  if (!meta) return
  if (meta.provider === 'firebase') {
    await deleteFromFirebaseStorage(meta.path)
  } else {
    // 'cloudinary' or legacy records that pre-date the provider field
    if (meta.publicId) {
      await deleteFromCloudinary(meta.publicId, meta.resourceType)
    }
  }
}

// ── Cleanup helper ──────────────────────────────────────────────────────────
/**
 * Delete any receipts that were present before an update but are no longer
 * in the new set. Works across both providers.
 */
export function cleanupOldReceipts(oldMeta, newMeta) {
  if (!oldMeta || !newMeta) return
  const oldMetas = Array.isArray(oldMeta) ? oldMeta : [oldMeta]
  const newUrls = new Set(
    (Array.isArray(newMeta) ? newMeta : [newMeta]).map((m) => m.url)
  )
  oldMetas.forEach((m) => {
    if (!newUrls.has(m.url)) deleteReceipt(m)
  })
}
