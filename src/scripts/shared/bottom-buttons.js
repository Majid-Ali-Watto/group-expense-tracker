import { markRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import { Delete } from '@element-plus/icons-vue'
import { confirmAction } from '@/utils/confirmAction'

export const BottomButtons = (emit) => {
  const { t } = useI18n()

  const confirmUpdate = async () => {
    const confirmed = await confirmAction({
      message: t('shared.confirmUpdateMessage'),
      title: t('common.warning')
    })
    if (confirmed) emit('update')
  }

  const confirmDelete = async () => {
    const confirmed = await confirmAction({
      message: t('shared.confirmDeleteMessage'),
      title: t('shared.dangerTitle'),
      type: 'error',
      icon: markRaw(Delete)
    })
    if (confirmed) emit('delete')
  }

  const confirmDuplicate = async () => {
    const confirmed = await confirmAction({
      message: t('shared.confirmDuplicateMessage'),
      title: t('common.duplicate'),
      confirmButtonText: t('common.duplicate'),
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
