import { markRaw } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { confirmAction } from '@/utils/confirmAction'

export const BottomButtons = (emit) => {
  const confirmUpdate = async () => {
    const confirmed = await confirmAction({
      message: 'Are you sure you want to update this item?',
      title: 'Warning'
    })
    if (confirmed) emit('update')
  }

  const confirmDelete = async () => {
    const confirmed = await confirmAction({
      message:
        'Are you sure you want to delete this item? This action cannot be undone.',
      title: 'Danger',
      type: 'error',
      icon: markRaw(Delete)
    })
    if (confirmed) emit('delete')
  }

  const confirmDuplicate = async () => {
    const confirmed = await confirmAction({
      message: 'Save the current values as a new record?',
      title: 'Duplicate',
      confirmButtonText: 'Duplicate',
      type: 'info'
    })
    if (confirmed) emit('duplicate')
  }

  return {
    confirmUpdate,
    confirmDelete,
    confirmDuplicate
  }
}
