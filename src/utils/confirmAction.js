import { ElMessageBox } from 'element-plus'

export async function confirmAction({
  message,
  title = 'Confirm',
  confirmButtonText = 'OK',
  cancelButtonText = 'Cancel',
  type = 'warning',
  ...rest
}) {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText,
      cancelButtonText,
      type,
      ...rest
    })
    return true
  } catch {
    return false
  }
}
