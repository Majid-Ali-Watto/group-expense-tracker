import { ref } from 'vue'

// Singleton theme state — module scope, not inside a composable factory —
// so every caller (the header's quick-toggle, the Settings page, etc.)
// shares the exact same reactive `isDarkTheme` instead of each getting its
// own unsynced copy. Extracted from src/scripts/layout/app.js, where it used
// to live inside the `App()` factory (safe there only because `App()` is
// called exactly once, from App.vue).

// Guarded for SSG prerendering, where there is no localStorage (Node).
const savedTheme =
  typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
const isDarkTheme = ref(savedTheme === 'dark')

const THEME_PAGE_TURN_MS = 760
let themeAnimationTimeout = null

const applyClasses = (docAddCls, docRemoveCls, bodyAddCls, bodyRemoveCls) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.add(docAddCls)
  document.documentElement.classList.remove(docRemoveCls)
  document.body.classList.add(bodyAddCls)
  document.body.classList.remove(bodyRemoveCls)
}

// Apply theme immediately on load
const applyTheme = () => {
  if (isDarkTheme.value) {
    applyClasses('dark-theme', 'light-theme', 'dark-theme', 'light-theme')
  } else {
    applyClasses('light-theme', 'dark-theme', 'light-theme', 'dark-theme')
  }
}

const clearThemeAnimation = () => {
  if (themeAnimationTimeout) {
    clearTimeout(themeAnimationTimeout)
    themeAnimationTimeout = null
  }

  document.body?.classList.remove(
    'theme-page-turning',
    'theme-page-turning-to-dark',
    'theme-page-turning-to-light'
  )
}

const animateThemeTurn = (nextTheme) => {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return
  }

  const body = document.body
  if (!body) return

  clearThemeAnimation()
  void body.offsetWidth

  body.classList.add(
    'theme-page-turning',
    nextTheme === 'dark'
      ? 'theme-page-turning-to-dark'
      : 'theme-page-turning-to-light'
  )

  themeAnimationTimeout = window.setTimeout(() => {
    clearThemeAnimation()
  }, THEME_PAGE_TURN_MS)
}

// Apply theme immediately (before mount)
applyTheme()

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
  applyTheme()
  animateThemeTurn(isDarkTheme.value ? 'dark' : 'light')
}

export function useTheme() {
  return { isDarkTheme, toggleTheme, applyTheme, clearThemeAnimation }
}
