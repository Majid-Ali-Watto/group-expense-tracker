export function buildRequestMeta(userStore) {
  const activeUser = userStore.getActiveUser
  const userName = userStore.getUserByMobile(activeUser)?.name || activeUser
  return {
    requestedBy: activeUser,
    requestedByName: userName,
    approvals: [activeUser],
    requestedAt: new Date().toLocaleString('en-PK')
  }
}
