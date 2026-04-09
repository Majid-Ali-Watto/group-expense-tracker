import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import overflowPopup from '@/directives/overflow-popup'
import { initializeAnalytics, trackPageView } from '@/utils/analytics'
import { applySeoForRoute } from '@/utils/seo'
import { toCapitalize } from '@/utils/string-formatting'
import './main.css'

const app = createApp(App)
const PKR = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

const formatAmount = (amount) => {
  return PKR.format(amount)
}
app.provide('formatAmount', formatAmount)
String.prototype.toCapitalize = toCapitalize
app.directive('overflow-popup', overflowPopup)
app.use(ElementPlus)
app.use(createPinia())
app.use(router)
app.mount('#app')

initializeAnalytics(router)
router.isReady().then(() => {
  applySeoForRoute(router.currentRoute.value)
  trackPageView(router.currentRoute.value)
})
router.afterEach((to) => {
  applySeoForRoute(to)
})
