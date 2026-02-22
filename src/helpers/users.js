import { store } from '../stores/store'
import { maskMobile } from '../utils/maskMobile'
// Check if current user is a member of the group

export function isMemberOfGroup(group) {
  const userStore = store()
  const mobile = userStore.getActiveUser
  return group.members && group.members.some((m) => m.mobile === mobile)
}
// Check if current user has a pending join request
export function hasPendingRequest(group) {
  const userStore = store()
  const mobile = userStore.getActiveUser
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
  const userStore = store()
  const mobile = userStore.getActiveUser
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
  const userStore = store()
  const mobile = userStore.getActiveUser
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return approvals.some((approval) => approval.mobile === mobile)
}

export function allMembersApprovedJoinRequest(group, requestMobile) {
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return group.members.every((member) =>
    approvals.some((approval) => approval.mobile === member.mobile)
  )
}

// ========== Leave Group Helpers ==========
export function getLeaveRequests(group) {
  return group.leaveRequests || []
}

export function hasLeaveRequest(group, mobile) {
  return getLeaveRequests(group).some((r) => r.mobile === mobile)
}

export function getLeaveApprovals(group, mobile) {
  const request = getLeaveRequests(group).find((r) => r.mobile === mobile)
  return request?.approvals || []
}

export function allMembersApprovedLeave(group, mobile) {
  const approvals = getLeaveApprovals(group, mobile)
  return group.members.every(
    (member) =>
      approvals.some((approval) => approval.mobile === member.mobile) ||
      member.mobile === mobile
  )
}

export function hasUserApprovedLeaveRequest(group, leaveMobile) {
  const userStore = store()
  const mobile = userStore.getActiveUser
  const request = getLeaveRequests(group).find((r) => r.mobile === leaveMobile)
  return request?.approvals?.some((a) => a.mobile === mobile) || false
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
  const { addedMembers, removedMembers } = group.editRequest
  const existingMembers = group.members || []

  // Combine existing, added, and removed members
  const allMembers = [
    ...existingMembers,
    ...(addedMembers || []),
    ...(removedMembers || [])
  ]

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
  const userStore = store()
  const mobile = userStore.getActiveUser
  return group.editRequest?.approvals?.some((a) => a.mobile === mobile) || false
}

export function isUserAffectedByEdit(group) {
  const userStore = store()
  const mobile = userStore.getActiveUser
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
  const userStore = store()
  const mobile = userStore.getActiveUser
  return getAddMemberRequestApprovals(group).some((a) => a.mobile === mobile)
}

// ========== Ownership Transfer Helpers ==========
export function hasUserApprovedOwnershipTransfer(group) {
  const userStore = store()
  const mobile = userStore.getActiveUser
  return (
    group.transferOwnershipRequest?.approvals?.some(
      (a) => a.mobile === mobile
    ) || false
  )
}

// ========== Notification Helpers ==========
export function getUserNotifications(group) {
  const userStore = store()
  const mobile = userStore.getActiveUser
  return group.notifications?.[mobile] || []
}

// ========== Mobile Display Helpers ==========
export function displayMasked(targetMobile) {
  if (!targetMobile) return ''
  const userStore = store()
  return (
    userStore.getUserByMobile(targetMobile)?.maskedMobile ||
    maskMobile(targetMobile)
  )
}
