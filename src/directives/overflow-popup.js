import { ElMessageBox } from 'element-plus'

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, summary, [role="button"], [role="link"]'

function isOverflowing(el) {
  if (!el) return false

  return (
    el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
  )
}

function normalizeConfig(el, value) {
  if (typeof value === 'string') {
    return {
      title: 'Full Text',
      text: value
    }
  }

  return {
    title:
      value?.title || el.getAttribute('data-overflow-title') || 'Full Text',
    text: value?.text || el.getAttribute('data-overflow-text') || ''
  }
}

function refreshState(el) {
  const state = el.__overflowPopupState
  if (!state) return

  const overflowing = isOverflowing(el)
  state.isOverflowing = overflowing

  el.classList.toggle('overflow-popup-trigger', overflowing)

  if (!overflowing) {
    if (state.addedTabIndex) {
      el.removeAttribute('tabindex')
      state.addedTabIndex = false
    }
    if (state.addedRole) {
      el.removeAttribute('role')
      state.addedRole = false
    }
    return
  }

  if (!el.matches(INTERACTIVE_SELECTOR) && !el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '0')
    state.addedTabIndex = true
  }

  if (!el.hasAttribute('role')) {
    el.setAttribute('role', 'button')
    state.addedRole = true
  }
}

function openOverflowPopup(el) {
  const state = el.__overflowPopupState
  if (!state) return

  const { title, text } = normalizeConfig(el, state.value)
  const resolvedText = text || el.textContent?.trim() || ''

  if (!resolvedText) return

  ElMessageBox.alert(resolvedText, title, {
    confirmButtonText: 'Close',
    confirmButtonClass: 'el-button--default',
    autofocus: false,
    type: 'info',
    customClass: 'overflow-popup-box'
  })
}

function attachDirective(el, binding) {
  const state = {
    value: binding.value,
    isOverflowing: false,
    addedTabIndex: false,
    addedRole: false,
    handleClick: null,
    handleKeydown: null,
    resizeObserver: null
  }

  state.handleClick = (event) => {
    refreshState(el)
    if (!state.isOverflowing) return

    event.preventDefault()
    event.stopPropagation()
    openOverflowPopup(el)
  }

  state.handleKeydown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    refreshState(el)
    if (!state.isOverflowing) return

    event.preventDefault()
    event.stopPropagation()
    openOverflowPopup(el)
  }

  el.__overflowPopupState = state
  el.addEventListener('click', state.handleClick)
  el.addEventListener('keydown', state.handleKeydown)

  if (typeof ResizeObserver !== 'undefined') {
    state.resizeObserver = new ResizeObserver(() => refreshState(el))
    state.resizeObserver.observe(el)
  }

  requestAnimationFrame(() => refreshState(el))
}

function detachDirective(el) {
  const state = el.__overflowPopupState
  if (!state) return

  el.removeEventListener('click', state.handleClick)
  el.removeEventListener('keydown', state.handleKeydown)
  state.resizeObserver?.disconnect()

  el.classList.remove('overflow-popup-trigger')

  if (state.addedTabIndex) {
    el.removeAttribute('tabindex')
  }

  if (state.addedRole) {
    el.removeAttribute('role')
  }

  delete el.__overflowPopupState
}

export default {
  mounted(el, binding) {
    attachDirective(el, binding)
  },
  updated(el, binding) {
    if (!el.__overflowPopupState) {
      attachDirective(el, binding)
      return
    }

    el.__overflowPopupState.value = binding.value
    requestAnimationFrame(() => refreshState(el))
  },
  unmounted(el) {
    detachDirective(el)
  }
}
