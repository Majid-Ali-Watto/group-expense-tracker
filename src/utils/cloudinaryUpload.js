import { getApiAuthHeaders } from './apiAuth'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const API_BASE = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const API_KEY = import.meta.env.VITE_X_API_KEY || ''

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

export async function uploadToCloudinary(file) {
  const signed = await getUploadSignature()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', signed.apiKey)
  formData.append('timestamp', String(signed.timestamp))
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
  if (!publicId || !API_BASE) return

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
