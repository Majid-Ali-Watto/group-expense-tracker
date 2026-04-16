export function buildRequestMeta(userStore) {
  const activeUserUid = userStore.getActiveUserUid
  return {
    requestedBy: activeUserUid,
    approvals: [activeUserUid],
    requestedAt: new Date().toLocaleString('en-PK')
  }
}
