const getCurrentMonth = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
export function dateToMonthNode(date) {
  return date
    .split(',')[0]
    .split('/')
    .reverse()
    .filter((v, i, a) => i != a.length - 1)
    .join('-')
}
export default getCurrentMonth
