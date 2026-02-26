import { store } from '../stores/store.js'
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
  const userStore = store()
  return (
    userStore.getUserByMobile(userStore.getActiveUser)?.name ||
    userStore.getActiveUser
  )
}
