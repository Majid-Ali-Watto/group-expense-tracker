import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { appendNotificationForUser } from './recordNotifications'

export function useApprovalRequests({
  rawItems,
  activeUser,
  activeGroup,
  selectedMonth,
  userStore,
  getTotalMembers,
  updateData,
  deleteData,
  itemIdKey,
  summaryKey,
  itemLabel,
  listLabel,
  getSummary,
  buildItemPath,
  cleanupDeletedReceipts,
  buildUpdatedItem
}) {
  const userNotifications = computed(() => {
    if (!rawItems.value || !activeUser.value) return []

    const notifications = []

    Object.keys(rawItems.value).forEach((itemId) => {
      const item = rawItems.value[itemId]

      item?.notifications?.[activeUser.value]?.forEach((notification) => {
        notifications.push({
          ...notification,
          [itemIdKey]: itemId,
          monthYear: selectedMonth.value
        })
      })
    })

    return notifications.sort((left, right) => right.timestamp - left.timestamp)
  })

  const pendingRequests = computed(() => {
    if (!rawItems.value) return []

    const requests = []

    Object.keys(rawItems.value).forEach((itemId) => {
      const item = rawItems.value[itemId]
      const commonItem = {
        [itemIdKey]: itemId,
        [summaryKey]: getSummary(item),
        monthYear: selectedMonth.value
      }

      if (item?.deleteRequest && item.amount) {
        requests.push({
          type: 'delete',
          ...commonItem,
          requestedBy: item.deleteRequest.requestedBy,
          requestedByName: item.deleteRequest.requestedByName,
          approvals: item.deleteRequest.approvals || [],
          requestedAt: item.deleteRequest.requestedAt
        })
      }

      if (item?.updateRequest && item.amount) {
        requests.push({
          type: 'update',
          ...commonItem,
          requestedBy: item.updateRequest.requestedBy,
          requestedByName: item.updateRequest.requestedByName,
          approvals: item.updateRequest.approvals || [],
          requestedAt: item.updateRequest.requestedAt,
          changes: item.updateRequest.changes
        })
      }
    })

    return requests
  })

  const hasUserApproved = (request) => {
    return request.approvals.includes(activeUser.value)
  }

  const isFullyApproved = (request) => {
    return request.approvals.length >= getTotalMembers()
  }

  async function dismissNotification(notificationId) {
    const groupId = activeGroup.value || 'global'

    for (const itemId of Object.keys(rawItems.value || {})) {
      const item = rawItems.value[itemId]
      const notifications = item?.notifications?.[activeUser.value] || []
      const filtered = notifications.filter(
        (notification) => notification.id !== notificationId
      )

      if (filtered.length === notifications.length) {
        continue
      }

      const itemPath = buildItemPath({
        groupId,
        monthYear: selectedMonth.value,
        itemId
      })

      if (filtered.length === 0) {
        await deleteData(`${itemPath}/notifications/${activeUser.value}`, '')
      } else {
        await updateData(
          `${itemPath}/notifications/${activeUser.value}`,
          () => filtered,
          ''
        )
      }

      break
    }
  }

  async function appendRequesterNotification(itemId, itemPath, requestedBy, notification) {
    const item = rawItems.value[itemId] || {}
    const nextItem = appendNotificationForUser(item, requestedBy, notification)

    await updateData(
      `${itemPath}/notifications`,
      () => nextItem.notifications,
      ''
    )
  }

  async function executeRequest(request, groupId) {
    const itemId = request[itemIdKey]
    const itemPath = buildItemPath({
      groupId,
      monthYear: request.monthYear,
      itemId
    })

    await deleteData(`${itemPath}/${request.type}Request`, '')

    const notification = {
      id: Date.now().toString() + Math.random(),
      type: 'approved',
      message: `Your ${request.type} request for ${itemLabel} has been approved by all members`,
      timestamp: Date.now()
    }

    if (request.type === 'delete') {
      await cleanupDeletedReceipts(rawItems.value[itemId], request)
      await appendRequesterNotification(
        itemId,
        itemPath,
        request.requestedBy,
        notification
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
      await deleteData(
        itemPath,
        `${listLabel} has been deleted (approved by all members).`
      )
      return
    }

    const updatedItem = buildUpdatedItem(
      rawItems.value[itemId],
      request,
      notification
    )

    await updateData(
      itemPath,
      () => updatedItem,
      `${listLabel} has been updated (approved by all members).`
    )
  }

  const executeRequestManually = async (request) => {
    const groupId = activeGroup.value || 'global'
    await executeRequest(request, groupId)
  }

  const cancelRequest = async (request) => {
    await ElMessageBox.confirm(
      `Are you sure you want to cancel this ${request.type} request?`,
      'Cancel Request',
      {
        confirmButtonText: 'Yes, Cancel',
        cancelButtonText: 'No',
        type: 'warning'
      }
    )

    const groupId = activeGroup.value || 'global'
    const itemPath = buildItemPath({
      groupId,
      monthYear: request.monthYear,
      itemId: request[itemIdKey]
    })

    await deleteData(
      `${itemPath}/${request.type}Request`,
      `${request.type} request has been cancelled.`
    )
  }

  const approveRequest = async (request) => {
    const groupId = activeGroup.value || 'global'
    const itemPath = buildItemPath({
      groupId,
      monthYear: request.monthYear,
      itemId: request[itemIdKey]
    })
    const updatedApprovals = [...request.approvals, activeUser.value]

    await updateData(
      `${itemPath}/${request.type}Request`,
      () => ({ approvals: updatedApprovals }),
      'Your approval has been recorded.'
    )

    if (updatedApprovals.length >= getTotalMembers()) {
      await executeRequest(request, groupId)
    }
  }

  const rejectRequest = async (request) => {
    await ElMessageBox.confirm(
      `Are you sure you want to reject this ${request.type} request?`,
      'Confirm Rejection',
      {
        confirmButtonText: 'Yes, Reject',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    const groupId = activeGroup.value || 'global'
    const itemId = request[itemIdKey]
    const itemPath = buildItemPath({
      groupId,
      monthYear: request.monthYear,
      itemId
    })
    const currentUser = userStore.getUserByMobile(activeUser.value)
    const notification = {
      id: Date.now().toString() + Math.random(),
      type: 'rejected',
      message: `Your ${request.type} request for ${itemLabel} was rejected`,
      byName: currentUser?.name || activeUser.value,
      byMobile: activeUser.value,
      timestamp: Date.now()
    }

    await appendRequesterNotification(
      itemId,
      itemPath,
      request.requestedBy,
      notification
    )

    await deleteData(
      `${itemPath}/${request.type}Request`,
      `${request.type} request has been rejected.`
    )
  }

  return {
    userNotifications,
    dismissNotification,
    pendingRequests,
    hasUserApproved,
    isFullyApproved,
    executeRequestManually,
    cancelRequest,
    approveRequest,
    rejectRequest
  }
}
