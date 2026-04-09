import { onUnmounted } from 'vue'

export function useLoadingTimeout(loadedRefs, timeoutMs = 8000) {
  let loadingTimeout = null

  const clearLoadingTimeout = () => {
    if (!loadingTimeout) return
    clearTimeout(loadingTimeout)
    loadingTimeout = null
  }

  const startLoadingTimeout = () => {
    clearLoadingTimeout()
    loadingTimeout = setTimeout(() => {
      loadedRefs.forEach((loadedRef) => {
        loadedRef.value = true
      })
    }, timeoutMs)
  }

  onUnmounted(clearLoadingTimeout)

  return {
    startLoadingTimeout,
    clearLoadingTimeout
  }
}
