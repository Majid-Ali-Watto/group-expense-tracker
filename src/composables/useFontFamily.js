import { ref } from 'vue'

// Singleton font-family preferences — same module-scope-singleton shape as
// useTheme.js, so the Settings page and any other reader always see the
// same value. Two independent preferences, applied via two CSS variables
// (see the `html[lang='ur']` rules in src/main.css): the base font (used
// everywhere) and the Urdu font (used only when the active locale is Urdu,
// falling back to the base font otherwise) — each is picked separately in
// Settings, ahead of ever switching locale.
//
// Each font's Google Fonts stylesheet is loaded on demand (see
// ensureFontLinkLoaded below), not all up front — with 6 base options and 3
// Urdu options, eagerly `@import`-ing all 9 in main.css would cost every
// visitor 9 stylesheet round-trips just to use the 2 they actually picked.
// The matching pre-mount injection lives in index.html (keep both in sync).
export const FONT_OPTIONS = [
  {
    id: 'poppins',
    label: 'Poppins',
    stack: "'Poppins', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'inter',
    label: 'Inter',
    stack: "'Inter', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'roboto',
    label: 'Roboto',
    stack: "'Roboto', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    stack: "'Open Sans', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'lato',
    label: 'Lato',
    stack: "'Lato', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap'
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    stack: "'Montserrat', sans-serif",
    href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap'
  }
]

// lineHeight: Nastaliq's diagonal, stacked strokes need far more vertical
// room than a Naskh-style Arabic script does — see the comment above the
// `html[lang='ur']` rules in src/main.css.
export const URDU_FONT_OPTIONS = [
  {
    id: 'noto-nastaliq-urdu',
    label: 'Noto Nastaliq Urdu',
    stack: "'Noto Nastaliq Urdu', sans-serif",
    lineHeight: '2',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;500;600;700&display=swap'
  },
  {
    id: 'gulzar',
    label: 'Gulzar',
    stack: "'Gulzar', sans-serif",
    lineHeight: '1.8',
    href: 'https://fonts.googleapis.com/css2?family=Gulzar&display=swap'
  },
  {
    id: 'noto-naskh-arabic',
    label: 'Noto Naskh Arabic',
    stack: "'Noto Naskh Arabic', sans-serif",
    lineHeight: '1.6',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap'
  }
]

// Injects the Google Fonts stylesheet for one font, once. Keyed by
// `data-font-id` so a font selected both by the pre-mount script in
// index.html (before this module even loads) and by this module's own
// eager `apply()` call below never gets a duplicate <link>.
function ensureFontLinkLoaded(id, href) {
  if (typeof document === 'undefined' || !href) return
  if (document.head.querySelector(`link[data-font-id="${id}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.fontId = id
  document.head.appendChild(link)
}

// Builds one localStorage-backed, CSS-variable-driven font preference.
// Both the base and Urdu preferences share this exact shape; `lineHeightVar`
// is only used by the Urdu preference (its options carry a `lineHeight`).
function createFontPreference({
  storageKey,
  cssVar,
  lineHeightVar,
  options,
  defaultId
}) {
  function isValidId(id) {
    return options.some((option) => option.id === id)
  }

  function getStoredId() {
    if (typeof localStorage === 'undefined') return defaultId
    const stored = localStorage.getItem(storageKey)
    return isValidId(stored) ? stored : defaultId
  }

  function optionFor(id) {
    return options.find((option) => option.id === id)
  }

  const fontId = ref(getStoredId())

  // Apply immediately on load, same timing as useTheme's applyTheme().
  const apply = () => {
    if (typeof document === 'undefined') return
    const option = optionFor(fontId.value)
    document.documentElement.style.setProperty(cssVar, option?.stack)
    if (lineHeightVar) {
      document.documentElement.style.setProperty(
        lineHeightVar,
        option?.lineHeight
      )
    }
    ensureFontLinkLoaded(option?.id, option?.href)
  }

  apply()

  function setFontId(id) {
    if (!isValidId(id)) return
    fontId.value = id
    localStorage.setItem(storageKey, id)
    apply()
  }

  return { fontId, setFontId }
}

const basePreference = createFontPreference({
  storageKey: 'fontFamily',
  cssVar: '--font-family-base',
  options: FONT_OPTIONS,
  defaultId: 'poppins'
})

const urduPreference = createFontPreference({
  storageKey: 'urduFontFamily',
  cssVar: '--font-family-urdu',
  lineHeightVar: '--font-line-height-urdu',
  options: URDU_FONT_OPTIONS,
  defaultId: 'noto-nastaliq-urdu'
})

// Settings page only: loads every option's stylesheet so each can be
// previewed in its own font before picking it. Deliberately not called
// anywhere else — previewing all 9 fonts is worth the extra requests only
// on the page where the user is actively choosing one.
export function preloadAllFontOptions() {
  ;[...FONT_OPTIONS, ...URDU_FONT_OPTIONS].forEach((option) =>
    ensureFontLinkLoaded(option.id, option.href)
  )
}

export function useFontFamily() {
  return {
    fontFamily: basePreference.fontId,
    setFontFamily: basePreference.setFontId,
    FONT_OPTIONS,
    urduFontFamily: urduPreference.fontId,
    setUrduFontFamily: urduPreference.setFontId,
    URDU_FONT_OPTIONS
  }
}
