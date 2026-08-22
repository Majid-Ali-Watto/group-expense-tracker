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

// Guarded for SSG prerendering, where there is no localStorage (Node) —
// mirrors the hasSession() guard in src/router/index.js.
function hasLocalStorage() {
  return typeof localStorage !== 'undefined'
}

export function getStoredLocale() {
  if (!hasLocalStorage()) return 'en'
  return localStorage.getItem(LOCALE_STORAGE_KEY) === 'ur' ? 'ur' : 'en'
}

export function setStoredLocale(locale) {
  if (!hasLocalStorage()) return
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

let activeI18n = null

export function createAppI18n(locale = 'en') {
  activeI18n = createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, ur }
  })

  return activeI18n
}

function getActiveI18n() {
  if (!activeI18n) {
    activeI18n = createAppI18n()
  }

  return activeI18n
}

// Some non-component helpers translate outside `setup()`. Keep their default
// import bound to the current app i18n without forcing the app itself to use a
// shared singleton during SSG.
const i18n = new Proxy(
  {},
  {
    get(_target, property) {
      return getActiveI18n()[property]
    }
  }
)

export default i18n
