import { app } from '@/helpers/firebase-app'

const analyticsReady =
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  import.meta.env.VITE_MEASUREMENT_ID
    ? import('firebase/analytics')
        .then(async ({ getAnalytics, isSupported }) => {
          const supported = await isSupported()
          return supported ? getAnalytics(app) : null
        })
        .catch((error) => {
          console.warn('Firebase Analytics is unavailable:', error)
          return null
        })
    : Promise.resolve(null)

export { analyticsReady }
