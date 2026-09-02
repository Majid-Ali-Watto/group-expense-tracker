import { getApiAuthHeaders } from './apiAuth'
import { generateUUID } from './uuid'
import {
  MAX_RECEIPT_FILE_SIZE_BYTES,
  LIVE_INTEGRATIONS_ENABLED
} from '@/constants'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_BASE = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const API_KEY = import.meta.env.VITE_X_API_KEY || ''

// Dev-mode stand-in for a real Cloudinary upload — no signature round-trip,
// no real network upload, just a plausible-looking link so the rest of the
// UI (previews, saved receipt metadata, etc.) has something to work with.
// picsum.photos is a real public placeholder-image service, so the link
// actually resolves to an image instead of dead-ending.
function mockUploadResult() {
  const seed = generateUUID()
  return {
    url: `https://picsum.photos/seed/${seed}/600/400`,
    publicId: `dev-mock/${seed}`,
    resourceType: 'image'
  }
}

async function getUploadSignature() {
  if (!API_BASE) {
    throw new Error('Upload API is not configured')
  }

  const headers = await getApiAuthHeaders({
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  })

  const res = await fetch(`${API_BASE}/cloudinary/sign-upload`, {
    method: 'POST',
    headers
  })

  if (!res.ok) {
    throw new Error('Cloudinary upload signing failed')
  }

  return res.json()
}

export async function uploadToCloudinary(
  file,
  { maxSizeBytes = MAX_RECEIPT_FILE_SIZE_BYTES } = {}
) {
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`
    )
  }

  // Outside prod (or when explicitly overridden — see
  // src/constants/liveIntegrations.js), skip Cloudinary entirely: no
  // signature request, no real upload, just a mock link. Keeps local/dev
  // testing from burning real Cloudinary quota.
  if (!LIVE_INTEGRATIONS_ENABLED) {
    return mockUploadResult()
  }

  const signed = await getUploadSignature()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signed.apiKey)
  formData.append('timestamp', String(signed.timestamp))
  // Must match exactly what the server signed, or Cloudinary rejects the
  // signature — this is what makes the format restriction actually enforced
  // server-side rather than just a client-side convention.
  formData.append('allowed_formats', signed.allowedFormats)
  formData.append('signature', signed.signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signed.cloudName || CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type
  }
}

// Fire-and-forget — does not block the caller.
// Signing is done server-side so the Cloudinary API secret is never in the bundle.
export async function deleteFromCloudinary(
  publicId,
  resourceType = 'image',
  context = null
) {
  // A dev-mock publicId (see mockUploadResult above) never existed on
  // Cloudinary — nothing to delete, and no reason to touch the real
  // backend/Cloudinary for it.
  if (!publicId || !API_BASE || !LIVE_INTEGRATIONS_ENABLED) return

  try {
    const headers = await getApiAuthHeaders({
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    })
    await fetch(`${API_BASE}/cloudinary/delete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ publicId, resourceType, context })
    })
  } catch {
    // best-effort — a failed delete is not fatal
  }
}

// Deletes Cloudinary files that existed before an update but are no longer present after
export function cleanupOldReceipts(oldMeta, newMeta, context = null) {
  if (!oldMeta || !newMeta) return
  const oldMetas = Array.isArray(oldMeta) ? oldMeta : [oldMeta]
  const newUrls = new Set(
    (Array.isArray(newMeta) ? newMeta : [newMeta]).map((m) => m.url)
  )
  oldMetas.forEach((m) => {
    if (!newUrls.has(m.url))
      deleteFromCloudinary(m.publicId, m.resourceType, context)
  })
}
