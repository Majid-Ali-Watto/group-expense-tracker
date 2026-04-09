import { analyticsReady } from '@/firebase'

const APP_NAME = 'Kharchafy'

let analyticsInitialized = false
let lastTrackedPageKey = ''
let analyticsModulePromise = null

function getAnalyticsModule() {
  analyticsModulePromise ||= import('firebase/analytics')
  return analyticsModulePromise
}

async function withAnalytics(callback) {
  const analytics = await analyticsReady
  if (!analytics) return null
  const analyticsModule = await getAnalyticsModule()
  return callback(analytics, analyticsModule)
}

export async function trackAnalyticsEvent(name, params = {}) {
  return withAnalytics((analytics, { logEvent }) =>
    logEvent(analytics, name, params)
  )
}

export async function trackPageView(route) {
  if (typeof window === 'undefined') return

  const pagePath =
    route?.fullPath ||
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  const pageLocation = window.location.href
  const pageKey = `${pagePath}::${pageLocation}`

  if (pageKey === lastTrackedPageKey) return
  lastTrackedPageKey = pageKey

  await trackAnalyticsEvent('page_view', {
    page_title: document.title || APP_NAME,
    page_location: pageLocation,
    page_path: pagePath
  })
}

export function initializeAnalytics(router) {
  if (
    analyticsInitialized ||
    typeof window === 'undefined' ||
    !import.meta.env.PROD
  )
    return

  analyticsInitialized = true
  router.afterEach((to) => {
    trackPageView(to)
  })
}

export async function setAnalyticsIdentity(userId, properties = {}) {
  if (!userId) return clearAnalyticsIdentity()

  return withAnalytics((analytics, { setUserId, setUserProperties }) => {
    setUserId(analytics, userId)
    setUserProperties(analytics, {
      signed_in: 'true',
      ...properties
    })
  })
}

export async function clearAnalyticsIdentity() {
  return withAnalytics((analytics, { setUserId, setUserProperties }) => {
    setUserId(analytics, null)
    setUserProperties(analytics, { signed_in: 'false' })
  })
}
