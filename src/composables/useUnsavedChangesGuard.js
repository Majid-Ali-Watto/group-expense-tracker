import { onMounted, onUnmounted, computed, unref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessageBox } from 'element-plus'

export function useUnsavedChangesGuard(isDirty, options = {}) {
  const {
    title = 'Unsaved Changes',
    message = 'You have unsaved changes. If you leave now, your entered data will be lost.',
    confirmButtonText = 'Discard',
    cancelButtonText = 'Stay'
  } = options

  const hasUnsavedChanges = computed(() => !!unref(isDirty))

  async function confirmDiscardChanges() {
    if (!hasUnsavedChanges.value) return true

    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText,
        cancelButtonText,
        type: 'warning'
      })
      return true
    } catch {
      return false
    }
  }

  function handleBeforeUnload(event) {
    if (!hasUnsavedChanges.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeRouteLeave(async () => {
    return await confirmDiscardChanges()
  })

  return {
    hasUnsavedChanges,
    confirmDiscardChanges
  }
}
