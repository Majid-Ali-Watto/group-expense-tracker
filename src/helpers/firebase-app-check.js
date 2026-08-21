import { app } from '@/helpers/firebase-app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// App Check — debug token in dev, reCAPTCHA in production.
// The debug token is printed to the browser console on first load;
// register it once in Firebase Console → App Check → Manage debug tokens.
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true
}

// Registered synchronously, not via a lazy `import()`: firebase.js imports
// this module before creating `auth`, so App Check must already be attached
// to `app` by the time that happens. A dynamic import left a window —
// mainly visible in production, where the extra chunk fetch is slower and
// less predictable than dev's local module graph — where a fast or
// autofilled login could call signInWithEmailAndPassword before App Check
// had registered, so Auth sent the request with no App Check token at all
// and enforcement rejected it as auth/firebase-app-check-token-is-invalid.
if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(
        import.meta.env.VITE_RECAPTCHA_SITE_KEY
      ),
      isTokenAutoRefreshEnabled: true
    })
  } catch (error) {
    console.warn('Firebase App Check is unavailable:', error)
  }
}
