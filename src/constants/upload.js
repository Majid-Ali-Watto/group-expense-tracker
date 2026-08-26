// Default cap for receipt/attachment image uploads. Enforced at the provider
// upload function so every caller is protected even if it forgets to
// pre-validate.
export const MAX_RECEIPT_FILE_SIZE_BYTES = 1024 * 1024 // 1MB
