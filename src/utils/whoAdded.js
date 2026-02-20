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
  const user = getStoredUser()
  return user?.name || user?.mobile || ''
}
