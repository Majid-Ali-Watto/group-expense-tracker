import { app } from '@/helpers/firebase-app'

const performanceReady =
  import.meta.env.PROD && typeof window !== 'undefined'
    ? import('firebase/performance')
        .then(({ getPerformance }) => getPerformance(app))
        .catch((error) => {
          console.warn('Firebase Performance is unavailable:', error)
          return null
        })
    : Promise.resolve(null)

export { performanceReady }
