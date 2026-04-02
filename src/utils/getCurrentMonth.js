const pad = (value) => String(value).padStart(2, '0')

const getCurrentMonth = () => {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function getCurrentDateInputValue() {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function normalizeDateInputValue(date) {
  if (!date) return getCurrentDateInputValue()

  const isoMatch = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`

  const slashMatch = String(date).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    return `${slashMatch[3]}-${pad(slashMatch[2])}-${pad(slashMatch[1])}`
  }

  const parsed = new Date(date)
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`
  }

  return getCurrentDateInputValue()
}

export function formatDateForStorage(date, locale = 'en-PK') {
  const normalized = normalizeDateInputValue(date)
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(locale)
}

export function dateToMonthNode(date) {
  if (!date) return ''
  // Handle ISO-style format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  const isoMatch = String(date).match(/^(\d{4})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`
  // Handle DD/MM/YYYY or DD/MM/YYYY, HH:MM
  return date
    .split(',')[0]
    .split('/')
    .reverse()
    .filter((v, i, a) => i != a.length - 1)
    .join('-')
}
export default getCurrentMonth
