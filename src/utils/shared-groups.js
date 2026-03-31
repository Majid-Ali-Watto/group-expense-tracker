export function normalizeSharedGroupIds(idsValue) {
  const raw = Array.isArray(idsValue) ? idsValue.join(',') : idsValue || ''
  const seen = new Set()

  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => {
      if (!id || seen.has(id)) return false
      seen.add(id)
      return true
    })
}

export function buildSharedGroupsLocation(groupIds) {
  const ids = normalizeSharedGroupIds(groupIds)
  return {
    path: '/shared-groups',
    query: ids.length ? { ids: ids.join(',') } : {}
  }
}
