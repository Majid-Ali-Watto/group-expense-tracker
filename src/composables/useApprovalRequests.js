import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { appendNotificationForUser, maskMobile } from '@/utils'
import { deleteField } from '@/firebase'
import { withTrace } from '@/utils/performance'

export function useApprovalRequests({
  rawItems,
  activeUserUid,
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
  function summarizeChanges(changes) {
    if (!changes) return ''
    const resolveUser = (identity) => {
      if (!identity) return identity
      const user = userStore?.getUserByUid?.(identity)
      if (user) {
        // Use the stored mobile for masking, not the identity (which may be a UID)
        const maskedMobile =
          user.maskedMobile || (user.mobile ? maskMobile(user.mobile) : null)
        return maskedMobile ? `${user.name} (${maskedMobile})` : user.name
      }
      // identity is a plain name (non-self shared loan users) — return as-is
      return identity
    }
    const parts = []
    if (changes.amount !== undefined) parts.push(`Amount: ${changes.amount}`)
    if (changes.description !== undefined)
      parts.push(`Description: "${changes.description}"`)
    if (changes.payer !== undefined)
      parts.push(`Payer: ${resolveUser(changes.payer)}`)
    if (changes.giver !== undefined)
      parts.push(`Giver: ${resolveUser(changes.giver)}`)
    if (changes.receiver !== undefined)
      parts.push(`Receiver: ${resolveUser(changes.receiver)}`)
    if (changes.date !== undefined) parts.push(`Date: ${changes.date}`)
    return parts.length ? ` [${parts.join(' | ')}]` : ''
  }

  const userNotifications = computed(() => {
    if (!rawItems.value || !activeUserUid.value) return []

    const notifications = []

    Object.keys(rawItems.value).forEach((itemId) => {
      const item = rawItems.value[itemId]

      item?.notifications?.[activeUserUid.value]?.forEach((notification) => {
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
          approvals: item.deleteRequest.approvals || [],
          requestedAt: item.deleteRequest.requestedAt
        })
      }

      if (item?.updateRequest && item.amount) {
        requests.push({
          type: 'update',
          ...commonItem,
          requestedBy: item.updateRequest.requestedBy,
          approvals: item.updateRequest.approvals || [],
          requestedAt: item.updateRequest.requestedAt,
          changes: item.updateRequest.changes,
          current: {
            amount: item.amount,
            payer: item.payer,
            giver: item.giver,
            receiver: item.receiver,
            description: item.description,
            date: item.date
          }
        })
      }
    })

    return requests
  })

  const hasUserApproved = (request) => {
    return request.approvals.includes(activeUserUid.value)
  }

  const isFullyApproved = (request) => {
    return request.approvals.length >= getTotalMembers()
  }

  async function dismissNotification(notificationId) {
    const groupId = activeGroup.value || 'global'

    for (const itemId of Object.keys(rawItems.value || {})) {
      const item = rawItems.value[itemId]
      const notifications = item?.notifications?.[activeUserUid.value] || []
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
        await updateData(
          itemPath,
          () => ({ [`notifications.${activeUserUid.value}`]: deleteField() }),
          ''
        )
      } else {
        await updateData(
          itemPath,
          () => ({ [`notifications.${activeUserUid.value}`]: filtered }),
          ''
        )
      }

      break
    }
  }

  async function appendRequesterNotification(
    itemId,
    itemPath,
    requestedBy,
    notification
  ) {
    const item = rawItems.value[itemId] || {}
    const nextItem = appendNotificationForUser(item, requestedBy, notification)

    await updateData(
      itemPath,
      () => ({ notifications: nextItem.notifications }),
      ''
    )
  }

  async function executeRequest(request, groupId) {
    return withTrace('approval_execute', async () => {
      const itemId = request[itemIdKey]
      const itemPath = buildItemPath({
        groupId,
        monthYear: request.monthYear,
        itemId
      })

      await updateData(
        itemPath,
        () => ({ [`${request.type}Request`]: deleteField() }),
        ''
      )

      const changesSummary =
        request.type === 'update' ? summarizeChanges(request.changes) : ''
      const notification = {
        id: Date.now().toString() + Math.random(),
        type: 'approved',
        message: `Your ${request.type} request for ${itemLabel} has been approved by all members${changesSummary}`,
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
    })
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

    await updateData(
      itemPath,
      () => ({ [`${request.type}Request`]: deleteField() }),
      `${request.type} request has been cancelled.`
    )
  }

  const approveRequest = async (request) => {
    return withTrace('approval_approve', async () => {
      const groupId = activeGroup.value || 'global'
      const itemPath = buildItemPath({
        groupId,
        monthYear: request.monthYear,
        itemId: request[itemIdKey]
      })
      const updatedApprovals = [...request.approvals, activeUserUid.value]

      await updateData(
        itemPath,
        () => ({ [`${request.type}Request.approvals`]: updatedApprovals }),
        'Your approval has been recorded.'
      )

      if (updatedApprovals.length >= getTotalMembers()) {
        await executeRequest(request, groupId)
      }
    })
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
    const changesSummary =
      request.type === 'update' ? summarizeChanges(request.changes) : ''
    const rejector = userStore.getUserByUid(activeUserUid.value)
    const notification = {
      id: Date.now().toString() + Math.random(),
      type: 'rejected',
      message: `Your ${request.type} request for ${itemLabel} was rejected${changesSummary}`,
      byMobile: rejector?.mobile || activeUserUid.value,
      timestamp: Date.now()
    }

    await appendRequesterNotification(
      itemId,
      itemPath,
      request.requestedBy,
      notification
    )

    await updateData(
      itemPath,
      () => ({ [`${request.type}Request`]: deleteField() }),
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
