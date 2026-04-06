import { useAuthStore, useUserStore } from '@/stores'
import { maskMobile } from '@/utils'
// Check if current user is a member of the group

function getIdentity(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.uid || value.mobile || value.userId || ''
}

function hasApproval(approvals, identity) {
  return (approvals || []).some(
    (approval) => getIdentity(approval) === identity
  )
}

export function isMemberOfGroup(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return group.members && group.members.some((m) => getIdentity(m) === mobile)
}
// Check if current user has a pending join request
export function hasPendingRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return (
    group.joinRequests &&
    group.joinRequests.some((r) => getIdentity(r) === mobile)
  )
}

// Check if group has a deletion request
export function hasDeleteRequest(group) {
  return group.deleteRequest && group.deleteRequest.requested === true
}

// Get deletion approvals for a group
export function getDeleteApprovals(group) {
  return group.deleteRequest?.approvals || []
}

// Check if all members have approved deletion
export function allMembersApproved(group) {
  if (!hasDeleteRequest(group)) return false
  const approvals = getDeleteApprovals(group)
  return group.members.every((member) =>
    hasApproval(approvals, getIdentity(member))
  )
}

// Get members who haven't approved yet
export function getPendingApprovals(group) {
  if (!hasDeleteRequest(group)) return []
  const approvals = getDeleteApprovals(group)
  return group.members.filter(
    (member) => !hasApproval(approvals, getIdentity(member))
  )
}

// Check if current user has approved deletion
export function hasUserApprovedDeletion(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  const approvals = getDeleteApprovals(group)
  return hasApproval(approvals, mobile)
}

// ========== Join Request Helpers with Member Approval ==========
export function getJoinRequestApprovals(group, requestMobile) {
  const request = group.joinRequests?.find(
    (r) => getIdentity(r) === requestMobile
  )
  return request?.approvals || []
}

export function getPendingJoinApprovals(group, requestMobile) {
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return group.members.filter(
    (member) => !hasApproval(approvals, getIdentity(member))
  )
}

export function hasUserApprovedJoinRequest(group, requestMobile) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return hasApproval(approvals, mobile)
}

export function allMembersApprovedJoinRequest(group, requestMobile) {
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return group.members.every((member) =>
    hasApproval(approvals, getIdentity(member))
  )
}

// ========== Edit Request Helpers ==========
export function hasEditRequest(group) {
  return group.editRequest !== undefined && group.editRequest !== null
}

export function getEditApprovals(group) {
  return group.editRequest?.approvals || []
}

export function getAllAffectedMembers(group) {
  if (!hasEditRequest(group)) return []
  const { addedMembers } = group.editRequest
  const existingMembers = group.members || []

  // Only existing and added members must approve — removed members are notified, not required
  const allMembers = [...existingMembers, ...(addedMembers || [])]

  // Remove duplicates based on mobile
  const uniqueMembers = allMembers.filter(
    (member, index, self) =>
      index === self.findIndex((m) => getIdentity(m) === getIdentity(member))
  )

  return uniqueMembers
}

export function allAffectedMembersApprovedEdit(group) {
  if (!hasEditRequest(group)) return false
  const approvals = getEditApprovals(group)
  const allAffected = getAllAffectedMembers(group)

  return allAffected.every((member) =>
    hasApproval(approvals, getIdentity(member))
  )
}

export function hasUserApprovedEditRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return hasApproval(group.editRequest?.approvals, mobile)
}

export function isUserAffectedByEdit(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return getAllAffectedMembers(group).some((m) => getIdentity(m) === mobile)
}

// ========== Add Member Request Helpers ==========
export function hasAddMemberRequest(group) {
  return (
    group.addMemberRequest && Object.keys(group.addMemberRequest).length > 0
  )
}

export function getAddMemberRequestApprovals(group) {
  return group.addMemberRequest?.approvals || []
}

export function allMembersApprovedAddMember(group) {
  if (!hasAddMemberRequest(group)) return false
  const approvals = getAddMemberRequestApprovals(group)
  return group.members.every((member) =>
    hasApproval(approvals, getIdentity(member))
  )
}

export function hasUserApprovedAddMemberRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return hasApproval(getAddMemberRequestApprovals(group), mobile)
}

// ========== Ownership Transfer Helpers ==========
export function isCurrentUserPendingOwner(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return group.transferOwnershipRequest?.newOwner === mobile
}

// ========== Notification Helpers ==========
export function getUserNotifications(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return group.notifications?.[mobile] || []
}

// ========== Mobile Display Helpers ==========
export function displayMasked(targetMobile) {
  if (!targetMobile) return ''
  const userStore = useUserStore()
  return (
    userStore.getUserByMobile(targetMobile)?.maskedMobile ||
    maskMobile(targetMobile)
  )
}
