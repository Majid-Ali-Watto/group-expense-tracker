// Single "am I really live" switch for this frontend. Governs whether
// integrations with real external side effects — Cloudinary uploads
// (src/utils/cloudinaryUpload.js), triggering the backend's exchange-rate
// refresh (src/composables/useExchangeRatesRefresh.js) — actually fire, or
// fall back to a safe dev-mode stand-in (a mock upload link, or simply not
// calling the refresh endpoint at all).
//
// Defaults to Vite's own production-build flag (`import.meta.env.PROD`).
// Override with VITE_LIVE_INTEGRATIONS_ENABLED=true/false in .env to test
// either code path locally without needing to switch build modes.
//
// The backend has its own equivalent single switch —
// `env.liveIntegrationsEnabled` in kharcafy-node-be's src/config/env.ts —
// for its own side effects (actually sending email).
const override = import.meta.env.VITE_LIVE_INTEGRATIONS_ENABLED

export const LIVE_INTEGRATIONS_ENABLED =
  override === 'true'
    ? true
    : override === 'false'
      ? false
      : !!import.meta.env.PROD
