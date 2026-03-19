export function appendNotificationForUser(record, mobile, notification) {
  const nextRecord = { ...(record || {}) }

  if (!nextRecord.notifications) {
    nextRecord.notifications = {}
  }

  if (!nextRecord.notifications[mobile]) {
    nextRecord.notifications[mobile] = []
  }

  nextRecord.notifications[mobile].push(notification)
  return nextRecord
}

export function removeNotificationForUser(record, mobile, notificationId) {
  if (!record?.notifications?.[mobile]) {
    return {
      changed: false,
      record
    }
  }

  const filtered = record.notifications[mobile].filter(
    (notification) => notification.id !== notificationId
  )

  if (filtered.length === record.notifications[mobile].length) {
    return {
      changed: false,
      record
    }
  }

  const nextRecord = {
    ...record,
    notifications: {
      ...record.notifications
    }
  }

  if (filtered.length) {
    nextRecord.notifications[mobile] = filtered
  } else {
    delete nextRecord.notifications[mobile]
  }

  if (!Object.keys(nextRecord.notifications).length) {
    delete nextRecord.notifications
  }

  return {
    changed: true,
    record: nextRecord,
    notifications: filtered
  }
}
