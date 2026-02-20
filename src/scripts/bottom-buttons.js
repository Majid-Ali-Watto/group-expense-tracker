import { markRaw } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

export const BottomButtons = (emit) => {
  const confirmUpdate = async () => {
    try {
      await ElMessageBox.confirm(
        'Are you sure you want to update this item?',
        'Warning',
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )
      emit('update')
    } catch (error) {
      console.error(error)
      if (error !== 'cancel') {
        console.error('Update action cancelled')
      }
    }
  }

  const confirmDelete = async () => {
    try {
      await ElMessageBox.confirm(
        'Are you sure you want to delete this item? This action cannot be undone.',
        'Danger',
        {
          confirmButtonText: 'OK',
          cancelButtonText: 'Cancel',
          type: 'error',
          icon: markRaw(Delete)
        }
      )
      emit('delete')
    } catch (error) {
      console.error(error)
      if (error !== 'cancel') {
        console.error('Delete action cancelled')
      }
    }
  }

  return {
    confirmUpdate,
    confirmDelete
  }
}
