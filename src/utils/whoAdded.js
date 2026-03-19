import { useAuthStore } from '../stores/authStore'
import { useUserStore } from '../stores/userStore'
export function getStoredUser() {
  const storedData = localStorage.getItem('rememberMeData')
  if (storedData) {
    return JSON.parse(storedData)
  }
  return ''
}
export function setUserInStorage(form) {
  localStorage.setItem(
    'rememberMeData',
    JSON.stringify({
      name: form.name,
      mobile: form.mobile
    })
  )
}
export function removeUserFromStorage() {
  localStorage.removeItem('rememberMeData')
}
export default function getWhoAddedTransaction() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  return (
    userStore.getUserByMobile(authStore.getActiveUser)?.name ||
    authStore.getActiveUser
  )
}
