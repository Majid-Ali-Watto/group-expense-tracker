import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { app } from '@/firebase'
import { MAX_RECEIPT_FILE_SIZE_BYTES } from '@/constants'

const storage = getStorage(app)

export async function uploadToFirebaseStorage(
  file,
  { maxSizeBytes = MAX_RECEIPT_FILE_SIZE_BYTES } = {}
) {
  if (file.size > maxSizeBytes) {
    throw new Error(
      `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`
    )
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `receipts/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`
  const fileRef = storageRef(storage, path)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  return { url, path }
}

// Fire-and-forget — does not block the caller
export async function deleteFromFirebaseStorage(path) {
  if (!path) return
  const fileRef = storageRef(storage, path)
  await deleteObject(fileRef).catch(() => {})
}
