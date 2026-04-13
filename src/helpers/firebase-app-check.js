import { app } from '@/helpers/firebase-app'

// App Check — debug token in dev, reCAPTCHA in production.
// The debug token is printed to the browser console on first load;
// register it once in Firebase Console → App Check → Manage debug tokens.
if (import.meta.env.DEV) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true
}

if (typeof window !== 'undefined' && import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(
          import.meta.env.VITE_RECAPTCHA_SITE_KEY
        ),
        isTokenAutoRefreshEnabled: true
      })
    })
    .catch((error) => {
      console.warn('Firebase App Check is unavailable:', error)
    })
}
