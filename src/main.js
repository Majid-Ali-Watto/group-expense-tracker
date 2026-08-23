// Individual <el-xxx> components are resolved on demand at build time (see
// the Components/ElementPlusResolver plugin in vite.config.js) instead of
// registering the whole library here — that used to bundle all ~80
// components + their CSS into every route, including pages that render no
// Element Plus component at all. These 5 imports cover the only Element
// Plus pieces the template-based resolver can't reach: the programmatic
// JS APIs (ElMessage/ElMessageBox/ElNotification/ElLoading/ElButton, used
// directly in JS across the app, e.g. src/utils/showAlerts.js) still need
// their CSS loaded explicitly since they're never written as a <template> tag.
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/button/style/css'
import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes, scrollBehavior, setupRouterGuard } from './router'
import overflowPopup from '@/directives/overflow-popup'
import { initializeAnalytics } from '@/utils/analytics'
import { toCapitalize } from '@/utils/string-formatting'
import { createAppI18n, getStoredLocale } from '@/i18n'
import './main.css'

const PKR = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatAmount = (amount) => PKR.format(amount)
String.prototype.toCapitalize = toCapitalize

// `ViteSSG` owns app creation, router creation (memory history during
// prerender, web history in the browser — see src/router/index.js), and
// mounting. It also installs @unhead/vue automatically, so `useHead()` in
// any component (see src/App.vue) works without extra setup. Only the
// public marketing routes are actually prerendered — see
// ssgOptions.includedRoutes in vite.config.js; every other route still
// behaves as a plain client-rendered SPA, same as before.
export const createApp = ViteSSG(
  App,
  { routes, base: '/', scrollBehavior },
  ({ app, router, isClient, routePath }) => {
    const currentPath =
      routePath ||
      (typeof window !== 'undefined' ? window.location.pathname : '/')
    const initialLocale =
      router.resolve(currentPath).meta?.locale ?? getStoredLocale()
    const i18n = createAppI18n(initialLocale)
    const applyLocaleForRoute = (to) => {
      i18n.global.locale.value = to.meta?.locale ?? getStoredLocale()
    }

    app.provide('formatAmount', formatAmount)
    app.directive('overflow-popup', overflowPopup)
    app.use(createPinia())
    app.use(i18n)

    router.beforeEach((to) => {
      applyLocaleForRoute(to)
    })

    setupRouterGuard(router)

    // Public/guest pages carry an explicit locale from their /ur URL;
    // authenticated app routes carry none, so fall back to the user's saved
    // preference (see src/i18n/index.js). Registered before the initial
    // navigation resolves, so it also covers the first render.
    router.afterEach((to) => {
      applyLocaleForRoute(to)
    })

    // Analytics is meaningless during SSG prerendering — client only.
    // initializeAnalytics registers its own router.afterEach for page views.
    if (isClient) {
      initializeAnalytics(router)
    }
  }
)
