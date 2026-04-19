function normalizeReceiptSources(sources) {
  if (!sources) return []

  if (Array.isArray(sources)) {
    return sources.filter(Boolean)
  }

  return [sources].filter(Boolean)
}

function getReceiptSourceName(source, index) {
  if (typeof source === 'string') {
    return `Receipt ${index + 1}`
  }

  return source?.name || `Receipt ${index + 1}`
}

export async function extractReceiptText(sources, { language = 'eng' } = {}) {
  const normalizedSources = normalizeReceiptSources(sources)

  if (!normalizedSources.length) {
    return []
  }

  const tesseractModule = await import('tesseract.js')
  const tesseract = tesseractModule.default || tesseractModule

  if (typeof tesseract.setLogging === 'function') {
    tesseract.setLogging(false)
  }

  return Promise.all(
    normalizedSources.map(async (source, index) => {
      const result = await tesseract.recognize(source, language)

      return {
        name: getReceiptSourceName(source, index),
        text: result?.data?.text?.trim() || ''
      }
    })
  )
}
