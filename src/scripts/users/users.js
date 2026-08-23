import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { useFireBase, useDebouncedRef } from '@/composables'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import {
  showError,
  maskMobile,
  appendNotificationForUser,
  isValidPhoneNumber,
  normalizePhoneNumber,
  phoneNumbersMatch
} from '@/utils'
import { confirmAction } from '@/utils/confirmAction'
import { getDisplayMobile } from '@/utils/user-display'
import { createUserDisplayStoreProxy } from '@/composables'
import {
  getActiveUserBlockedMessage,
  getBlockedEntityMessage,
  isGroupBlocked,
  isUserBlocked
} from '@/helpers'
import {
  onSnapshot,
  collection,
  doc,
  updateDoc,
  query,
  where,
  database
} from '@/firebase'

export const Users = () => {
  const isPageLoading = ref(true)
  const { t } = useI18n()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
  const { updateData, read, deleteData } = useFireBase()

  const editDialogVisible = ref(false)
  const editForm = ref({ uid: '', name: '', mobile: '' })
  const initialEditForm = ref({ uid: '', name: '', mobile: '' })
  const userRows = ref([])

  const users = computed(() => userRows.value || [])
  const groups = computed(() => groupStore.getGroups || [])
  const activeUserUid = computed(() => authStore.getActiveUserUid)

  const route = useRoute()
  const router = useRouter()
  const searchQuery = useDebouncedRef(route.query.q || '', 300)
  const sortOrder = ref(route.query.sort || '') // '' | 'asc' | 'desc'
  const sharedGroupsOnly = ref(route.query.shared === '1')
  const hideBlockedUsers = ref(
    userStore.getActiveUserTabConfig?.hideBlockedUsers ??
      route.query.hideBlocked === '1'
  )
  const activeUserIsBlocked = computed(() =>
    isUserBlocked(userStore.getUserByUid(activeUserUid.value))
  )

  // Sync filters to URL so they are bookmarkable and shareable
  watch([searchQuery, sortOrder, sharedGroupsOnly, hideBlockedUsers], () => {
    const query = {}
    if (searchQuery.value) query.q = searchQuery.value
    if (sortOrder.value) query.sort = sortOrder.value
    if (sharedGroupsOnly.value) query.shared = '1'
    if (hideBlockedUsers.value) query.hideBlocked = '1'
    router.replace({ path: route.path, query })
  })

  const sortOptions = computed(() => [
    { label: t('users.default'), value: '' },
    { label: t('groups.sortAsc'), value: 'asc' },
    { label: t('groups.sortDesc'), value: 'desc' }
  ])
  const filterFields = computed(() => [
    {
      key: 'sort',
      modelValue: sortOrder.value,
      placeholder: t('users.sortPlaceholder'),
      options: sortOptions.value,
      filterable: false,
      onChange: (value) => {
        sortOrder.value = value || ''
      }
    },
    {
      key: 'sharedGroupsOnly',
      type: 'checkbox',
      label: t('users.sharedGroupsOnly'),
      modelValue: sharedGroupsOnly.value,
      onChange: (value) => {
        sharedGroupsOnly.value = value
      }
    },
    {
      key: 'hideBlockedUsers',
      type: 'checkbox',
      label: t('users.hideBlockedUsers'),
      modelValue: hideBlockedUsers.value,
      onChange: (value) => {
        hideBlockedUsers.value = value
      }
    }
  ])

  const clearFilters = () => {
    sortOrder.value = ''
    sharedGroupsOnly.value = false
    hideBlockedUsers.value = false
  }

  function ensureUsersInteractionAllowed(user = null) {
    if (activeUserIsBlocked.value) {
      showError(getActiveUserBlockedMessage())
      return false
    }

    if (user && isUserBlocked(user)) {
      showError(getBlockedEntityMessage('user'))
      return false
    }

    return true
  }

  function getUserId(user) {
    return user?.uid || ''
  }

  function getUserIdentitySet(userId) {
    return new Set([userId].filter(Boolean))
  }

  function matchesIdentity(entry, uid) {
    if (!entry || !uid) return false
    const entryUid = entry.uid || ''
    return entryUid === uid
  }

  function memberMatchesUser(member, userId) {
    if (!member || !userId) return false
    const identities = getUserIdentitySet(userId)
    return identities.has(member.uid)
  }

  function isCurrentUserInGroup(group) {
    if (!group || !activeUserUid.value) return false
    return (group.members || []).some((member) =>
      matchesIdentity(member, activeUserUid.value)
    )
  }

  function hasCurrentUserPendingJoinRequest(group) {
    if (!group || !activeUserUid.value) return false
    return (group.joinRequests || []).some((request) =>
      matchesIdentity(request, activeUserUid.value)
    )
  }

  function normalizeName(value = '') {
    return value.trim().replace(/\s+/g, ' ')
  }

  function normalizeMobile(value = '') {
    return normalizePhoneNumber(value)
  }

  function isValidName(name) {
    return /^[a-zA-Z]+(\s[a-zA-Z]+)*$/.test(name)
  }

  function isValidMobile(mobile) {
    return isValidPhoneNumber(mobile)
  }

  const editUserRules = {
    name: [
      {
        required: true,
        message: t('validation.nameRequired'),
        trigger: 'blur'
      },
      {
        validator: (_rule, value, callback) => {
          const normalizedName = normalizeName(value || '')
          if (!normalizedName) {
            callback(new Error(t('users.nameRequired')))
            return
          }
          if (normalizedName.length < 3) {
            callback(new Error(t('validation.nameMinLength')))
            return
          }
          if (!isValidName(normalizedName)) {
            callback(new Error(t('validation.nameAlphaOnly')))
            return
          }
          callback()
        },
        trigger: ['blur', 'change']
      }
    ],
    mobile: [
      {
        required: true,
        message: t('validation.mobileRequired'),
        trigger: 'blur'
      },
      {
        validator: (_rule, value, callback) => {
          const normalizedMobile = normalizeMobile(value || '')
          if (!normalizedMobile) {
            callback(new Error(t('validation.mobileRequired')))
            return
          }
          if (!isValidMobile(normalizedMobile)) {
            callback(new Error(t('validation.mobilePattern')))
            return
          }
          callback()
        },
        trigger: ['blur', 'change']
      }
    ]
  }

  function displayMobile(targetUserId) {
    return getDisplayMobile(storeProxy, targetUserId)
  }

  function getUserGroups(userId) {
    return groups.value
      .filter((g) =>
        g.members?.some((member) => memberMatchesUser(member, userId))
      )
      .map((g) => ({ ...g }))
  }

  function ensureGroupInteractionAllowed(group) {
    if (activeUserIsBlocked.value) {
      showError(getActiveUserBlockedMessage())
      return false
    }

    if (group && isGroupBlocked(group)) {
      showError(getBlockedEntityMessage('group'))
      return false
    }

    return true
  }

  async function requestJoinFromUserGroup(group) {
    if (!group || isCurrentUserInGroup(group)) return
    if (!ensureGroupInteractionAllowed(group)) return

    if (hasCurrentUserPendingJoinRequest(group)) {
      showError(t('users.alreadyPendingJoin'))
      return
    }

    const confirmed = await confirmAction({
      message: t('users.joinGroupConfirm', { name: group.name }),
      title: t('users.joinGroup'),
      confirmButtonText: t('common.sendRequest'),
      cancelButtonText: t('common.cancel'),
      type: 'info'
    })
    if (!confirmed) return

    try {
      const me = userStore.getUserByUid(activeUserUid.value)
      const myName = me?.name || activeUserUid.value
      const myMobile = me?.mobile || activeUserUid.value
      // No `mobile` field on the stored request — every display/approval path
      // resolves the requester via userStore.getUserByUid(uid), and storing it
      // here would leak a phone number to any authenticated stranger browsing
      // groups (groups/{groupId} is world-readable).
      const newRequests = [
        ...(group.joinRequests || []),
        { uid: activeUserUid.value, approvals: [] }
      ]

      let payload = { joinRequests: newRequests }
      let updatedGroup = { ...group, joinRequests: newRequests }

      for (const member of group.members || []) {
        if (matchesIdentity(member, activeUserUid.value, myMobile)) continue
        updatedGroup = appendNotificationForUser(updatedGroup, member.uid, {
          id: `${Date.now()}-${Math.random()}`,
          type: 'join-request',
          message: t('groupsMessages.wantsToJoinNotif', {
            name: myName,
            mobile: maskMobile(myMobile),
            groupName: group.name
          }),
          updatedBy: activeUserUid.value,
          timestamp: Date.now()
        })
      }

      if (updatedGroup.notifications) {
        payload = { ...payload, notifications: updatedGroup.notifications }
      }

      await updateData(
        `${DB_NODES.GROUPS}/${group.id}`,
        () => payload,
        t('shared.joinRequestSent')
      )

      groupStore.updateGroup(updatedGroup)
    } catch {
      showError(t('shared.joinRequestFailed'))
    }
  }

  const filteredUsers = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    let result = [...users.value]

    if (query) {
      result = result.filter((u) => {
        return (
          u.name.toLowerCase().includes(query) ||
          displayMobile(getUserId(u)).toLowerCase().includes(query) ||
          getUserGroups(getUserId(u)).some((group) =>
            group.name.toLowerCase().includes(query)
          )
        )
      })
    }

    if (sharedGroupsOnly.value) {
      const me = activeUserUid.value
      const myIdentitySet = getUserIdentitySet(me)
      const sharedUserIds = new Set(
        groups.value
          .filter((g) =>
            g.members?.some((member) => memberMatchesUser(member, me))
          )
          .flatMap(
            (g) =>
              g.members?.flatMap((member) => [member.uid].filter(Boolean)) || []
          )
      )
      result = result.filter((u) => {
        const userIdentities = getUserIdentitySet(getUserId(u))
        return (
          [...userIdentities].some((identity) => myIdentitySet.has(identity)) ||
          [...userIdentities].some((identity) => sharedUserIds.has(identity))
        )
      })
    }

    if (sortOrder.value === 'asc') {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOrder.value === 'desc') {
      result = result.sort((a, b) => b.name.localeCompare(a.name))
    }

    return result.filter((user) => getUserId(user) !== activeUserUid.value)
  })

  // Load full user data with real-time updates so delete/approve/reject
  // actions are reflected instantly on all connected sessions.
  let usersUnsubscribe = null
  function stopUsersListener() {
    if (usersUnsubscribe) {
      usersUnsubscribe()
      usersUnsubscribe = null
    }
  }

  function syncUsersListener() {
    stopUsersListener()

    const queryConstraints = [where('emailVerified', '==', true)]
    if (hideBlockedUsers.value) {
      queryConstraints.push(where('blocked', '==', false))
    }

    usersUnsubscribe = onSnapshot(
      query(collection(database, DB_NODES.USERS), ...queryConstraints),
      (snap) => {
        const nextUsers = snap.docs.reduce((list, docSnap) => {
          const uid = docSnap.id
          if (uid === activeUserUid.value) return list

          const u = docSnap.data()
          // isAdmin/billedUser/bugResolver deliberately not picked here — they
          // live in user-admin-flags/{uid} and are never needed for anyone but
          // the active user (see userStore.getActiveUserAdminFlags). email is
          // the same story — it lives in user-private/{uid} and is likewise
          // never needed for anyone but the active user (see
          // userStore.getActiveUserPrivate).
          const user = {
            uid,
            mobile: u.mobile || '',
            name: u.name || '',
            photoUrl: u.photoUrl || '',
            photoMeta: u.photoMeta || null,
            addedBy: u.addedBy || null,
            maskedMobile: maskMobile(u.mobile || ''),
            deleteRequest: u.deleteRequest || null,
            updateRequest: u.updateRequest || null,
            blocked: u.blocked === true
          }

          userStore.addUser(user)
          list.push(user)
          return list
        }, [])
        userRows.value = nextUsers
        isPageLoading.value = false
      },
      () => {
        userRows.value = []
        isPageLoading.value = false
      }
    )
  }

  onMounted(() => {
    syncUsersListener()
  })

  watch(hideBlockedUsers, async (newVal) => {
    const uid = authStore.getActiveUserUid
    if (uid) {
      try {
        await updateDoc(doc(database, `${DB_NODES.USER_TAB_CONFIGS}/${uid}`), {
          hideBlockedUsers: newVal
        })
      } catch (err) {
        console.error('Failed to save hideBlockedUsers preference:', err)
      }
    }
    isPageLoading.value = true
    syncUsersListener()
  })

  onUnmounted(() => {
    stopUsersListener()
  })

  // --- Permission helpers ---

  function canManage(row) {
    const me = activeUserUid.value
    if (!me) return false
    if (activeUserIsBlocked.value || isUserBlocked(row)) return false
    return row.addedBy === me
  }

  // Unique group owner UIDs of all groups the user is a member of
  function getGroupOwnerUids(userId) {
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((member) => memberMatchesUser(member, userId))
    )
    return [...new Set(memberGroups.map((g) => g.ownerUid).filter(Boolean))]
  }

  // Pending delete requests that the current user (as group owner) needs to approve
  const myPendingApprovals = computed(() => {
    const me = activeUserUid.value
    if (!me) return []
    const result = []
    users.value.forEach((u) => {
      const req = u.deleteRequest
      if (
        req &&
        req.requiredApprovals?.includes(me) &&
        !req.approvals?.some((a) => a.uid === me)
      ) {
        result.push({ user: u, type: 'delete', request: req })
      }
    })
    return result
  })

  // --- Edit User ---

  function openEditUser(row) {
    if (!ensureUsersInteractionAllowed(row)) return
    initialEditForm.value = {
      uid: row.uid,
      name: row.name,
      mobile: row.mobile || ''
    }
    editForm.value = { ...initialEditForm.value }
    editDialogVisible.value = true
  }

  function resetEditUserForm() {
    editForm.value = { ...initialEditForm.value }
  }

  async function submitUpdateUser() {
    const { uid } = editForm.value
    const newName = normalizeName(editForm.value.name)
    const newMobile = normalizeMobile(editForm.value.mobile)

    if (!newName) return showError(t('users.nameRequired'))
    if (newName.length < 3) {
      return showError(t('validation.nameMinLength'))
    }
    if (!isValidName(newName)) {
      return showError(t('validation.nameAlphaOnly'))
    }
    if (!newMobile) return showError(t('validation.mobileRequired'))
    if (!isValidMobile(newMobile)) {
      return showError(t('validation.mobilePattern'))
    }

    const user = await read(`${DB_NODES.USERS}/${uid}`)
    if (!user) return showError(t('users.userNotFound'))
    if (!ensureUsersInteractionAllowed(user)) return
    if (user.deleteRequest) return showError(t('users.deleteRequestPending'))
    if (user.updateRequest) return showError(t('users.updateRequestPending'))

    const existingUsers = (await read(DB_NODES.USERS, false)) || {}
    const mobileTaken = Object.entries(existingUsers).some(
      ([otherUid, otherUser]) =>
        otherUid !== uid &&
        phoneNumbersMatch(otherUser?.mobile || '', newMobile)
    )
    if (mobileTaken) {
      return showError(t('authMessages.mobileExists'))
    }

    const oldName = user.name
    const previousMobile = normalizeMobile(user.mobile || '')
    const nameChanged = oldName !== newName
    const mobileChanged = previousMobile !== newMobile

    if (!nameChanged && !mobileChanged) {
      editDialogVisible.value = false
      return
    }

    // `read()` injects Firestore's document id as `id`; never persist that duplicate field back.
    const updated = { ...user, name: newName, mobile: newMobile }
    delete updated.id
    await updateData(
      `${DB_NODES.USERS}/${uid}`,
      () => updated,
      t('users.userUpdated')
    )
    userStore.addUser({
      uid,
      name: newName,
      mobile: newMobile,
      maskedMobile: maskMobile(newMobile)
    })

    // Notify each group the user belongs to so co-members are informed
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((member) => memberMatchesUser(member, uid))
    )
    for (const group of memberGroups) {
      const coMembers = (group.members || []).filter(
        (member) => !memberMatchesUser(member, uid)
      )
      if (!coMembers.length) continue

      const changeParts = []
      if (nameChanged) {
        changeParts.push(
          t('usersMessages.nameChangedPart', { oldName, newName })
        )
      }
      if (mobileChanged) {
        changeParts.push(t('usersMessages.mobileUpdatedPart'))
      }

      let updatedGroup = { ...group }
      for (const member of coMembers) {
        updatedGroup = appendNotificationForUser(updatedGroup, member.uid, {
          id: Date.now().toString() + Math.random(),
          type: 'member-renamed',
          message: t('usersMessages.memberRenamedNotif', {
            newName,
            changes: changeParts.join(' and '),
            groupName: group.name
          }),
          updatedBy: uid,
          timestamp: Date.now()
        })
      }

      await updateData(
        `${DB_NODES.GROUPS}/${group.id}`,
        () => ({ notifications: updatedGroup.notifications }),
        ''
      )
    }

    editDialogVisible.value = false
  }

  // --- Delete User ---

  async function requestDeleteUser(uid, name) {
    try {
      const targetUser = userStore.getUserByUid(uid)
      if (!ensureUsersInteractionAllowed(targetUser)) return

      const ownerUids = getGroupOwnerUids(uid)
      await ElMessageBox.confirm(
        t('users.deleteUserConfirm', { name }) +
          (ownerUids.length > 0 ? t('users.deleteUserGroupWarning') : ''),
        t('users.deleteUserTitle'),
        {
          confirmButtonText: t('users.proceed'),
          cancelButtonText: t('common.cancel'),
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )

      const user = await read(`${DB_NODES.USERS}/${uid}`)
      if (!user) return showError(t('users.userNotFound'))
      if (user.deleteRequest) return showError(t('users.deleteAlreadyPending'))
      if (user.updateRequest)
        return showError(t('users.updatePendingCannotDelete'))

      if (ownerUids.length === 0) {
        // Delete from Realtime Database
        await deleteData(
          `${DB_NODES.USERS}/${uid}`,
          t('users.userDeleted', { name })
        )
        userStore.setUsers([...userStore.getUsers].filter((u) => u.uid !== uid))
      } else {
        const deleteRequest = {
          requestedBy: activeUserUid.value,
          requiredApprovals: ownerUids,
          approvals: []
        }
        await updateData(
          `${DB_NODES.USERS}/${uid}`,
          () => ({ deleteRequest }),
          t('users.deleteRequestSentToOwners')
        )
        userStore.addUser({ uid, deleteRequest })
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error?.message || t('users.failedProcessDeleteRequest'))
      }
    }
  }

  // --- Approve Request ---

  async function approveRequest(userUid, type) {
    const me = activeUserUid.value
    const user = await read(`${DB_NODES.USERS}/${userUid}`)
    if (!user) return showError(t('users.userNotFound'))
    if (!ensureUsersInteractionAllowed(user)) return

    const request = type === 'delete' ? user.deleteRequest : user.updateRequest
    if (!request) return showError(t('users.requestNotFoundOrResolved'))

    const newApprovals = [...(request.approvals || []), { uid: me }]
    const allApproved = request.requiredApprovals.every((r) =>
      newApprovals.some((a) => a.uid === r)
    )

    // Only delete requests go through approval; update requests are applied directly
    if (type === 'delete' && allApproved) {
      // Delete from Realtime Database
      await deleteData(
        `${DB_NODES.USERS}/${userUid}`,
        t('users.userDeleted', { name: user.name })
      )
      userStore.setUsers(
        [...userStore.getUsers].filter((u) => u.uid !== userUid)
      )
    } else {
      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      const updatedRequest = { ...request, approvals: newApprovals }
      await updateData(
        `${DB_NODES.USERS}/${userUid}`,
        () => ({ [field]: updatedRequest }),
        t('users.approvalRecorded')
      )
      userStore.addUser({ uid: userUid, [field]: updatedRequest })
    }
  }

  // --- Reject Request ---

  async function rejectRequest(userUid, type, userName) {
    try {
      const targetUser = await read(`${DB_NODES.USERS}/${userUid}`)
      if (!targetUser) return showError(t('users.userNotFound'))
      if (!ensureUsersInteractionAllowed(targetUser)) return

      await ElMessageBox.confirm(
        t('users.rejectUserConfirm', { name: userName, type }),
        t('users.rejectUserTitle'),
        {
          confirmButtonText: t('common.reject'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )

      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      const rejectionData =
        type === 'delete'
          ? {
              rejectionNotification: {
                type: 'delete-rejected',
                message: t('usersMessages.deletionRejectedNotif', {
                  name:
                    userStore.getUserByUid(activeUserUid.value)?.name ||
                    activeUserUid.value
                }),
                rejectedBy: activeUserUid.value,
                timestamp: Date.now()
              }
            }
          : {}
      await updateData(
        `${DB_NODES.USERS}/${userUid}`,
        () => ({ [field]: null, ...rejectionData }),
        type === 'delete'
          ? t('users.deleteRejected')
          : t('users.updateRejected')
      )
      userStore.addUser({ uid: userUid, [field]: null, ...rejectionData })
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || t('users.failedReject'))
    }
  }

  const createGroupDialogVisible = ref(false)
  const createGroupForMobile = ref(null)

  function openCreateGroup(uid) {
    const targetUser = userStore.getUserByUid(uid)
    if (!ensureUsersInteractionAllowed(targetUser)) return
    createGroupForMobile.value = uid
    createGroupDialogVisible.value = true
  }

  const groupsDialogVisible = ref(false)
  const selectedUserUid = ref('')
  const selectedUserName = ref('')
  const selectedUserGroups = computed(() =>
    selectedUserUid.value ? getUserGroups(selectedUserUid.value) : []
  )

  function openGroupsDialog(row) {
    if (!ensureUsersInteractionAllowed(row)) return
    selectedUserUid.value = row.uid
    selectedUserName.value = row.name
    groupsDialogVisible.value = true
  }

  function handleGroupCreated(group) {
    if (!group?.id) return
    groupStore.addGroup(group)
  }

  return {
    searchQuery,
    isPageLoading,
    sortOrder,
    sharedGroupsOnly,
    hideBlockedUsers,
    filterFields,
    clearFilters,
    filteredUsers,
    editDialogVisible,
    editForm,
    myPendingApprovals,
    displayMobile,
    getUserGroups,
    isCurrentUserInGroup,
    hasCurrentUserPendingJoinRequest,
    requestJoinFromUserGroup,
    canManage,
    openEditUser,
    submitUpdateUser,
    requestDeleteUser,
    approveRequest,
    rejectRequest,
    editUserRules,
    createGroupDialogVisible,
    createGroupForMobile,
    openCreateGroup,
    groupsDialogVisible,
    selectedUserGroups,
    selectedUserName,
    openGroupsDialog,
    handleGroupCreated,
    resetEditUserForm,
    activeUserIsBlocked
  }
}
