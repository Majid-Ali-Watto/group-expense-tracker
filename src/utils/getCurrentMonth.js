const getCurrentMonth = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
export function dateToMonthNode(date) {
  if (!date) return ''
  // Handle ISO-style format: YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  const isoMatch = String(date).match(/^(\d{4})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}`
  // Handle DD/MM/YYYY or DD/MM/YYYY, HH:MM
  return date
    .split(',')[0]
    .split('/')
    .reverse()
    .filter((v, i, a) => i != a.length - 1)
    .join('-')
}
export default getCurrentMonth
