import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import overflowPopup from './directives/overflow-popup'
import './main.css'
import { toCapitalize } from './utils/string-formatting'
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
app.mount('#app')
