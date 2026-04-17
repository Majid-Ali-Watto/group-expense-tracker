import { ref } from 'vue'
import { extractReceiptText, showError } from '@/utils'

/**
 * Composable for OCR-based receipt auto-fill.
 *
 * @param {Object} options
 * @param {import('vue').Ref} options.receiptFiles  - reactive ref to selected File objects
 * @param {import('vue').Ref} options.existingReceiptUrls - reactive ref to already-uploaded URLs
 * @param {string} options.type - form type passed to the AI structuring endpoint
 *   Supported values: 'shared-expense' | 'shared-loan' | 'personal-expense' | 'personal-loan'
 *
 * The API at /structure-ocr receives { receipts: string[], type } and returns a
 * plain object whose shape depends on `type`:
 *
 *  shared-expense →
 *    { amount, description, category, date, location,
 *      splitItems: [{ description, amount }] }
 *
 *  shared-loan / personal-loan →
 *    { amount, description, category, date }
 *
 *  personal-expense →
 *    { amount, description, category, date, location }
 *
 * Returns null on error so callers can guard with `if (!data) return`.
 */
export function useReceiptOcr({ receiptFiles, existingReceiptUrls, type }) {
  const receiptExtracting = ref(false)

  async function extractAndStructure(jsonShape = '{}') {
    const sources = receiptFiles.value?.length
      ? receiptFiles.value
      : existingReceiptUrls.value

    if (!sources?.length) {
      showError('Select a receipt first to extract text.')
      return null
    }

    try {
      receiptExtracting.value = true

      const extractedResults = await extractReceiptText(sources)

      const API_BASE_URL = import.meta.env.VITE_NODE_BE_API_URL?.trim()
      const response = await fetch(`${API_BASE_URL}/structure-ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_X_API_KEY || ''
        },
        body: JSON.stringify({
          receipts: extractedResults.map((r) => r.text),
          type,
          jsonShape
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Receipt OCR extraction failed:', error)
      showError('Failed to extract text from the receipt. Please try again.')
      return null
    } finally {
      receiptExtracting.value = false
    }
  }

  return { receiptExtracting, extractAndStructure }
}
