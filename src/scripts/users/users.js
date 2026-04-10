import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useFireBase, useDebouncedRef } from '@/composables'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import { showError, maskMobile, appendNotificationForUser } from '@/utils'
import {
  createUserDisplayStoreProxy,
  getDisplayMobile
} from '@/utils/user-display'
import {
  ACTIVE_USER_BLOCKED_MESSAGE,
  getBlockedEntityMessage,
  isUserBlocked
} from '@/helpers'
import {
  auth,
  deleteUser,
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
  const activeUser = computed(() => authStore.getActiveUser)

  const route = useRoute()
  const router = useRouter()
  const searchQuery = useDebouncedRef(route.query.q || '', 300)
  const sortOrder = ref(route.query.sort || '') // '' | 'asc' | 'desc'
  const sharedGroupsOnly = ref(route.query.shared === '1')
  const hideBlockedUsers = ref(
    userStore.getActiveUserTabConfig?.hideBlockedUsers ??
    (route.query.hideBlocked === '1')
  )
  const activeUserIsBlocked = computed(() =>
    isUserBlocked(userStore.getUserByUid(activeUser.value))
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

  function ensureUsersInteractionAllowed(user = null) {
    if (activeUserIsBlocked.value) {
      showError(ACTIVE_USER_BLOCKED_MESSAGE)
      return false
    }

    if (user && isUserBlocked(user)) {
      showError(getBlockedEntityMessage('user'))
      return false
    }

    return true
  }

  function getUserId(user) {
    return user?.uid || user?.mobile || ''
  }

  function normalizeName(value = '') {
    return value.trim().replace(/\s+/g, ' ')
  }

  function normalizeMobile(value = '') {
    return value.trim().replace(/\s+/g, '')
  }

  function isValidName(name) {
    return /^[a-zA-Z]+(\s[a-zA-Z]+)*$/.test(name)
  }

  function isValidMobile(mobile) {
    return /^03\d{9}$/.test(mobile)
  }

  function pinActiveUserFirst(rows) {
    const activeUserId = activeUser.value
    if (!activeUserId) return rows

    const result = [...rows]
    const activeUserIndex = result.findIndex(
      (user) => getUserId(user) === activeUserId
    )
    if (activeUserIndex <= 0) return result

    const [activeUserRow] = result.splice(activeUserIndex, 1)
    result.unshift(activeUserRow)
    return result
  }

  const editUserRules = {
    name: [
      { required: true, message: 'Full name is required', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          const normalizedName = normalizeName(value || '')
          if (!normalizedName) {
            callback(new Error('Full name is required'))
            return
          }
          if (normalizedName.length < 3) {
            callback(new Error('Name should be at least 3 characters'))
            return
          }
          if (!isValidName(normalizedName)) {
            callback(
              new Error('Name can only contain alphabets and single spaces')
            )
            return
          }
          callback()
        },
        trigger: ['blur', 'change']
      }
    ],
    mobile: [
      { required: true, message: 'Mobile number is required', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          const normalizedMobile = normalizeMobile(value || '')
          if (!normalizedMobile) {
            callback(new Error('Mobile number is required'))
            return
          }
          if (!isValidMobile(normalizedMobile)) {
            callback(
              new Error('Mobile number must be 11 digits starting with 03')
            )
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
        g.members?.some((member) => (member.uid || member.mobile) === userId)
      )
      .map((g) => g.name)
  }

  const filteredUsers = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    let result = [...users.value]

    if (query) {
      result = result.filter((u) => {
        return (
          u.name.toLowerCase().includes(query) ||
          displayMobile(getUserId(u)).toLowerCase().includes(query) ||
          getUserGroups(getUserId(u)).some((g) =>
            g.toLowerCase().includes(query)
          )
        )
      })
    }

    if (sharedGroupsOnly.value) {
      const me = activeUser.value
      const sharedUserIds = new Set(
        groups.value
          .filter((g) =>
            g.members?.some((member) => (member.uid || member.mobile) === me)
          )
          .flatMap(
            (g) => g.members?.map((member) => member.uid || member.mobile) || []
          )
      )
      result = result.filter(
        (u) => getUserId(u) === me || sharedUserIds.has(getUserId(u))
      )
    }

    if (sortOrder.value === 'asc') {
      result = result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOrder.value === 'desc') {
      result = result.sort((a, b) => b.name.localeCompare(a.name))
    }

    return pinActiveUserFirst(result)
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
        const nextUsers = snap.docs
          .map((docSnap) => {
          const uid = docSnap.id
          const u = docSnap.data()
          const user = {
            uid,
            mobile: u.mobile || '',
            name: u.name || '',
            email: u.email || '',
            addedBy: u.addedBy || null,
            maskedMobile: maskMobile(u.mobile || ''),
            deleteRequest: u.deleteRequest || null,
            updateRequest: u.updateRequest || null,
            bugResolver: u.bugResolver === true,
            blocked: u.blocked === true
          }

          userStore.addUser(user)
          return user
          })
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
    const uid = authStore.getActiveUser
    if (uid) {
      try {
        await updateDoc(
          doc(database, `${DB_NODES.USER_TAB_CONFIGS}/${uid}`),
          { hideBlockedUsers: newVal }
        )
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
    const me = activeUser.value
    if (!me) return false
    if (activeUserIsBlocked.value || isUserBlocked(row)) return false
    return row.uid === me || row.addedBy === me
  }

  // Unique group owner mobiles of all groups the user is a member of
  function getGroupOwnerMobiles(userId) {
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((member) => (member.uid || member.mobile) === userId)
    )
    return [...new Set(memberGroups.map((g) => g.ownerMobile).filter(Boolean))]
  }

  // Pending delete requests that the current user (as group owner) needs to approve
  const myPendingApprovals = computed(() => {
    const me = activeUser.value
    if (!me) return []
    const result = []
    users.value.forEach((u) => {
      const req = u.deleteRequest
      if (
        req &&
        req.requiredApprovals?.includes(me) &&
        !req.approvals?.some((a) => (a.uid || a.mobile) === me)
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

  async function syncUserProfileInGroups(userId, profile) {
    const relatedGroups = groups.value.filter((group) =>
      [...(group.members || []), ...(group.pendingMembers || [])].some(
        (member) => (member.uid || member.mobile) === userId
      )
    )

    for (const group of relatedGroups) {
      const members = (group.members || []).map((member) =>
        (member.uid || member.mobile) === userId
          ? { ...member, name: profile.name, phone: profile.mobile }
          : member
      )
      const pendingMembers = (group.pendingMembers || []).map((member) =>
        (member.uid || member.mobile) === userId
          ? { ...member, name: profile.name, phone: profile.mobile }
          : member
      )

      await updateData(
        `${DB_NODES.GROUPS}/${group.id}`,
        () => ({
          members,
          pendingMembers: pendingMembers.length ? pendingMembers : null
        }),
        ''
      )

      groupStore.addGroup({
        id: group.id,
        members,
        pendingMembers: pendingMembers.length ? pendingMembers : null
      })
    }
  }

  async function submitUpdateUser() {
    const { uid } = editForm.value
    const newName = normalizeName(editForm.value.name)
    const newMobile = normalizeMobile(editForm.value.mobile)

    if (!newName) return showError('Name is required')
    if (newName.length < 3) {
      return showError('Name should be at least 3 characters')
    }
    if (!isValidName(newName)) {
      return showError('Name can only contain alphabets and single spaces')
    }
    if (!newMobile) return showError('Mobile number is required')
    if (!isValidMobile(newMobile)) {
      return showError('Mobile number must be 11 digits starting with 03')
    }

    const user = await read(`${DB_NODES.USERS}/${uid}`)
    if (!user) return showError('User not found')
    if (!ensureUsersInteractionAllowed(user)) return
    if (user.deleteRequest)
      return showError('A delete request is pending for this user')
    if (user.updateRequest)
      return showError('An update request is pending for this user')

    const existingUsers = (await read(DB_NODES.USERS, false)) || {}
    const mobileTaken = Object.entries(existingUsers).some(
      ([otherUid, otherUser]) =>
        otherUid !== uid &&
        normalizeMobile(otherUser?.mobile || '') === newMobile
    )
    if (mobileTaken) {
      return showError('An account with this mobile number already exists')
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
      'User updated successfully'
    )
    userStore.addUser({
      uid,
      name: newName,
      mobile: newMobile,
      maskedMobile: maskMobile(newMobile)
    })

    await syncUserProfileInGroups(uid, { name: newName, mobile: newMobile })

    // Notify each group the user belongs to so co-members are informed
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((member) => (member.uid || member.mobile) === uid)
    )
    for (const group of memberGroups) {
      const coMembers = (group.members || []).filter(
        (member) => (member.uid || member.mobile) !== uid
      )
      if (!coMembers.length) continue

      const changeParts = []
      if (nameChanged) {
        changeParts.push(`changed their name from "${oldName}" to "${newName}"`)
      }
      if (mobileChanged) {
        changeParts.push('updated their mobile number')
      }

      let updatedGroup = { ...group }
      for (const member of coMembers) {
        updatedGroup = appendNotificationForUser(
          updatedGroup,
          member.uid || member.mobile,
          {
            id: Date.now().toString() + Math.random(),
            type: 'member-renamed',
            message: `${newName} has ${changeParts.join(
              ' and '
            )} in group "${group.name}".`,
            updatedBy: uid,
            timestamp: Date.now()
          }
        )
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

      const ownerMobiles = getGroupOwnerMobiles(uid)
      await ElMessageBox.confirm(
        `Are you sure you want to delete <strong>${name}</strong>?${
          ownerMobiles.length > 0
            ? '<br><br>This user is in one or more groups. All group owners must approve before deletion.'
            : ''
        }`,
        'Delete User',
        {
          confirmButtonText: 'Proceed',
          cancelButtonText: 'Cancel',
          type: 'error',
          dangerouslyUseHTMLString: true
        }
      )

      const user = await read(`${DB_NODES.USERS}/${uid}`)
      if (!user) return showError('User not found')
      if (user.deleteRequest)
        return showError('A delete request is already pending for this user')
      if (user.updateRequest)
        return showError(
          'An update request is pending. Cancel it before deleting.'
        )

      const me = activeUser.value

      if (ownerMobiles.length === 0) {
        // Delete from Realtime Database
        await deleteData(`${DB_NODES.USERS}/${uid}`, `User ${name} deleted`)
        userStore.setUsers([...userStore.getUsers].filter((u) => u.uid !== uid))

        // If user is deleting themselves, also delete from Firebase Auth
        if (uid === me) {
          try {
            const currentUser = auth.currentUser
            if (currentUser) {
              await deleteUser(currentUser)
            }
          } catch (authError) {
            console.error('Error deleting user from Firebase Auth:', authError)
            showError(
              'Account deleted from database but Firebase Authentication deletion failed. You may need to sign in again to complete deletion.'
            )
          }

          authStore.setActiveUser(null)
          groupStore.setActiveGroup(null)
          authStore.setSessionToken(null)
          sessionStorage.removeItem('_session')
        }
      } else {
        const deleteRequest = {
          requestedBy: me,
          requiredApprovals: ownerMobiles,
          approvals: []
        }
        await updateData(
          `${DB_NODES.USERS}/${uid}`,
          () => ({ deleteRequest }),
          'Delete request sent to group owners for approval'
        )
        userStore.addUser({ uid, deleteRequest })
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error?.message || 'Failed to process delete request')
      }
    }
  }

  // --- Approve Request ---

  async function approveRequest(userUid, type) {
    const me = activeUser.value
    const user = await read(`${DB_NODES.USERS}/${userUid}`)
    if (!user) return showError('User not found')
    if (!ensureUsersInteractionAllowed(user)) return

    const request = type === 'delete' ? user.deleteRequest : user.updateRequest
    if (!request) return showError('Request not found or already resolved')

    const newApprovals = [...(request.approvals || []), { uid: me, mobile: me }]
    const allApproved = request.requiredApprovals.every((r) =>
      newApprovals.some((a) => (a.uid || a.mobile) === r)
    )

    // Only delete requests go through approval; update requests are applied directly
    if (type === 'delete' && allApproved) {
      // Delete from Realtime Database
      await deleteData(
        `${DB_NODES.USERS}/${userUid}`,
        `User ${user.name} deleted`
      )
      userStore.setUsers(
        [...userStore.getUsers].filter((u) => u.uid !== userUid)
      )

      // If user is deleting themselves, also delete from Firebase Auth
      if (userUid === me) {
        try {
          const currentUser = auth.currentUser
          if (currentUser) {
            await deleteUser(currentUser)
          }
        } catch (authError) {
          console.error('Error deleting user from Firebase Auth:', authError)
          showError(
            'Account deleted from database but Firebase Authentication deletion failed.'
          )
        }

        authStore.setActiveUser(null)
        groupStore.setActiveGroup(null)
        authStore.setSessionToken(null)
        sessionStorage.removeItem('_session')
      }
    } else {
      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      const updatedRequest = { ...request, approvals: newApprovals }
      await updateData(
        `${DB_NODES.USERS}/${userUid}`,
        () => ({ [field]: updatedRequest }),
        'Approval recorded'
      )
      userStore.addUser({ uid: userUid, [field]: updatedRequest })
    }
  }

  // --- Reject Request ---

  async function rejectRequest(userUid, type, userName) {
    try {
      const targetUser = await read(`${DB_NODES.USERS}/${userUid}`)
      if (!targetUser) return showError('User not found')
      if (!ensureUsersInteractionAllowed(targetUser)) return

      await ElMessageBox.confirm(
        `Reject the ${type} request for <strong>${userName}</strong>?`,
        'Reject Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
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
                message: `Your account deletion request was rejected by ${
                  userStore.getUserByUid(activeUser.value)?.name ||
                  activeUser.value
                }.`,
                rejectedBy: activeUser.value,
                timestamp: Date.now()
              }
            }
          : {}
      await updateData(
        `${DB_NODES.USERS}/${userUid}`,
        () => ({ [field]: null, ...rejectionData }),
        `${type === 'delete' ? 'Delete' : 'Update'} request rejected`
      )
      userStore.addUser({ uid: userUid, [field]: null, ...rejectionData })
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || 'Failed to reject request')
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
  const selectedUserGroups = ref([])
  const selectedUserName = ref('')

  function openGroupsDialog(row) {
    if (!ensureUsersInteractionAllowed(row)) return
    selectedUserGroups.value = getUserGroups(row.uid)
    selectedUserName.value = row.name
    groupsDialogVisible.value = true
  }

  return {
    searchQuery,
    isPageLoading,
    sortOrder,
    sharedGroupsOnly,
    hideBlockedUsers,
    filteredUsers,
    editDialogVisible,
    editForm,
    myPendingApprovals,
    displayMobile,
    getUserGroups,
    canManage,
    activeUser,
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
    resetEditUserForm,
    activeUserIsBlocked
  }
}
