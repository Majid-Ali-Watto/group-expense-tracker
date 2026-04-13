import { showError, showSuccess } from '@/utils/showAlerts'

export function useClipboard() {
  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      const copied = document.execCommand('copy')
      if (!copied) throw new Error('Copy command failed')
      return true
    } finally {
      document.body.removeChild(textarea)
    }
  }

  async function copyTextWithFeedback(
    text,
    {
      successMessage = 'Copied!',
      errorMessage = 'Failed to copy.',
      promptLabel = ''
    } = {}
  ) {
    try {
      await copyText(text)
      if (successMessage) showSuccess(successMessage)
      return true
    } catch {
      if (promptLabel) window.prompt(promptLabel, text)
      if (errorMessage) showError(errorMessage)
      return false
    }
  }

  return {
    copyText,
    copyTextWithFeedback
  }
}
