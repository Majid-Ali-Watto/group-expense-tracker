// Curated currency list + ISO2 country → ISO 4217 currency lookup.
// Covers the countries vue-tel-input/libphonenumber commonly surface
// (see GenericMobileInput.vue's preferredCountries and phone.js). Pure
// data — extend either list as new countries/currencies come up.

export const CURRENCY_OPTIONS = [
  { code: 'PKR', symbol: 'Rs', label: 'Pakistani Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', label: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira' },
  { code: 'QAR', symbol: 'ر.ق', label: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', label: 'Kuwaiti Dinar' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
  { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc' }
]

export const DEFAULT_CURRENCY = 'PKR'

// ISO2 country code → ISO 4217 currency code.
export const COUNTRY_TO_CURRENCY = {
  PK: 'PKR',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  IN: 'INR',
  BD: 'BDT',
  AE: 'AED',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  CN: 'CNY',
  JP: 'JPY',
  SG: 'SGD',
  MY: 'MYR',
  TR: 'TRY',
  ZA: 'ZAR',
  CH: 'CHF',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  BE: 'EUR',
  FI: 'EUR',
  GR: 'EUR'
}

export function currencyForCountry(iso2) {
  return (
    COUNTRY_TO_CURRENCY[String(iso2 || '').toUpperCase()] || DEFAULT_CURRENCY
  )
}

export function currencyOption(code) {
  return CURRENCY_OPTIONS.find((option) => option.code === code)
}
