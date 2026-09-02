// Currency conversion, backed by the exchange-rate snapshot
// kharcafy-node-be's cron job refreshes into `configs/exchange-rates`
// (see useAppConfig.js's getExchangeRatesConfig). Rates are USD-based;
// converting between any two non-USD currencies goes via USD.

import { computed } from 'vue'
import { getExchangeRatesConfig } from '@/composables/useAppConfig'
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  COUNTRY_TO_CURRENCY,
  currencyForCountry,
  currencyOption
} from '@/constants/currencies'

// Rate to convert 1 unit of `code` into the table's base currency (USD).
function rateToBase(code, rates, base) {
  if (code === base) return 1
  const rate = rates[code]
  return typeof rate === 'number' && rate > 0 ? rate : null
}

/**
 * Rate to multiply an amount in `fromCode` by to get the equivalent in
 * `toCode`, or null if either currency isn't in the current rate table
 * (conversion unavailable — callers should fall back to storing the
 * entered amount unconverted rather than guessing a rate).
 */
export function getExchangeRate(fromCode, toCode) {
  if (fromCode === toCode) return 1

  const { base, rates } = getExchangeRatesConfig()
  const fromPerBase = rateToBase(fromCode, rates, base)
  const toPerBase = rateToBase(toCode, rates, base)
  if (!fromPerBase || !toPerBase) return null

  // amount(from) / fromPerBase = amount(base); amount(base) * toPerBase = amount(to)
  return toPerBase / fromPerBase
}

/**
 * Converts `amount` from `fromCode` to `toCode` using the current rate
 * snapshot. Returns null (rather than the original amount) when the rate
 * isn't available, so callers can't silently store a wrong number.
 */
export function convertCurrency(amount, fromCode, toCode) {
  const rate = getExchangeRate(fromCode, toCode)
  if (rate === null) return null
  return amount * rate
}

// kharcafy-node-be's cron job pulls its rate table straight from an
// open-data FX API (~166 currencies as of writing) — CURRENCY_OPTIONS only
// hand-curates symbol/label metadata for 20 of those. describeCurrency()
// fills in the rest via the runtime's own ICU data (Intl.DisplayNames for
// the name, Intl.NumberFormat's currencyDisplay for the symbol) so every
// currency the rate table actually covers is usable, not just the curated
// subset. Falls back to the bare code if the runtime doesn't recognize it
// (a genuinely invalid/unsupported code, or missing full ICU data).
const currencyNameFormatter = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' })
  } catch {
    return null
  }
})()

// Intl.NumberFormat construction isn't free (same reasoning as
// formatAmount.js's own cache) and describeCurrency() runs across the
// snapshot's ~166 codes every time the rate table reloads — cache each
// code's result rather than rebuilding it.
const describedCurrencyCache = new Map()

function describeCurrency(code) {
  if (describedCurrencyCache.has(code)) return describedCurrencyCache.get(code)

  const curated = currencyOption(code)
  let result = curated

  if (!result) {
    let label = code
    try {
      label = currencyNameFormatter?.of(code) || code
    } catch {
      // Unrecognized code — keep the bare code as the label.
    }

    let symbol = code
    try {
      const parts = new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol'
      }).formatToParts(0)
      symbol = parts.find((part) => part.type === 'currency')?.value || code
    } catch {
      // Unrecognized code — keep the bare code as the symbol.
    }

    result = { code, symbol, label }
  }

  describedCurrencyCache.set(code, result)
  return result
}

// Every currency the current exchange-rate snapshot can actually convert
// (every key in `rates`, plus the snapshot's own base currency, which never
// appears as a `rates` key — it's implicitly rate 1) — not just the 20
// curated CURRENCY_OPTIONS entries. Picking one of these guarantees
// getExchangeRate()/convertCurrency() won't come back null later. PKR
// (the app's default) is pinned first, the rest sorted alphabetically.
// Falls back to the curated list while the snapshot hasn't loaded yet (or
// is empty), rather than showing no options.
const availableCurrencyOptions = computed(() => {
  const { base, rates } = getExchangeRatesConfig()
  const codes = new Set(Object.keys(rates))
  if (base) codes.add(base)

  if (codes.size === 0) return CURRENCY_OPTIONS

  codes.delete(DEFAULT_CURRENCY)
  return [
    describeCurrency(DEFAULT_CURRENCY),
    ...[...codes].sort().map(describeCurrency)
  ]
})

// Same list, but guarantees `code` stays in it even if the live snapshot no
// longer covers it — for a dropdown editing a value that was already saved
// (a group's currency, or a past expense/loan's), so re-opening the form
// doesn't silently blank out what's actually stored just because a rate
// went missing after the fact.
function currencyOptionsIncluding(code) {
  const list = availableCurrencyOptions.value
  if (!code || list.some((option) => option.code === code)) return list
  return [...list, describeCurrency(code)]
}

// Whether `code` is one of the currencies the live snapshot can actually
// convert — the same membership `availableCurrencyOptions` is built from.
// Use this instead of `currencyOption()` to validate a user-submitted
// currency: `currencyOption()` only recognizes the 20 curated codes and
// would reject every other currency the dropdown now legitimately offers.
function isAvailableCurrency(code) {
  return availableCurrencyOptions.value.some((option) => option.code === code)
}

export function useCurrency() {
  return {
    CURRENCY_OPTIONS,
    availableCurrencyOptions,
    currencyOptionsIncluding,
    isAvailableCurrency,
    DEFAULT_CURRENCY,
    COUNTRY_TO_CURRENCY,
    currencyForCountry,
    currencyOption,
    getExchangeRate,
    convertCurrency,
    ratesFetchedAt: () => getExchangeRatesConfig().fetchedAt
  }
}
