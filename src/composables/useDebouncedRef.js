import { customRef, onScopeDispose } from 'vue'

export function useDebouncedRef(initialValue = '', delay = 300) {
  let value = initialValue
  let timeoutId = null

  onScopeDispose(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    }
  }))
}
