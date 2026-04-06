export function useRateLimit() {
  // ── Login rate limiting ────────────────────────────────────────────────────
  const RATE_LIMIT_KEY = '_login_rl'
  const MAX_ATTEMPTS = 5
  const LOCK_DURATION = 15 * 60 * 1000 // 15 minutes

  function getRateLimitData() {
    try {
      return JSON.parse(
        localStorage.getItem(RATE_LIMIT_KEY) || '{"count":0,"lockedAt":null}'
      )
    } catch {
      return { count: 0, lockedAt: null }
    }
  }

  function isLoginLocked() {
    const { count, lockedAt } = getRateLimitData()
    if (count >= MAX_ATTEMPTS && lockedAt) {
      const remaining = LOCK_DURATION - (Date.now() - lockedAt)
      if (remaining > 0) return Math.ceil(remaining / 60000) // minutes remaining
      localStorage.removeItem(RATE_LIMIT_KEY) // lock expired, clear it
    }
    return false
  }

  function recordFailedAttempt() {
    const data = getRateLimitData()
    const count = data.count + 1
    localStorage.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({
        count,
        lockedAt: count >= MAX_ATTEMPTS ? Date.now() : data.lockedAt
      })
    )
  }

  function clearLoginAttempts() {
    localStorage.removeItem(RATE_LIMIT_KEY)
  }

  return {
    MAX_ATTEMPTS,
    isLoginLocked,
    recordFailedAttempt,
    clearLoginAttempts,
    getRateLimitData
  }
}
