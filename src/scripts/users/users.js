import { ref, computed, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { DB_NODES } from '../../constants/db-nodes'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import { showError } from '../../utils/showAlerts'
import { maskMobile } from '../../utils/maskMobile'
import { auth, deleteUser } from '../../firebase'
import { useDebouncedRef } from '../../utils/useDebouncedRef'
import { appendNotificationForUser } from '../../utils/recordNotifications'

export const Users = () => {
  const isPageLoading = ref(true)
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { updateData, read, deleteData, setData } = useFireBase()

  const editDialogVisible = ref(false)
  const editForm = ref({ name: '', mobile: '' })

  const users = computed(() => userStore.getUsers || [])
  const groups = computed(() => groupStore.getGroups || [])
  const activeUser = computed(() => authStore.getActiveUser)

  const searchQuery = useDebouncedRef('', 300)
  const sortOrder = ref('') // '' | 'asc' | 'desc'
  const sharedGroupsOnly = ref(false)

  const activeGroupMobiles = computed(() => {
    const groupId = groupStore.getActiveGroup
    const group = groupId ? groupStore.getGroupById(groupId) : null
    return (group?.members || []).map((m) => m.mobile)
  })

  function displayMobile(targetMobile) {
    if (!targetMobile) return ''
    if (targetMobile === activeUser.value) return targetMobile
    if (activeGroupMobiles.value.includes(targetMobile)) return targetMobile
    return (
      userStore.getUserByMobile(targetMobile)?.maskedMobile ||
      maskMobile(targetMobile)
    )
  }

  function getUserGroups(mobile) {
    return groups.value
      .filter((g) => g.members?.some((m) => m.mobile === mobile))
      .map((g) => g.name)
  }

  const filteredUsers = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    let result = users.value

    if (query) {
      result = result.filter((u) => {
        return (
          u.name.toLowerCase().includes(query) ||
          displayMobile(u.mobile).toLowerCase().includes(query) ||
          getUserGroups(u.mobile).some((g) => g.toLowerCase().includes(query))
        )
      })
    }

    if (sharedGroupsOnly.value) {
      const me = activeUser.value
      const sharedMobiles = new Set(
        groups.value
          .filter((g) => g.members?.some((m) => m.mobile === me))
          .flatMap((g) => g.members?.map((m) => m.mobile) || [])
      )
      result = result.filter(
        (u) => u.mobile !== me && sharedMobiles.has(u.mobile)
      )
    }

    if (sortOrder.value === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOrder.value === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    }

    return result
  })

  // Load full user data (app.js only loads minimal fields)
  // Only show verified users to prevent unverified accounts from being added to groups
  onMounted(async () => {
    try {
      const rawUsers = await read(DB_NODES.USERS)
      if (!rawUsers) return

      Object.keys(rawUsers).forEach((mobile) => {
        const u = rawUsers[mobile]
        // Only include users who have verified their email
        // emailVerified is set to true on first successful login
        if (u.emailVerified === true) {
          userStore.addUser({
            mobile,
            name: u.name || '',
            addedBy: u.addedBy || null,
            maskedMobile: maskMobile(mobile),
            deleteRequest: u.deleteRequest || null,
            updateRequest: u.updateRequest || null,
            bugResolver: u.bugResolver === true
          })
        }
      })
    } finally {
      isPageLoading.value = false
    }
  })

  // --- Permission helpers ---

  function canManage(row) {
    const me = activeUser.value
    if (!me) return false
    return row.mobile === me || row.addedBy === me
  }

  // Unique group owner mobiles of all groups the user is a member of
  function getGroupOwnerMobiles(mobile) {
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((m) => m.mobile === mobile)
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
        !req.approvals?.some((a) => a.mobile === me)
      ) {
        result.push({ user: u, type: 'delete', request: req })
      }
    })
    return result
  })

  // --- Edit User ---

  function openEditUser(row) {
    editForm.value = { name: row.name, mobile: row.mobile }
    editDialogVisible.value = true
  }

  async function submitUpdateUser() {
    const { mobile, name } = editForm.value
    const newName = name.trim().replace(/\s+/g, ' ')

    if (!newName) return showError('Name is required')
    if (!/^[a-zA-Z]+(\s[a-zA-Z]+)*$/.test(newName)) {
      return showError('Name can only contain alphabets and single spaces')
    }

    const user = await read(`${DB_NODES.USERS}/${mobile}`)
    if (!user) return showError('User not found')
    if (user.deleteRequest)
      return showError('A delete request is pending for this user')

    const oldName = user.name

    // Apply the name change directly — it is profile metadata and does not affect balances or membership
    const updated = { ...user, name: newName }
    await updateData(
      `${DB_NODES.USERS}/${mobile}`,
      () => updated,
      'User updated successfully'
    )
    userStore.addUser({ mobile, name: newName })

    // Notify each group the user belongs to so co-members are informed
    const memberGroups = groups.value.filter((g) =>
      g.members?.some((m) => m.mobile === mobile)
    )
    for (const group of memberGroups) {
      const coMembers = (group.members || []).filter((m) => m.mobile !== mobile)
      if (!coMembers.length) continue

      let updatedGroup = { ...group }
      for (const member of coMembers) {
        updatedGroup = appendNotificationForUser(updatedGroup, member.mobile, {
          id: Date.now().toString() + Math.random(),
          type: 'member-renamed',
          message: `${oldName} has changed their name to "${newName}" in group "${group.name}".`,
          updatedBy: mobile,
          timestamp: Date.now()
        })
      }

      await setData(
        `${DB_NODES.GROUPS}/${group.id}/notifications`,
        updatedGroup.notifications,
        ''
      )
    }

    editDialogVisible.value = false
  }

  // --- Delete User ---

  async function requestDeleteUser(mobile, name) {
    try {
      const ownerMobiles = getGroupOwnerMobiles(mobile)
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
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )

      const user = await read(`${DB_NODES.USERS}/${mobile}`)
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
        await deleteData(`${DB_NODES.USERS}/${mobile}`, `User ${name} deleted`)
        userStore.setUsers(
          [...userStore.getUsers].filter((u) => u.mobile !== mobile)
        )

        // If user is deleting themselves, also delete from Firebase Auth
        if (mobile === me) {
          try {
            const currentUser = auth.currentUser
            if (currentUser) {
              await deleteUser(currentUser)
              console.log('User deleted from Firebase Authentication')
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
          `${DB_NODES.USERS}/${mobile}`,
          () => ({ deleteRequest }),
          'Delete request sent to group owners for approval'
        )
        userStore.addUser({ mobile, deleteRequest })
      }
    } catch (error) {
      if (error !== 'cancel') {
        showError(error?.message || 'Failed to process delete request')
      }
    }
  }

  // --- Approve Request ---

  async function approveRequest(userMobile, type) {
    const me = activeUser.value
    const user = await read(`${DB_NODES.USERS}/${userMobile}`)
    if (!user) return showError('User not found')

    const request = type === 'delete' ? user.deleteRequest : user.updateRequest
    if (!request) return showError('Request not found or already resolved')

    const newApprovals = [...(request.approvals || []), { mobile: me }]
    const allApproved = request.requiredApprovals.every((r) =>
      newApprovals.some((a) => a.mobile === r)
    )

    // Only delete requests go through approval; update requests are applied directly
    if (type === 'delete' && allApproved) {
      // Delete from Realtime Database
      await deleteData(
        `${DB_NODES.USERS}/${userMobile}`,
        `User ${user.name} deleted`
      )
      userStore.setUsers(
        [...userStore.getUsers].filter((u) => u.mobile !== userMobile)
      )

      // If user is deleting themselves, also delete from Firebase Auth
      if (userMobile === me) {
        try {
          const currentUser = auth.currentUser
          if (currentUser) {
            await deleteUser(currentUser)
            console.log('User deleted from Firebase Authentication')
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
        `${DB_NODES.USERS}/${userMobile}`,
        () => ({ [field]: updatedRequest }),
        'Approval recorded'
      )
      userStore.addUser({ mobile: userMobile, [field]: updatedRequest })
    }
  }

  // --- Reject Request ---

  async function rejectRequest(userMobile, type, userName) {
    try {
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

      const user = await read(`${DB_NODES.USERS}/${userMobile}`)
      if (!user) return showError('User not found')

      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      await updateData(
        `${DB_NODES.USERS}/${userMobile}`,
        () => ({ [field]: null }),
        `${type === 'delete' ? 'Delete' : 'Update'} request rejected`
      )
      userStore.addUser({ mobile: userMobile, [field]: null })
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || 'Failed to reject request')
    }
  }

  const editUserFormRef = ref(null)
  const createGroupDialogVisible = ref(false)
  const createGroupForMobile = ref(null)

  function openCreateGroup(mobile) {
    createGroupForMobile.value = mobile
    createGroupDialogVisible.value = true
  }

  const groupsDialogVisible = ref(false)
  const selectedUserGroups = ref([])
  const selectedUserName = ref('')

  function openGroupsDialog(row) {
    selectedUserGroups.value = getUserGroups(row.mobile)
    selectedUserName.value = row.name
    groupsDialogVisible.value = true
  }

  function handleEditUserSave() {
    editUserFormRef.value.validate((valid) => {
      if (!valid) return
      submitUpdateUser()
    })
  }

  return {
    searchQuery,
    isPageLoading,
    sortOrder,
    sharedGroupsOnly,
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
    editUserFormRef,
    createGroupDialogVisible,
    createGroupForMobile,
    openCreateGroup,
    groupsDialogVisible,
    selectedUserGroups,
    selectedUserName,
    openGroupsDialog,
    handleEditUserSave
  }
}
