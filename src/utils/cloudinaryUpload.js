const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET

async function sha1(message) {
  const buf = new TextEncoder().encode(message)
  const hashBuf = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
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

// Fire-and-forget — does not block the caller
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!publicId || !API_KEY || !API_SECRET) return

  const timestamp = Math.floor(Date.now() / 1000)
  const paramStr = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = await sha1(paramStr + API_SECRET)

  const formData = new FormData()
  formData.append('public_id', publicId)
  formData.append('timestamp', String(timestamp))
  formData.append('api_key', API_KEY)
  formData.append('signature', signature)

  await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`,
    { method: 'POST', body: formData }
  ).catch(() => {})
}

// Deletes Cloudinary files that existed before an update but are no longer present after
export function cleanupOldReceipts(oldMeta, newMeta) {
  if (!oldMeta || !newMeta) return
  const oldMetas = Array.isArray(oldMeta) ? oldMeta : [oldMeta]
  const newUrls = new Set(
    (Array.isArray(newMeta) ? newMeta : [newMeta]).map((m) => m.url)
  )
  oldMetas.forEach((m) => {
    if (!newUrls.has(m.url)) deleteFromCloudinary(m.publicId, m.resourceType)
  })
}
