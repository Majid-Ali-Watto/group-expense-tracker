import { useClipboard } from '@/composables'
import { showError } from '@/utils'

const { copyTextWithFeedback } = useClipboard()

/**
 * Safe markdown-to-HTML renderer.
 * Escapes HTML first (no XSS risk), then applies limited markdown patterns.
 *
 * @param {string} text
 * @returns {string}
 */
export function markdownToHtml(text) {
  if (!text) return ''
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Extract fenced code blocks as placeholders BEFORE splitting on \n
  // so internal newlines inside the block are preserved.
  const codeBlocks = []
  s = s.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`)
    return `%%CODEBLOCK_${idx}%%`
  })

  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>')

  const lines = s.split('\n')
  const out = []
  let inUl = false,
    inOl = false

  for (const line of lines) {
    if (/^%%CODEBLOCK_\d+%%$/.test(line.trim())) {
      if (inUl) {
        out.push('</ul>')
        inUl = false
      }
      if (inOl) {
        out.push('</ol>')
        inOl = false
      }
      out.push(line.trim())
      continue
    }
    const ul = line.match(/^[-*]\s+(.+)/)
    const ol = line.match(/^\d+\.\s+(.+)/)
    if (ul) {
      if (inOl) {
        out.push('</ol>')
        inOl = false
      }
      if (!inUl) {
        out.push('<ul>')
        inUl = true
      }
      out.push(`<li>${ul[1]}</li>`)
    } else if (ol) {
      if (inUl) {
        out.push('</ul>')
        inUl = false
      }
      if (!inOl) {
        out.push('<ol>')
        inOl = true
      }
      out.push(`<li>${ol[1]}</li>`)
    } else {
      if (inUl) {
        out.push('</ul>')
        inUl = false
      }
      if (inOl) {
        out.push('</ol>')
        inOl = false
      }
      out.push(line.trim() === '' ? '<br>' : `<p>${line}</p>`)
    }
  }
  if (inUl) out.push('</ul>')
  if (inOl) out.push('</ol>')

  let result = out.join('')
  codeBlocks.forEach((block, i) => {
    result = result.replace(`%%CODEBLOCK_${i}%%`, block)
  })
  return result
}

/**
 * Format an ISO date string to a human-readable date + time.
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) +
    ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

/**
 * Copy text to clipboard, show a success/error alert.
 *
 * @param {string} text
 */
export function copyText(text) {
  return copyTextWithFeedback(text, {
    successMessage: 'Copied!',
    errorMessage: 'Failed to copy.'
  })
}

/**
 * Fetch an image from a URL and trigger a browser download.
 *
 * @param {string} url
 * @param {string} filename  – without extension
 */
export async function downloadImage(url, filename) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const ext = blob.type.split('/')[1]?.split('+')[0] || 'jpg'
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${filename}.${ext}`
    a.click()
    URL.revokeObjectURL(a.href)
  } catch {
    showError('Download failed. Try opening the image in a new tab.')
  }
}

/**
 * Convert a Firebase notes object into a time-sorted array.
 *
 * @param {{ notes?: Record<string, object> }} report
 * @returns {Array<{ id: string } & object>}
 */
export function notesOf(report) {
  if (!report?.notes) return []
  return Object.entries(report.notes)
    .map(([id, n]) => ({ id, ...n }))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}
