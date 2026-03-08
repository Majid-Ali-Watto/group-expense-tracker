import { ref, computed, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import { showError } from '../utils/showAlerts'
import { maskMobile } from '../utils/maskMobile'
import { auth, deleteUser } from '../firebase'

export const Users = () => {
  const userStore = store()
  const { updateData, read, deleteData } = useFireBase()

  const editDialogVisible = ref(false)
  const editForm = ref({ name: '', mobile: '' })

  const users = computed(() => userStore.getUsers || [])
  const groups = computed(() => userStore.getGroups || [])
  const activeUser = computed(() => userStore.getActiveUser)

  const searchQuery = ref('')

  const activeGroupMobiles = computed(() => {
    const groupId = userStore.getActiveGroup
    const group = groupId ? userStore.getGroupById(groupId) : null
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
    if (!query) return users.value
    return users.value.filter((u) => {
      return (
        u.name.toLowerCase().includes(query) ||
        displayMobile(u.mobile).toLowerCase().includes(query) ||
        getUserGroups(u.mobile).some((g) => g.toLowerCase().includes(query))
      )
    })
  })

  // Load full user data (app.js only loads minimal fields)
  // Only show verified users to prevent unverified accounts from being added to groups
  onMounted(async () => {
    const rawUsers = await read('users')
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
          updateRequest: u.updateRequest || null
        })
      }
    })
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

  // Pending delete/update requests that the current user needs to approve
  const myPendingApprovals = computed(() => {
    const me = activeUser.value
    if (!me) return []
    const result = []
    users.value.forEach((u) => {
      const check = (req, type) => {
        if (
          req &&
          req.requiredApprovals?.includes(me) &&
          !req.approvals?.some((a) => a.mobile === me)
        ) {
          result.push({ user: u, type, request: req })
        }
      }
      check(u.deleteRequest, 'delete')
      check(u.updateRequest, 'update')
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

    const user = await read(`users/${mobile}`)
    if (!user) return showError('User not found')
    if (user.deleteRequest)
      return showError('A delete request is pending for this user')
    if (user.updateRequest)
      return showError('An update request is already pending for this user')

    const me = activeUser.value
    const myName = userStore.getUserByMobile(me)?.name
    const requiredApprovals = getGroupOwnerMobiles(mobile)

    if (requiredApprovals.length === 0) {
      const updated = { ...user, name: newName }
      await updateData(
        `users/${mobile}`,
        () => updated,
        'User updated successfully'
      )
      userStore.addUser({ mobile, name: newName })
    } else {
      const updateRequest = {
        requestedBy: me,
        requestedByName: myName,
        newName,
        requiredApprovals,
        approvals: []
      }
      await updateData(
        `users/${mobile}`,
        () => ({ updateRequest }),
        'Update request sent to group owners for approval'
      )
      userStore.addUser({ mobile, updateRequest })
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

      const user = await read(`users/${mobile}`)
      if (!user) return showError('User not found')
      if (user.deleteRequest)
        return showError('A delete request is already pending for this user')
      if (user.updateRequest)
        return showError(
          'An update request is pending. Cancel it before deleting.'
        )

      const me = activeUser.value
      const myName = userStore.getUserByMobile(me)?.name

      if (ownerMobiles.length === 0) {
        // Delete from Realtime Database
        await deleteData(`users/${mobile}`, `User ${name} deleted`)
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

          userStore.setActiveUser(null)
          userStore.setActiveGroup(null)
          userStore.setSessionToken(null)
          sessionStorage.removeItem('_session')
        }
      } else {
        const deleteRequest = {
          requestedBy: me,
          requestedByName: myName,
          requiredApprovals: ownerMobiles,
          approvals: []
        }
        await updateData(
          `users/${mobile}`,
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
    const myName = userStore.getUserByMobile(me)?.name
    const user = await read(`users/${userMobile}`)
    if (!user) return showError('User not found')

    const request = type === 'delete' ? user.deleteRequest : user.updateRequest
    if (!request) return showError('Request not found or already resolved')

    const newApprovals = [
      ...(request.approvals || []),
      { mobile: me, name: myName }
    ]
    const allApproved = request.requiredApprovals.every((r) =>
      newApprovals.some((a) => a.mobile === r)
    )

    if (type === 'delete' && allApproved) {
      // Delete from Realtime Database
      await deleteData(`users/${userMobile}`, `User ${user.name} deleted`)
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

        userStore.setActiveUser(null)
        userStore.setActiveGroup(null)
        userStore.setSessionToken(null)
        sessionStorage.removeItem('_session')
      }
    } else if (type === 'update' && allApproved) {
      const updated = { ...user, name: request.newName, updateRequest: null }
      await updateData(
        `users/${userMobile}`,
        () => updated,
        `User name updated to "${request.newName}"`
      )
      userStore.addUser({
        mobile: userMobile,
        name: request.newName,
        updateRequest: null
      })
    } else {
      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      const updatedRequest = { ...request, approvals: newApprovals }
      await updateData(
        `users/${userMobile}`,
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

      const user = await read(`users/${userMobile}`)
      if (!user) return showError('User not found')

      const field = type === 'delete' ? 'deleteRequest' : 'updateRequest'
      await updateData(
        `users/${userMobile}`,
        () => ({ [field]: null }),
        `${type === 'delete' ? 'Delete' : 'Update'} request rejected`
      )
      userStore.addUser({ mobile: userMobile, [field]: null })
    } catch (e) {
      if (e !== 'cancel') showError(e?.message || 'Failed to reject request')
    }
  }

  return {
    searchQuery,
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
    rejectRequest
  }
}
