// Default cap for receipt/attachment image uploads (Cloudinary + Firebase
// Storage). Enforced at the provider-upload functions themselves
// (see src/utils/cloudinaryUpload.js, src/utils/firebaseStorageUpload.js)
// so every caller is protected even if it forgets to pre-validate.
export const MAX_RECEIPT_FILE_SIZE_BYTES = 1024 * 1024 // 1MB
