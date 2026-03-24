export function buildRequestMeta(userStore) {
  const activeUser = userStore.getActiveUser
  return {
    requestedBy: activeUser,
    approvals: [activeUser],
    requestedAt: new Date().toLocaleString('en-PK')
  }
}
