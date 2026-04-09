import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import overflowPopup from '@/directives/overflow-popup'
import './main.css'
import {
  applySeoForRoute,
  initializeAnalytics,
  toCapitalize,
  trackPageView
} from '@/utils'
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
