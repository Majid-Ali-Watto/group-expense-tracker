import { onUnmounted } from 'vue'

const DEFAULT_INACTIVITY_LOGOUT_MINUTES = 15
const ACTIVITY_THROTTLE_MS = 1000

const parseMinutes = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const resolveTimeoutMs = () => {
  const minutes =
    parseMinutes(import.meta.env.VITE_INACTIVITY_LOGOUT_MINUTES) ||
    DEFAULT_INACTIVITY_LOGOUT_MINUTES

  return minutes * 60_000
}

export function useInactivityLogout({ isLoggedIn, onTimeout }) {
  let inactivityTimer = null
  let lastActivityAt = 0
  let isTracking = false

  const clearInactivityTimer = () => {
    if (!inactivityTimer) return
    window.clearTimeout(inactivityTimer)
    inactivityTimer = null
  }

  const scheduleInactivityLogout = () => {
    clearInactivityTimer()
    if (!isLoggedIn.value) return

    const timeoutMs = resolveTimeoutMs()
    inactivityTimer = window.setTimeout(() => {
      clearInactivityTimer()
      onTimeout?.(timeoutMs)
    }, timeoutMs)
  }

  const markActivity = (force = false) => {
    if (!isLoggedIn.value) return

    const now = Date.now()
    if (!force && now - lastActivityAt < ACTIVITY_THROTTLE_MS) return

    lastActivityAt = now
    scheduleInactivityLogout()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      markActivity(true)
    }
  }

  const startInactivityTracking = () => {
    if (typeof window === 'undefined' || isTracking) return

    isTracking = true
    window.addEventListener('pointerdown', markActivity, { passive: true })
    window.addEventListener('mousemove', markActivity, { passive: true })
    window.addEventListener('keydown', markActivity)
    window.addEventListener('touchstart', markActivity, { passive: true })
    window.addEventListener('scroll', markActivity, {
      passive: true,
      capture: true
    })
    window.addEventListener('focus', markActivity)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    markActivity(true)
  }

  const stopInactivityTracking = () => {
    if (!isTracking || typeof window === 'undefined') return

    isTracking = false
    clearInactivityTimer()
    lastActivityAt = 0
    window.removeEventListener('pointerdown', markActivity)
    window.removeEventListener('mousemove', markActivity)
    window.removeEventListener('keydown', markActivity)
    window.removeEventListener('touchstart', markActivity)
    window.removeEventListener('scroll', markActivity, true)
    window.removeEventListener('focus', markActivity)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }

  onUnmounted(stopInactivityTracking)

  return {
    getInactivityTimeoutMs: resolveTimeoutMs,
    resetInactivityTimer: () => markActivity(true),
    startInactivityTracking,
    stopInactivityTracking
  }
}
