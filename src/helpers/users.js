import { useAuthStore, useUserStore } from '@/stores'
import {
  collection,
  database,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from '@/firebase'
import { DB_NODES } from '@/constants'
import { getIdentity, maskMobile } from '@/utils'
// Check if current user is a member of the group

function hasApproval(approvals, identity) {
  return (approvals || []).some(
    (approval) => getIdentity(approval) === identity
  )
}

export function isMemberOfGroup(group) {
  const authStore = useAuthStore()
  const uid = authStore.getActiveUserUid
  return group.members && group.members.some((m) => getIdentity(m) === uid)
}
// Check if current user has a pending join request
export function hasPendingRequest(group) {
  const authStore = useAuthStore()
  const uid = authStore.getActiveUserUid
  return (
    group.joinRequests && group.joinRequests.some((r) => getIdentity(r) === uid)
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
  const uid = authStore.getActiveUserUid
  const approvals = getDeleteApprovals(group)
  return hasApproval(approvals, uid)
}

// ========== Join Request Helpers with Member Approval ==========
export function getJoinRequestApprovals(group, requestMobile) {
  const request = group.joinRequests?.find((r) => r.uid === requestMobile)
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
  const uid = authStore.getActiveUserUid
  const approvals = getJoinRequestApprovals(group, requestMobile)
  return hasApproval(approvals, uid)
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

  // Remove duplicates based on UID
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
  const uid = authStore.getActiveUserUid
  return hasApproval(group.editRequest?.approvals, uid)
}

export function isUserAffectedByEdit(group) {
  const authStore = useAuthStore()
  const uid = authStore.getActiveUserUid
  return getAllAffectedMembers(group).some((m) => getIdentity(m) === uid)
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
  const uid = authStore.getActiveUserUid
  return hasApproval(getAddMemberRequestApprovals(group), uid)
}

// ========== Ownership Transfer Helpers ==========
export function isCurrentUserPendingOwner(group) {
  const authStore = useAuthStore()
  const uid = authStore.getActiveUserUid
  return group.transferOwnershipRequest?.newOwner === uid
}

// ========== Notification Helpers ==========
export function getUserNotifications(group) {
  const authStore = useAuthStore()
  const uid = authStore.getActiveUserUid
  return group.notifications?.[uid] || []
}

// ========== Mobile Display Helpers ==========
export function displayMasked(targetMobile) {
  if (!targetMobile) return ''
  const userStore = useUserStore()
  return (
    userStore.getUserByUid(targetMobile)?.maskedMobile ||
    maskMobile(targetMobile)
  )
}

export async function findUserByEmail(email) {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) return null

  const snapshot = await getDocs(
    query(
      collection(database, DB_NODES.USERS),
      where('email', '==', normalizedEmail)
    )
  )
  if (snapshot.empty) return null

  const userDoc = snapshot.docs[0]
  return { ...userDoc.data(), uid: userDoc.id }
}

export async function findUserByUid(uid) {
  const normalizedUid = uid?.trim()
  if (!normalizedUid) return null

  const userDoc = await getDoc(doc(database, DB_NODES.USERS, normalizedUid))
  return userDoc.exists() ? { ...userDoc.data(), uid: userDoc.id } : null
}

async function syncFirestoreUserFromAuth(user, firebaseUser) {
  if (!user?.uid || !firebaseUser?.uid) return user

  const normalizedAuthEmail = firebaseUser.email?.trim().toLowerCase()
  const nextEmailVerified = firebaseUser.emailVerified === true
  const updates = {}

  if (normalizedAuthEmail && user.email?.trim()?.toLowerCase() !== normalizedAuthEmail) {
    updates.email = normalizedAuthEmail
  }

  if (user.emailVerified !== nextEmailVerified) {
    updates.emailVerified = nextEmailVerified
  }

  if (user.uid !== firebaseUser.uid) {
    updates.uid = firebaseUser.uid
  }

  if (Object.keys(updates).length) {
    await updateDoc(doc(database, DB_NODES.USERS, user.uid), updates)
  }

  return {
    ...user,
    ...updates,
    uid: firebaseUser.uid
  }
}

export async function resolveUserFromAuth(firebaseUser) {
  if (!firebaseUser?.uid) return null

  const normalizedEmail = firebaseUser.email?.trim()?.toLowerCase()
  const user =
    (normalizedEmail ? await findUserByEmail(normalizedEmail) : null) ||
    (await findUserByUid(firebaseUser.uid))

  if (!user) return null

  return syncFirestoreUserFromAuth(user, firebaseUser)
}

export async function findUserByMobile(mobile) {
  const normalizedMobile = mobile?.trim()
  if (!normalizedMobile) return null

  const snapshot = await getDocs(
    query(
      collection(database, DB_NODES.USERS),
      where('mobile', '==', normalizedMobile)
    )
  )
  if (snapshot.empty) return null

  const userDoc = snapshot.docs[0]
  return { ...userDoc.data(), uid: userDoc.id }
}
