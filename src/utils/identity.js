export function getIdentity(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.uid || value.userId || ''
}
