export function appendNotificationForUser(record, identity, notification) {
  const nextRecord = { ...(record || {}) }

  if (!nextRecord.notifications) {
    nextRecord.notifications = {}
  }

  if (!nextRecord.notifications[identity]) {
    nextRecord.notifications[identity] = []
  }

  nextRecord.notifications[identity].push(notification)
  return nextRecord
}

export function removeNotificationForUser(record, identity, notificationId) {
  if (!record?.notifications?.[identity]) {
    return {
      changed: false,
      record
    }
  }

  const filtered = record.notifications[identity].filter(
    (notification) => notification.id !== notificationId
  )

  if (filtered.length === record.notifications[identity].length) {
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
    nextRecord.notifications[identity] = filtered
  } else {
    delete nextRecord.notifications[identity]
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
