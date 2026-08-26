// Currency-aware amount formatter. Provided app-wide as `formatAmount` via
// `inject('formatAmount')` (see main.js) — callers pass the currency that
// applies to whatever they're rendering (a group's currency for shared
// expenses/loans, the active user's personal currency otherwise), falling
// back to PKR (the app's original, still-most-common currency) if omitted.
//
// Intl.NumberFormat construction isn't free, so formatters are cached per
// currency code rather than built fresh on every call.
const DEFAULT_CURRENCY = 'PKR'
const formatterCache = new Map()

function getFormatter(currencyCode) {
  const code = currencyCode || DEFAULT_CURRENCY
  if (formatterCache.has(code)) return formatterCache.get(code)

  let formatter
  try {
    formatter = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } catch {
    // Unknown/invalid ISO 4217 code — fall back to PKR rather than throwing
    // mid-render over a bad currency value.
    formatter = getFormatter(DEFAULT_CURRENCY)
  }

  formatterCache.set(code, formatter)
  return formatter
}

export function formatAmount(amount, currencyCode = DEFAULT_CURRENCY) {
  return getFormatter(currencyCode).format(amount)
}

// Plain (no currency symbol) 2-decimal number formatting, for spots that
// already state the currency separately in the surrounding text — e.g.
// "Will be converted to {amount} {currency} using today's rate."
let plainNumberFormatter
export function formatPlainNumber(amount) {
  plainNumberFormatter ??= new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return plainNumberFormatter.format(amount)
}
