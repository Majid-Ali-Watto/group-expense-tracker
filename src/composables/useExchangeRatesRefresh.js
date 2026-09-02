import { getApiAuthHeaders } from '@/utils'
import { LIVE_INTEGRATIONS_ENABLED } from '@/constants'

const API_BASE = import.meta.env.VITE_NODE_BE_API_URL?.trim()
const API_KEY = import.meta.env.VITE_X_API_KEY || ''

export function useExchangeRatesRefresh() {
  // Fire-and-forget, called once right after a successful login (see
  // Login()'s completeLogin) to nudge exchange rates fresher than the
  // backend's own 12h cron alone would, without the user ever knowing it
  // happened. The backend enforces its own system-wide daily cap
  // (exchangeRatesService.MAX_TRIGGERED_REFRESHES_PER_DAY) — this call
  // never surfaces an error or a result to the UI regardless of outcome,
  // and must never be awaited by a caller expecting it to affect the
  // login flow. Only actually fires when LIVE_INTEGRATIONS_ENABLED — no
  // point spending one of the daily refresh slots on every local dev login.
  async function triggerExchangeRatesRefresh() {
    if (!LIVE_INTEGRATIONS_ENABLED || !API_BASE) return
    try {
      const headers = await getApiAuthHeaders({
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      })
      await fetch(`${API_BASE}/exchange-rates/refresh`, {
        method: 'POST',
        headers
      })
    } catch {
      // Best-effort only — never let this affect the login flow.
    }
  }

  return { triggerExchangeRatesRefresh }
}
