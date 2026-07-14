import { createI18n } from 'vue-i18n'
import en from './locales/en'
import ur from './locales/ur'

export const SUPPORTED_LOCALES = ['en', 'ur']

// Public/guest pages get their locale from the URL (/ur/... routes), since
// that's what makes Urdu content indexable. Authenticated app routes have
// no such URL and no SEO benefit from one, so logged-in users instead get
// a saved language preference — mirrors how the `theme` localStorage key
// works in src/scripts/layout/app.js.
const LOCALE_STORAGE_KEY = 'appLocale'

export function getStoredLocale() {
  return localStorage.getItem(LOCALE_STORAGE_KEY) === 'ur' ? 'ur' : 'en'
}

export function setStoredLocale(locale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ur }
})

export default i18n
