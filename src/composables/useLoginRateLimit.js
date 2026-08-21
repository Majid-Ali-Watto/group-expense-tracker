import { getApiAuthHeaders } from '@/utils'

const API_BASE = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const API_KEY = import.meta.env.VITE_X_API_KEY || ''

async function hashEmail(email) {
  const encoded = new TextEncoder().encode(email.trim().toLowerCase())
  const buffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function callApi(action, hash) {
  if (!API_BASE) return null
  try {
    const headers =
      action === 'clear'
        ? await getApiAuthHeaders({
            'Content-Type': 'application/json',
            'x-api-key': API_KEY
          })
        : { 'Content-Type': 'application/json', 'x-api-key': API_KEY }

    const res = await fetch(`${API_BASE}/login-attempt/${action}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ h: hash })
    })
    if (!res.ok || res.status === 204) return null
    return await res.json()
  } catch {
    return null // fail open — never block a login attempt if the backend is unreachable
  }
}

export function useRateLimit() {
  const MAX_ATTEMPTS = 5

  async function isLoginLocked(email) {
    if (!email) return false
    try {
      const h = await hashEmail(email)
      const result = await callApi('check', h)
      if (!result) return false
      return result.locked ? (result.minutesLeft ?? 1) : false
    } catch {
      return false
    }
  }

  // Returns { attemptsLeft, locked, minutesLeft } so the caller
  // can display the remaining attempts without a second round-trip.
  async function recordFailedAttempt(email) {
    if (!email) return { attemptsLeft: MAX_ATTEMPTS, locked: false, minutesLeft: null }
    try {
      const h = await hashEmail(email)
      const result = await callApi('record', h)
      return result ?? { attemptsLeft: MAX_ATTEMPTS, locked: false, minutesLeft: null }
    } catch {
      return { attemptsLeft: MAX_ATTEMPTS, locked: false, minutesLeft: null }
    }
  }

  async function clearLoginAttempts(email) {
    if (!email) return
    try {
      const h = await hashEmail(email)
      await callApi('clear', h)
    } catch {
      // best-effort cleanup
    }
  }

  return {
    MAX_ATTEMPTS,
    isLoginLocked,
    recordFailedAttempt,
    clearLoginAttempts
  }
}
