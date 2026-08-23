import { parsePhoneNumberFromString } from 'libphonenumber-js'

export const DEFAULT_PHONE_COUNTRY = 'PK'
const PHONE_LIKE_PATTERN = /^[+\d\s().-]+$/

export function normalizePhoneNumber(
  value,
  defaultCountry = DEFAULT_PHONE_COUNTRY
) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const phone = parsePhoneNumberFromString(raw, defaultCountry)
  if (phone?.isValid()) return phone.number

  return raw
}

export function isValidPhoneNumber(
  value,
  defaultCountry = DEFAULT_PHONE_COUNTRY
) {
  const raw = String(value || '').trim()
  if (!raw) return false

  return parsePhoneNumberFromString(raw, defaultCountry)?.isValid() || false
}

export function getPhoneNumberVariants(
  value,
  defaultCountry = DEFAULT_PHONE_COUNTRY
) {
  const raw = String(value || '').trim()
  const variants = new Set()
  if (!raw) return variants

  variants.add(raw)

  const compact = PHONE_LIKE_PATTERN.test(raw) ? raw.replace(/[^\d+]/g, '') : ''
  if (compact && compact !== raw) variants.add(compact)

  const phone = parsePhoneNumberFromString(raw, defaultCountry)
  if (phone) {
    variants.add(phone.number)
    if (phone.country === 'PK' && phone.nationalNumber) {
      variants.add(`0${phone.nationalNumber}`)
    }
  }

  return variants
}

export function phoneNumbersMatch(a, b) {
  const left = getPhoneNumberVariants(a)
  const right = getPhoneNumberVariants(b)

  return [...left].some((variant) => right.has(variant))
}
