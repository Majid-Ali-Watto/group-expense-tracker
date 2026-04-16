import { showError, showSuccess } from '@/utils/showAlerts'
import { useClipboard } from './useClipboard'

export function useShare() {
  const { copyText } = useClipboard()

  async function share(
    payload,
    {
      copySuccessMessage = 'Link copied to clipboard!',
      manualPromptLabel = 'Copy this link:',
      manualPromptErrorMessage = 'Native share is unavailable, so the link was opened for manual copy.'
    } = {}
  ) {
    try {
      if (navigator.share) {
        await navigator.share(payload)
        return true
      }
    } catch (error) {
      if (error?.name === 'AbortError') return false
    }

    try {
      await copyText(payload?.url || '')
      if (copySuccessMessage) showSuccess(copySuccessMessage)
      return true
    } catch {
      if (manualPromptLabel)
        window.prompt(manualPromptLabel, payload?.url || '')
      if (manualPromptErrorMessage) showError(manualPromptErrorMessage)
      return false
    }
  }

  return { share }
}
