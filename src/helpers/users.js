import { useAuthStore, useUserStore } from '@/stores'
import { maskMobile } from '@/utils'
// Check if current user is a member of the group

export function isMemberOfGroup(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return group.members && group.members.some((m) => m.mobile === mobile)
}
// Check if current user has a pending join request
export function hasPendingRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return (
    group.joinRequests && group.joinRequests.some((r) => r.mobile === mobile)
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
    approvals.some((approval) => approval.mobile === member.mobile)
  )
}

// Get members who haven't approved yet
export function getPendingApprovals(group) {
  if (!hasDeleteRequest(group)) return []
  const approvals = getDeleteApprovals(group)
  return group.members.filter(
    (member) => !approvals.some((approval) => approval.mobile === member.mobile)
  )
}

// Check if current user has approved deletion
export function hasUserApprovedDeletion(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  const approvals = getDeleteApprovals(group)
  return approvals.some((approval) => approval.mobile === mobile)
}

// ========== Join Request Helpers with Member Approval ==========
export function getJoinRequestApprovals(group, requestMobile) {
  const request = group.joinRequests?.find((r) => r.mobile === requestMobile)
  return request?.approvals || []
}

export function getPendingJoinApprovals(group, requestMobile) {
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return group.members.filter(
    (member) => !approvals.some((approval) => approval.mobile === member.mobile)
  )
}

export function hasUserApprovedJoinRequest(group, requestMobile) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return approvals.some((approval) => approval.mobile === mobile)
}

export function allMembersApprovedJoinRequest(group, requestMobile) {
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return group.members.every((member) =>
    approvals.some((approval) => approval.mobile === member.mobile)
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
      index === self.findIndex((m) => m.mobile === member.mobile)
  )

  return uniqueMembers
}

export function allAffectedMembersApprovedEdit(group) {
  if (!hasEditRequest(group)) return false
  const approvals = getEditApprovals(group)
  const allAffected = getAllAffectedMembers(group)

  return allAffected.every((member) =>
    approvals.some((approval) => approval.mobile === member.mobile)
  )
}

export function hasUserApprovedEditRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return group.editRequest?.approvals?.some((a) => a.mobile === mobile) || false
}

export function isUserAffectedByEdit(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return getAllAffectedMembers(group).some((m) => m.mobile === mobile)
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
    approvals.some((approval) => approval.mobile === member.mobile)
  )
}

export function hasUserApprovedAddMemberRequest(group) {
  const authStore = useAuthStore()
  const mobile = authStore.getActiveUser
  return getAddMemberRequestApprovals(group).some((a) => a.mobile === mobile)
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
