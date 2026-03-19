import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import useFireBase from '../../api/firebase-apis'
import { showError, showSuccess } from '../../utils/showAlerts'
import { ElMessageBox } from 'element-plus'
import { onValue, off } from '../../firebase'
import { maskMobile } from '../../utils/maskMobile'
import {
  appendNotificationForUser,
  removeNotificationForUser
} from '../../utils/recordNotifications'
import {
  formatMemberDisplay,
  formatUserDisplay
} from '../../utils/user-display'
import {
  isMemberOfGroup,
  allMembersApproved,
  allMembersApprovedJoinRequest,
  hasEditRequest,
  allAffectedMembersApprovedEdit,
  isUserAffectedByEdit,
  hasUserApprovedEditRequest,
  hasAddMemberRequest,
  allMembersApprovedAddMember,
  hasUserApprovedAddMemberRequest,
  hasPendingRequest,
  hasLeaveRequest,
  getLeaveRequests,
  allMembersApprovedLeave,
  getLeaveApprovals,
  hasUserApprovedLeaveRequest,
  hasDeleteRequest,
  getDeleteApprovals,
  hasUserApprovedDeletion,
  hasUserApprovedJoinRequest,
  hasUserApprovedOwnershipTransfer
} from '../../helpers/users'

export const Groups = () => {
  const showCreateGroup = ref(false)
  const searchQuery = ref('')
  const sortOrder = ref('') // '' | 'asc' | 'desc'
  const filterByUser = ref('')
  const pinnedGroupIds = ref([])

  const openCreateGroup = () => {
    showCreateGroup.value = true
  }

  const closeCreateGroup = () => {
    showCreateGroup.value = false
  }

  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const { read, updateData, removeData, dbRef, setData } = useFireBase()

  const groups = ref([])
  const groupBalances = ref({})
  let groupsListener = null

  // All unique members across all groups (excluding the current user), sorted by name
  const allGroupMembers = computed(() => {
    const me = authStore.getActiveUser
    const seen = new Set()
    const members = []
    for (const g of groups.value) {
      for (const m of g.members || []) {
        if (m.mobile !== me && !seen.has(m.mobile)) {
          seen.add(m.mobile)
          members.push({
            mobile: m.mobile,
            name:
              m.name || userStore.getUserByMobile(m.mobile)?.name || m.mobile
          })
        }
      }
    }
    return members.sort((a, b) => a.name.localeCompare(b.name))
  })

  const allGroupMemberOptions = computed(() =>
    allGroupMembers.value.map((member) => ({
      label: `${member.name} (${member.mobile})`,
      value: member.mobile
    }))
  )

  // Filtered groups based on search query, user filter, and sort order
  const filteredGroups = computed(() => {
    let result = groups.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase().trim()
      result = result.filter((group) => {
        if (group.name && group.name.toLowerCase().includes(query)) return true
        if (group.id && group.id.toLowerCase().includes(query)) return true
        if (
          group.ownerMobile &&
          group.ownerMobile.toLowerCase().includes(query)
        )
          return true
        const ownerName = userStore.getUserByMobile(group.ownerMobile)?.name
        if (ownerName && ownerName.toLowerCase().includes(query)) return true
        if (
          group.members &&
          group.members.some(
            (m) =>
              (m.name && m.name.toLowerCase().includes(query)) ||
              (m.mobile && m.mobile.toLowerCase().includes(query))
          )
        )
          return true
        return false
      })
    }

    if (filterByUser.value) {
      result = result.filter((g) =>
        g.members?.some((m) => m.mobile === filterByUser.value)
      )
    }

    if (sortOrder.value === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortOrder.value === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    }

    return result
  })

  const joinedGroups = computed(() => {
    const filtered = filteredGroups.value.filter((g) => isMemberOfGroup(g))
    const pinned = filtered.filter((g) => pinnedGroupIds.value.includes(g.id))
    const unpinned = filtered.filter(
      (g) => !pinnedGroupIds.value.includes(g.id)
    )
    return [...pinned, ...unpinned]
  })

  // Groups where the current user has a pending invitation (was added but hasn't accepted yet)
  const pendingInvitations = computed(() => {
    const me = authStore.getActiveUser
    return filteredGroups.value.filter(
      (g) =>
        !isMemberOfGroup(g) &&
        (g.pendingMembers || []).some((m) => m.mobile === me)
    )
  })

  const pendingInvitationIds = computed(
    () => new Set(pendingInvitations.value.map((g) => g.id))
  )

  const otherGroups = computed(() =>
    filteredGroups.value.filter(
      (g) => !isMemberOfGroup(g) && !pendingInvitationIds.value.has(g.id)
    )
  )

  async function acceptInvitation(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    const me = authStore.getActiveUser
    const myName = userStore.getUserByMobile(me)?.name || me
    const newMembers = [...(group.members || []), { mobile: me, name: myName }]
    const newPending = (group.pendingMembers || []).filter(
      (m) => m.mobile !== me
    )
    await updateData(
      `groups/${groupId}`,
      () => ({
        members: newMembers,
        pendingMembers: newPending.length ? newPending : null
      }),
      'You have joined the group!'
    )
    groupStore.addGroup({
      ...group,
      members: newMembers,
      pendingMembers: newPending
    })
  }

  async function rejectInvitation(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    const me = authStore.getActiveUser
    const newPending = (group.pendingMembers || []).filter(
      (m) => m.mobile !== me
    )
    await updateData(
      `groups/${groupId}`,
      () => ({ pendingMembers: newPending.length ? newPending : null }),
      'Invitation declined.'
    )
    groupStore.addGroup({ ...group, pendingMembers: newPending })
  }

  const editDialogVisible = ref(false)
  const editingGroupId = ref(null)
  const originalMembers = ref([])

  const editForm = ref({
    name: '',
    description: '',
    members: []
  })

  // ========== Pin Helpers ==========
  function getPinsKey() {
    return `pinnedGroups_${authStore.getActiveUser}`
  }

  function loadPins() {
    try {
      const stored = localStorage.getItem(getPinsKey())
      pinnedGroupIds.value = stored ? JSON.parse(stored) : []
    } catch {
      pinnedGroupIds.value = []
    }
  }

  function savePins() {
    localStorage.setItem(getPinsKey(), JSON.stringify(pinnedGroupIds.value))
  }

  function isPinned(groupId) {
    return pinnedGroupIds.value.includes(groupId)
  }

  function togglePin(groupId) {
    if (isPinned(groupId)) {
      pinnedGroupIds.value = pinnedGroupIds.value.filter((id) => id !== groupId)
    } else {
      pinnedGroupIds.value = [...pinnedGroupIds.value, groupId]
    }
    savePins()
  }

  // Get join requests for a group
  function getJoinRequests(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    return group?.joinRequests || []
  }

  onMounted(async () => {
    loadPins()

    // Fetch users — needed for group creation and member display
    // Only include verified users to prevent unverified accounts from being added to groups
    try {
      const users = await read('users')
      if (users) {
        const list = Object.keys(users)
          .filter((k) => users[k].emailVerified === true) // Only verified users
          .map((k) => ({
            mobile: k,
            name: users[k].name || '',
            maskedMobile: maskMobile(k)
          }))
        userStore.setUsers(list)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }

    // Set up real-time listener for groups
    const groupsRef = dbRef('groups')

    groupsListener = onValue(
      groupsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          groups.value = Object.keys(data).map((k) => ({ id: k, ...data[k] }))
          groupStore.setGroups(groups.value)

          // Auto-select the user's group on first load if none is already active
          if (!groupStore.getActiveGroup) {
            const mobile = authStore.getActiveUser
            const myGroup = groups.value.find((g) =>
              (g.members || []).some((m) => m.mobile === mobile)
            )
            if (myGroup) groupStore.setActiveGroup(myGroup.id)
          }
        } else {
          groups.value = []
          groupStore.setGroups([])
        }
      },
      (error) => {
        console.error('Error loading groups:', error)
      }
    )
  })

  onUnmounted(() => {
    // Clean up the listener when component is unmounted
    if (groupsListener) {
      const groupsRef = dbRef('groups')
      off(groupsRef, 'value', groupsListener)
    }
  })

  // ========== Per-user financial position (expenses + loans) ==========
  async function loadGroupBalances(groupId, groupType = 'joined') {
    if (groupType !== 'joined') return
    const currentUser = authStore.getActiveUser
    if (!currentUser || !groupId) return

    const cached = groupBalances.value[groupId]
    if (cached && cached.loaded) return

    groupBalances.value[groupId] = { ...(cached || {}), loading: true }

    let expensesNet = 0
    let loansNet = 0

    try {
      // Shared expenses (payments)
      const currentMonth = new Date()
      const monthNode = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
      const paymentsByMonth =
        (await read(`payments/${groupId}/${monthNode}`, false)) || {}

      Object.values(paymentsByMonth || {}).forEach((payment) => {
        const amount = parseFloat(payment.amount) || 0
        if (!amount) return

        // User's share (debit)
        let share = 0
        if (Array.isArray(payment.split)) {
          const selfSplit = payment.split.find((s) => s.mobile === currentUser)
          share = parseFloat(selfSplit?.amount) || 0
        } else if (Array.isArray(payment.participants)) {
          const isParticipant = payment.participants.some((p) => {
            if (typeof p === 'string') return p === currentUser
            return p?.mobile === currentUser || p?.userId === currentUser
          })
          if (isParticipant) {
            const equal =
              payment.participants.length > 0
                ? amount / payment.participants.length
                : 0
            share = equal
          }
        }

        // User's paid amount (credit)
        let credit = 0
        if (payment.payerMode === 'multiple' && Array.isArray(payment.payers)) {
          const selfPayer = payment.payers.find((p) => p.mobile === currentUser)
          credit = parseFloat(selfPayer?.amount) || 0
        } else if (payment.payer === currentUser) {
          credit = amount
        }

        expensesNet += credit - share
      })

      // Shared loans
      const loansMonthNode =
        (await read(`loans/${groupId}/${monthNode}`, false)) || null
      const loansSource =
        loansMonthNode || (await read(`loans/${groupId}`, false)) || {} // fallback for legacy flat storage

      const isSameMonth = (dateStr) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        return (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        )
      }

      Object.values(loansSource).forEach((loan) => {
        if (!loansMonthNode && !isSameMonth(loan?.date)) return
        const amt = parseFloat(loan.amount) || 0
        if (!amt) return
        if (loan.giver === currentUser) loansNet += amt
        if (loan.receiver === currentUser) loansNet -= amt
      })
    } catch (error) {
      console.error('Failed to load group balances', error)
    }

    groupBalances.value[groupId] = {
      loaded: true,
      loading: false,
      expenses: parseFloat(expensesNet.toFixed(2)),
      loans: parseFloat(loansNet.toFixed(2))
    }
  }

  function getGroupBalances(groupId) {
    return (
      groupBalances.value[groupId] || {
        loading: false,
        expenses: 0,
        loans: 0
      }
    )
  }

  async function hideNotification(groupId, notificationId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const { changed, record } = removeNotificationForUser(
        group,
        mobile,
        notificationId
      )
      if (!changed) return

      await updateData(`groups/${groupId}`, () => record, '')

      const groupIndex = groups.value.findIndex((g) => g.id === groupId)
      if (groupIndex !== -1) {
        groups.value[groupIndex] = record
        groupStore.updateGroup(record)
      }
    } catch (err) {
      showError(err.message || err)
    }
  }

  function createNotification(group, message, type = 'rejection') {
    const notification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      rejectedByName:
        userStore.getUserByMobile(authStore.getActiveUser)?.name ||
        authStore.getActiveUser,
      timestamp: Date.now()
    }

    // Notify all members except the one performing the action
    group.members.forEach((member) => {
      if (member.mobile !== authStore.getActiveUser) {
        appendNotificationForUser(group, member.mobile, notification)
      }
    })
  }

  // Transfer Ownership Dialog
  const transferDialogVisible = ref(false)
  const transferOwnershipGroupId = ref(null)
  const newOwnerMobile = ref('')

  const transferOwnershipMembers = computed(() => {
    if (!transferOwnershipGroupId.value) return []
    const group = groups.value.find(
      (g) => g.id === transferOwnershipGroupId.value
    )
    if (!group) return []
    return group.members.filter((m) => m.mobile !== authStore.getActiveUser)
  })

  const transferOwnershipOptions = computed(() =>
    transferOwnershipMembers.value.map((member) => ({
      label: formatMemberDisplay(storeProxy, member, {
        group: groups.value.find((g) => g.id === transferOwnershipGroupId.value)
      }),
      value: member.mobile
    }))
  )

  // Add Member Dialog
  const addMemberDialogVisible = ref(false)
  const addMemberGroupId = ref(null)
  const selectedMemberToAdd = ref('')

  const availableUsersToAdd = computed(() => {
    if (!addMemberGroupId.value) return []
    const group = groups.value.find((g) => g.id === addMemberGroupId.value)
    if (!group) return []

    const currentMemberMobiles = group.members.map((m) => m.mobile)
    return userStore.getUsers.filter(
      (u) => !currentMemberMobiles.includes(u.mobile)
    )
  })

  const availableUsersToAddOptions = computed(() =>
    availableUsersToAdd.value.map((user) => ({
      label: formatUserDisplay(storeProxy, user.mobile, {
        name: user.name,
        preferMasked: true
      }),
      value: user.mobile
    }))
  )

  function showAddMemberDialog(groupId) {
    addMemberGroupId.value = groupId
    selectedMemberToAdd.value = ''
    addMemberDialogVisible.value = true
  }

  async function submitAddMemberRequest() {
    if (!selectedMemberToAdd.value) {
      return showError('Please select a member to add')
    }

    const user = userStore.getUserByMobile(selectedMemberToAdd.value)
    if (!user) {
      return showError('User not found')
    }

    const newMember = {
      mobile: user.mobile,
      name: user.name
    }

    await requestAddMember(addMemberGroupId.value, newMember)
    addMemberDialogVisible.value = false
    selectedMemberToAdd.value = ''
    addMemberGroupId.value = null
  }

  // Request to join a group
  async function requestToJoinGroup(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Initialize joinRequests array if it doesn't exist
      if (!group.joinRequests) {
        group.joinRequests = []
      }

      // Add request with empty approvals array
      group.joinRequests.push({
        mobile,
        name: userName,
        approvals: [] // Initialize approvals for all members to vote
      })

      await updateData(`groups/${groupId}`, () => group, 'Join request sent')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Join request sent to group owner')
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Cancel join request
  async function cancelJoinRequest(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser

      // Remove from join requests
      group.joinRequests = (group.joinRequests || []).filter(
        (r) => r.mobile !== mobile
      )

      await updateData(`groups/${groupId}`, () => group, 'Request cancelled')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Join request cancelled')
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Member approves join request
  async function approveMemberJoinRequest(groupId, requestMobile) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Find the join request
      const request = group.joinRequests.find((r) => r.mobile === requestMobile)
      if (!request) return

      // Initialize approvals if not exists
      if (!request.approvals) {
        request.approvals = []
      }

      // Add approval
      request.approvals.push({ mobile, name: userName })

      await updateData(`groups/${groupId}`, () => group, 'Approval recorded')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('You have approved this join request')
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Final approval - adds user to group after all members approved
  // Can be done by owner or any member if owner doesn't exist
  async function finalApproveJoinRequest(groupId, request) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      // Verify all members have approved
      if (!allMembersApprovedJoinRequest(group, request.mobile)) {
        return showError('All members must approve before adding to group')
      }

      // Add user to members
      if (!group.members.find((m) => m.mobile === request.mobile)) {
        group.members.push({ mobile: request.mobile, name: request.name })
      }

      // If group has no owner or owner is not a member, set the new member as owner
      const ownerExists = group.members.some(
        (m) => m.mobile === group.ownerMobile
      )
      if (!group.ownerMobile || !ownerExists) {
        group.ownerMobile = request.mobile
      }

      // Remove from join requests
      group.joinRequests = (group.joinRequests || []).filter(
        (r) => r.mobile !== request.mobile
      )

      await updateData(`groups/${groupId}`, () => group, 'Member added')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess(`${request.name} has been added to the group`)
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Reject join request
  async function rejectJoinRequest(groupId, mobile) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const requestUser = group.joinRequests?.find((r) => r.mobile === mobile)
      const requestUserName = requestUser?.name || mobile

      // Remove from join requests
      group.joinRequests = (group.joinRequests || []).filter(
        (r) => r.mobile !== mobile
      )

      // Create notification for members
      createNotification(
        group,
        `Join request from ${requestUserName} was rejected`
      )

      await updateData(`groups/${groupId}`, () => group, 'Request rejected')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Join request rejected')
    } catch (err) {
      showError(err.message || err)
    }
  }

  function selectGroup(id) {
    const group = groups.value.find((g) => g.id === id)
    if (!group) return

    // Check if user is a member
    if (!isMemberOfGroup(group)) {
      return showError('You must be a member of this group to select it')
    }

    groupStore.setActiveGroup(id)
    showSuccess(`Selected group: ${group.name}`)
  }

  // Request group deletion (owner only)
  async function requestGroupDeletion(groupId) {
    try {
      await ElMessageBox.confirm(
        'This will send a deletion request to all group members. The group can only be deleted after all members approve.',
        'Request Group Deletion',
        {
          confirmButtonText: 'Send Request',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      // Initialize deletion request
      group.deleteRequest = {
        requested: true,
        requestedBy: authStore.getActiveUser,
        requestedAt: new Date().toISOString(),
        approvals: []
      }

      await updateData(
        `groups/${groupId}`,
        () => group,
        'Deletion request sent'
      )

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Deletion request sent to all members')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // Approve group deletion (members)
  async function approveGroupDeletion(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Add approval
      if (!group.deleteRequest.approvals) {
        group.deleteRequest.approvals = []
      }

      group.deleteRequest.approvals.push({
        mobile,
        name: userName,
        approvedAt: new Date().toISOString()
      })

      await updateData(
        `groups/${groupId}/deleteRequest`,
        () => group.deleteRequest,
        ''
      )

      // Update local state with new object to trigger reactivity
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = { ...group }
        groupStore.updateGroup({ ...group })
      }

      showSuccess('You have approved the deletion request')
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Reject group deletion (members)
  async function rejectGroupDeletion(groupId) {
    try {
      await ElMessageBox.confirm(
        'This will cancel the deletion request. The owner will need to create a new request if they want to delete the group.',
        'Reject Deletion Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      // Create notification for members
      createNotification(group, `Deletion request was rejected`)

      // Remove deletion request from local object
      delete group.deleteRequest

      // Update notifications in database
      await updateData(
        `groups/${groupId}/notifications`,
        () => group.notifications,
        ''
      )

      // Explicitly remove the deleteRequest from Firebase
      await removeData(`groups/${groupId}/deleteRequest`)

      // Update local state with new object to trigger reactivity
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = { ...group }
        groupStore.updateGroup({ ...group })
      }

      showSuccess('Deletion request has been rejected and cancelled')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // Delete group (only when all members approved)
  async function deleteGroup(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      // Verify all members have approved
      if (!allMembersApproved(group)) {
        return showError('Cannot delete group until all members approve')
      }

      await ElMessageBox.confirm(
        'All members have approved. This will permanently delete the group and all its data. This action cannot be undone.',
        'Confirm Final Deletion',
        {
          confirmButtonText: 'Delete Permanently',
          cancelButtonText: 'Cancel',
          type: 'error'
        }
      )

      // Delete from Firebase
      await removeData(`groups/${groupId}`)

      // Update local state
      groups.value = groups.value.filter((g) => g.id !== groupId)
      groupStore.removeGroup(groupId)

      if (groupStore.getActiveGroup === groupId) {
        groupStore.setActiveGroup(null)
      }

      showSuccess('Group deleted successfully')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  function editGroup(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return

    // Only owner can edit
    if (group.ownerMobile !== authStore.getActiveUser) {
      return showError('Only group owner can edit this group')
    }

    editingGroupId.value = groupId
    originalMembers.value = [...group.members.map((m) => m.mobile)]

    editForm.value = {
      name: group.name,
      description: group.description || '',
      members: group.members.map((m) => m.mobile)
    }

    editDialogVisible.value = true
  }
  async function updateGroup() {
    try {
      if (!editForm.value.name) {
        return showError('Group name is required')
      }

      if (editForm.value.members.length < 2) {
        return showError('At least two members are required')
      }

      const groupIndex = groups.value.findIndex(
        (g) => g.id === editingGroupId.value
      )

      if (groupIndex === -1) return

      const group = groups.value[groupIndex]

      // Detect member changes
      const addedMembers = editForm.value.members.filter(
        (m) => !originalMembers.value.includes(m)
      )
      const removedMembers = originalMembers.value.filter(
        (m) => !editForm.value.members.includes(m)
      )

      const nameChanged = group.name !== editForm.value.name
      const descriptionChanged =
        (group.description || '') !== (editForm.value.description || '')
      const membersChanged =
        addedMembers.length > 0 || removedMembers.length > 0

      // If only name or description changed, update directly and notify members
      if ((nameChanged || descriptionChanged) && !membersChanged) {
        const updatedGroup = {
          ...group,
          name: editForm.value.name,
          description: editForm.value.description || ''
        }

        // Create notification for members
        const notification = {
          id: Date.now().toString(),
          type: 'group_updated',
          message:
            nameChanged && descriptionChanged
              ? `Group name changed to "${editForm.value.name}" and description updated`
              : nameChanged
                ? `Group name changed to "${editForm.value.name}"`
                : `Group description updated`,
          updatedBy: authStore.getActiveUser,
          updatedByName:
            userStore.getUserByMobile(authStore.getActiveUser)?.name ||
            authStore.getActiveUser,
          timestamp: Date.now()
        }

        // Add notification for each member (except the one making the change)
        if (!updatedGroup.notifications) {
          updatedGroup.notifications = {}
        }

        group.members.forEach((member) => {
          if (member.mobile !== authStore.getActiveUser) {
            if (!updatedGroup.notifications[member.mobile]) {
              updatedGroup.notifications[member.mobile] = []
            }
            updatedGroup.notifications[member.mobile].push(notification)
          }
        })

        await updateData(
          `groups/${editingGroupId.value}`,
          () => updatedGroup,
          'Group updated'
        )

        groups.value[groupIndex] = updatedGroup
        groupStore.updateGroup(updatedGroup)
        editDialogVisible.value = false
        showSuccess('Group updated and members notified')
        return
      }

      // If members changed, create edit request
      if (membersChanged) {
        await ElMessageBox.confirm(
          `This will send an edit request to all members (existing, being added, and being removed). The changes will be applied after everyone approves.`,
          'Confirm Edit Request',
          {
            confirmButtonText: 'Send Request',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )

        // Create edit request
        const editRequest = {
          requestedBy: authStore.getActiveUser,
          requestedByName:
            userStore.getUserByMobile(authStore.getActiveUser)?.name ||
            authStore.getActiveUser,
          name: editForm.value.name,
          newMembers: editForm.value.members.map((m) => ({
            mobile: m,
            name: userStore.getUserByMobile(m)?.name || m
          })),
          addedMembers: addedMembers.map((m) => ({
            mobile: m,
            name: userStore.getUserByMobile(m)?.name || m
          })),
          removedMembers: removedMembers.map((m) => ({
            mobile: m,
            name: userStore.getUserByMobile(m)?.name || m
          })),
          approvals: []
        }

        group.editRequest = editRequest

        await updateData(
          `groups/${editingGroupId.value}`,
          () => group,
          'Edit request sent'
        )

        groups.value[groupIndex] = group
        groupStore.updateGroup(group)
        editDialogVisible.value = false
        showSuccess('Edit request sent to all members')
      } else if (nameChanged) {
        // Just name changed (already handled above, but this is a fallback)
        const updatedGroup = {
          ...group,
          name: editForm.value.name
        }

        await updateData(
          `groups/${editingGroupId.value}`,
          () => updatedGroup,
          'Group name updated'
        )

        groups.value[groupIndex] = updatedGroup
        groupStore.updateGroup(updatedGroup)
        editDialogVisible.value = false
        showSuccess('Group name updated successfully')
      } else {
        // No changes
        editDialogVisible.value = false
        showSuccess('No changes to save')
      }
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Edit Request Functions ==========
  async function approveEditRequest(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group || !hasEditRequest(group)) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Create new editRequest with added approval
      const currentApprovals = group.editRequest.approvals || []

      // Check if user already approved
      if (currentApprovals.some((a) => a.mobile === mobile)) {
        return showSuccess('You have already approved this request')
      }

      const newApprovals = [...currentApprovals, { mobile, name: userName }]

      const updatedEditRequest = {
        ...group.editRequest,
        approvals: newApprovals
      }

      // Create new group object for checking approvals
      const groupWithNewApproval = {
        ...group,
        editRequest: updatedEditRequest
      }

      // Check if all affected members have approved
      if (allAffectedMembersApprovedEdit(groupWithNewApproval)) {
        // Apply the changes
        const finalGroup = {
          ...group,
          name: updatedEditRequest.name,
          members: updatedEditRequest.newMembers
        }
        // Remove editRequest from final group
        delete finalGroup.editRequest

        await setData(`groups/${groupId}`, finalGroup, 'Edit applied')
        showSuccess('Edit changes applied successfully')
      } else {
        // Just save the approval
        await setData(`groups/${groupId}/editRequest`, updatedEditRequest, '')
        showSuccess('Your approval has been recorded')
      }
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function rejectEditRequest(groupId) {
    try {
      await ElMessageBox.confirm(
        'Are you sure you want to reject this edit request? The request will be cancelled.',
        'Reject Edit Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group || !hasEditRequest(group)) return

      // Create notification for members
      createNotification(group, `Edit request was rejected`)

      // Remove the edit request from local object
      delete group.editRequest

      // Update notifications in database first
      await updateData(
        `groups/${groupId}/notifications`,
        () => group.notifications,
        ''
      )

      // Explicitly remove the editRequest from Firebase
      await removeData(`groups/${groupId}/editRequest`)

      // Force update local state
      const groupIndex = groups.value.findIndex((g) => g.id === groupId)
      if (groupIndex !== -1) {
        // Create a new object to trigger reactivity
        groups.value[groupIndex] = { ...group }
        groupStore.updateGroup({ ...group })
      }

      showSuccess('Edit request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Add Member Request Actions ==========
  async function requestAddMember(groupId, newMember) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return showError('Group not found')

      // Check if member already exists
      if (group.members.some((m) => m.mobile === newMember.mobile)) {
        return showError('This member is already in the group')
      }

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      const addMemberRequest = {
        requestedBy: mobile,
        requestedByName: userName,
        requestedAt: new Date().toISOString(),
        newMember: newMember,
        approvals: [{ mobile, name: userName }]
      }

      await setData(
        `groups/${groupId}/addMemberRequest`,
        addMemberRequest,
        'Add member request sent to all members'
      )
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function approveAddMemberRequest(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group || !hasAddMemberRequest(group)) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      const currentApprovals = group.addMemberRequest.approvals || []

      if (currentApprovals.some((a) => a.mobile === mobile)) {
        return showSuccess('You have already approved this request')
      }

      const updatedRequest = {
        ...group.addMemberRequest,
        approvals: [...currentApprovals, { mobile, name: userName }]
      }

      await setData(`groups/${groupId}/addMemberRequest`, updatedRequest, '')

      showSuccess('Your approval has been recorded')
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function finalizeAddMember(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group || !hasAddMemberRequest(group)) return

      if (!allMembersApprovedAddMember(group)) {
        return showError('All members must approve before adding new member')
      }

      const newMember = group.addMemberRequest.newMember
      const updatedMembers = [...group.members, newMember]

      const updatedGroup = {
        ...group,
        members: updatedMembers
      }
      delete updatedGroup.addMemberRequest

      await setData(
        `groups/${groupId}`,
        updatedGroup,
        'New member added successfully'
      )
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function rejectAddMemberRequest(groupId) {
    try {
      await ElMessageBox.confirm(
        'Are you sure you want to reject this add member request?',
        'Reject Add Member Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      await removeData(`groups/${groupId}/addMemberRequest`)
      showSuccess('Add member request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Leave Group Functions ==========
  async function requestLeaveGroup(groupId) {
    try {
      await ElMessageBox.confirm(
        'This will send a leave request to all group members. You can only leave after all members approve.',
        'Request to Leave Group',
        {
          confirmButtonText: 'Send Request',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Initialize leaveRequests array if it doesn't exist
      if (!group.leaveRequests) {
        group.leaveRequests = []
      }

      // Add leave request
      group.leaveRequests.push({
        mobile,
        name: userName,
        approvals: []
      })

      await updateData(`groups/${groupId}`, () => group, 'Leave request sent')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Leave request sent to all members')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  async function approveLeaveRequest(groupId, leaveMobile) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Find leave request
      const leaveReq = group.leaveRequests.find((r) => r.mobile === leaveMobile)
      if (!leaveReq) return

      // Initialize approvals if not exists
      if (!leaveReq.approvals) {
        leaveReq.approvals = []
      }

      // Add approval
      leaveReq.approvals.push({ mobile, name: userName })

      // Check if all members approved
      const allApproved = group.members.every(
        (member) =>
          leaveReq.approvals.some((a) => a.mobile === member.mobile) ||
          member.mobile === leaveMobile
      )

      if (allApproved) {
        // Remove member from group
        group.members = group.members.filter((m) => m.mobile !== leaveMobile)
        // Remove leave request
        group.leaveRequests = group.leaveRequests.filter(
          (r) => r.mobile !== leaveMobile
        )

        await updateData(`groups/${groupId}`, () => group, 'Member left group')
        showSuccess(`${leaveReq.name} has left the group`)
      } else {
        await updateData(`groups/${groupId}`, () => group, 'Approval recorded')
        showSuccess('You have approved the leave request')
      }

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function rejectLeaveRequest(groupId, leaveMobile) {
    try {
      await ElMessageBox.confirm(
        'This will cancel the leave request.',
        'Reject Leave Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const leaveReq = group.leaveRequests?.find(
        (r) => r.mobile === leaveMobile
      )
      const leavingUserName = leaveReq?.name || leaveMobile

      // Remove leave request
      group.leaveRequests = (group.leaveRequests || []).filter(
        (r) => r.mobile !== leaveMobile
      )

      // Create notification for members
      createNotification(
        group,
        `Leave request from ${leavingUserName} was rejected`
      )

      await updateData(
        `groups/${groupId}`,
        () => group,
        'Leave request rejected'
      )

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      showSuccess('Leave request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Ownership Transfer Functions ==========
  function showTransferOwnershipDialog(groupId) {
    transferOwnershipGroupId.value = groupId
    newOwnerMobile.value = ''
    transferDialogVisible.value = true
  }

  async function requestOwnershipTransfer() {
    try {
      if (!newOwnerMobile.value) {
        return showError('Please select a new owner')
      }

      await ElMessageBox.confirm(
        'This will send an ownership transfer request to all members. The transfer will only happen after all members approve.',
        'Request Ownership Transfer',
        {
          confirmButtonText: 'Send Request',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find(
        (g) => g.id === transferOwnershipGroupId.value
      )
      if (!group) return

      // Add transfer request
      group.transferOwnershipRequest = {
        newOwner: newOwnerMobile.value,
        requestedBy: authStore.getActiveUser,
        approvals: []
      }

      await updateData(
        `groups/${transferOwnershipGroupId.value}`,
        () => group,
        'Transfer request sent'
      )

      // Update local state
      const index = groups.value.findIndex(
        (g) => g.id === transferOwnershipGroupId.value
      )
      if (index !== -1) {
        groups.value[index] = group
        groupStore.updateGroup(group)
      }

      transferDialogVisible.value = false
      showSuccess('Ownership transfer request sent to all members')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  async function approveOwnershipTransfer(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const userName = userStore.getUserByMobile(mobile)?.name || mobile

      // Add approval
      if (!group.transferOwnershipRequest.approvals) {
        group.transferOwnershipRequest.approvals = []
      }

      group.transferOwnershipRequest.approvals.push({ mobile, name: userName })

      // Check if all members approved
      const allApproved = group.members.every((member) =>
        group.transferOwnershipRequest.approvals.some(
          (a) => a.mobile === member.mobile
        )
      )

      if (allApproved) {
        // Transfer ownership
        group.ownerMobile = group.transferOwnershipRequest.newOwner
        // Remove transfer request from local object
        delete group.transferOwnershipRequest

        // Update owner in database
        await updateData(
          `groups/${groupId}/ownerMobile`,
          () => group.ownerMobile,
          ''
        )

        // Explicitly remove the transferOwnershipRequest from Firebase
        await removeData(`groups/${groupId}/transferOwnershipRequest`)

        showSuccess('Ownership has been transferred successfully')
      } else {
        await updateData(
          `groups/${groupId}/transferOwnershipRequest`,
          () => group.transferOwnershipRequest,
          ''
        )
        showSuccess('You have approved the ownership transfer')
      }

      // Update local state with new object to trigger reactivity
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = { ...group }
        groupStore.updateGroup({ ...group })
      }
    } catch (err) {
      showError(err.message || err)
    }
  }

  async function rejectOwnershipTransfer(groupId) {
    try {
      await ElMessageBox.confirm(
        'This will cancel the ownership transfer request.',
        'Reject Transfer Request',
        {
          confirmButtonText: 'Reject',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const newOwnerName =
        userStore.getUserByMobile(group.transferOwnershipRequest?.newOwner)
          ?.name || group.transferOwnershipRequest?.newOwner

      // Create notification for members
      createNotification(
        group,
        `Ownership transfer request to ${newOwnerName} was rejected`
      )

      // Remove transfer request from local object
      delete group.transferOwnershipRequest

      // Update notifications in database
      await updateData(
        `groups/${groupId}/notifications`,
        () => group.notifications,
        ''
      )

      // Explicitly remove the transferOwnershipRequest from Firebase
      await removeData(`groups/${groupId}/transferOwnershipRequest`)

      // Update local state with new object to trigger reactivity
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = { ...group }
        groupStore.updateGroup({ ...group })
      }

      showSuccess('Ownership transfer request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Mobile Display Helpers ==========
  function displayMobileForGroup(targetMobile, group) {
    if (!targetMobile) return ''
    if (targetMobile === authStore.getActiveUser) return targetMobile
    const isActiveUserInGroup = (group?.members || []).some(
      (m) => m.mobile === authStore.getActiveUser
    )
    const isTargetInGroup = (group?.members || []).some(
      (m) => m.mobile === targetMobile
    )
    if (isActiveUserInGroup && isTargetInGroup) return targetMobile
    return (
      userStore.getUserByMobile(targetMobile)?.maskedMobile ||
      maskMobile(targetMobile)
    )
  }

  function displayMobileInEditDialog(targetMobile) {
    const editGroup = groups.value.find((g) => g.id === editingGroupId.value)
    return displayMobileForGroup(targetMobile, editGroup)
  }

  const editMemberOptions = computed(() =>
    (userStore.getUsers || []).map((user) => ({
      label: formatUserDisplay(storeProxy, user.mobile, {
        name: user.name,
        group: groups.value.find((g) => g.id === editingGroupId.value),
        preferMasked: !groups.value
          .find((g) => g.id === editingGroupId.value)
          ?.members?.some((member) => member.mobile === user.mobile)
      }),
      value: user.mobile
    }))
  )

  const groupNotifications = computed(() => {
    const me = authStore.getActiveUser
    if (!me) return []
    const result = []

    for (const group of joinedGroups.value) {
      // Join requests needing my approval
      getJoinRequests(group.id).forEach((req) => {
        if (!hasUserApprovedJoinRequest(group, req.mobile)) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            icon: '👋',
            label: `${req.name} wants to join`
          })
        }
      })

      // Delete request
      if (hasDeleteRequest(group) && !hasUserApprovedDeletion(group)) {
        result.push({
          groupId: group.id,
          groupName: group.name,
          icon: '⚠️',
          label: 'Group deletion request'
        })
      }

      // Leave requests
      getLeaveRequests(group).forEach((req) => {
        if (
          req.mobile !== me &&
          !hasUserApprovedLeaveRequest(group, req.mobile)
        ) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            icon: '🚪',
            label: `${req.name} wants to leave`
          })
        }
      })

      // Edit request
      if (
        hasEditRequest(group) &&
        isUserAffectedByEdit(group) &&
        !hasUserApprovedEditRequest(group)
      ) {
        result.push({
          groupId: group.id,
          groupName: group.name,
          icon: '📝',
          label: 'Group edit request'
        })
      }

      // Add member request
      if (
        hasAddMemberRequest(group) &&
        isMemberOfGroup(group) &&
        !hasUserApprovedAddMemberRequest(group)
      ) {
        result.push({
          groupId: group.id,
          groupName: group.name,
          icon: '➕',
          label: `Add ${group.addMemberRequest.newMember.name}`
        })
      }

      // Ownership transfer
      if (
        group.transferOwnershipRequest &&
        isMemberOfGroup(group) &&
        !hasUserApprovedOwnershipTransfer(group)
      ) {
        result.push({
          groupId: group.id,
          groupName: group.name,
          icon: '👑',
          label: 'Ownership transfer request'
        })
      }
    }

    return result
  })

  const editFormRef = ref(null)

  // Watch for scroll trigger from notifications
  watch(
    () => groupStore.getScrollToGroupTrigger,
    (trigger) => {
      if (trigger && trigger.groupId) {
        nextTick(() => {
          scrollToGroup(trigger.groupId)
          groupStore.setScrollToGroupTrigger(null)
        })
      }
    }
  )

  function scrollToGroup(groupId) {
    const el = document.getElementById(`group-card-${groupId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el.style.transition = 'box-shadow 0.3s ease'
    el.style.boxShadow = '0 0 0 3px #22c55e'
    setTimeout(() => {
      el.style.boxShadow = ''
    }, 2000)
  }

  function handleEditSave() {
    editFormRef.value.validate((valid) => {
      if (!valid) return
      updateGroup()
    })
  }

  return {
    // Refs / reactive
    showCreateGroup,
    searchQuery,
    sortOrder,
    filterByUser,
    allGroupMembers,
    allGroupMemberOptions,
    filteredGroups,
    joinedGroups,
    otherGroups,
    pendingInvitations,
    acceptInvitation,
    rejectInvitation,
    editDialogVisible,
    editForm,
    transferDialogVisible,
    newOwnerMobile,
    transferOwnershipMembers,
    transferOwnershipOptions,
    addMemberDialogVisible,
    selectedMemberToAdd,
    availableUsersToAdd,
    availableUsersToAddOptions,
    userStore,

    // Group actions
    openCreateGroup,
    closeCreateGroup,
    selectGroup,
    editGroup,
    updateGroup,
    deleteGroup,
    requestGroupDeletion,
    approveGroupDeletion,
    rejectGroupDeletion,

    // Join request
    getJoinRequests,
    requestToJoinGroup,
    cancelJoinRequest,
    approveMemberJoinRequest,
    finalApproveJoinRequest,
    rejectJoinRequest,

    // Leave group actions
    requestLeaveGroup,
    approveLeaveRequest,
    rejectLeaveRequest,

    // Edit request actions
    approveEditRequest,
    rejectEditRequest,

    // Add member request actions
    requestAddMember,
    approveAddMemberRequest,
    finalizeAddMember,
    rejectAddMemberRequest,
    showAddMemberDialog,
    submitAddMemberRequest,

    // Notifications
    hideNotification,
    groupNotifications,

    // Pin
    isPinned,
    togglePin,

    // Per-user financial snapshot
    loadGroupBalances,
    getGroupBalances,

    // Mobile display helpers
    displayMobileForGroup,
    displayMobileInEditDialog,

    // Ownership transfer
    showTransferOwnershipDialog,
    requestOwnershipTransfer,
    approveOwnershipTransfer,
    rejectOwnershipTransfer,

    // Group actions helper
    getGroupActions,

    // Edit form
    editMemberOptions,
    editFormRef,
    handleEditSave
  }

  // Helper function to compute actions for a group
  function getGroupActions(group) {
    const isOwner = group.ownerMobile === authStore?.getActiveUser
    const isMember = isMemberOfGroup(group)
    const hasLeaveReq = hasLeaveRequest(group, authStore?.getActiveUser)
    const hasJoinReq = hasPendingRequest(group)

    return [
      // MEMBER ACTIONS
      {
        label: 'Select',
        show: isMember,
        type: 'primary',
        onClick: () => selectGroup(group.id)
      },
      {
        label: `Leave Pending (${getLeaveApprovals(group, authStore.getActiveUser).length}/${group.members.length})`,
        show:
          isMember &&
          hasLeaveReq &&
          !allMembersApprovedLeave(group, authStore.getActiveUser),
        disabled: true,
        type: ''
      },
      {
        label: 'Leave',
        show: isMember && !hasLeaveReq,
        type: 'warning',
        onClick: () => requestLeaveGroup(group.id)
      },
      {
        label: 'Add Member',
        show: isMember && !isOwner && !hasAddMemberRequest(group),
        type: 'success',
        onClick: () => showAddMemberDialog(group.id)
      },
      {
        label: 'Edit',
        show: isMember,
        disabled: !isOwner,
        type: '',
        onClick: () => editGroup(group.id)
      },
      {
        label: 'Transfer Ownership',
        show: isMember && isOwner && group.members.length > 1,
        type: '',
        onClick: () => showTransferOwnershipDialog(group.id)
      },
      // REQUEST ACTIONS
      {
        label: 'Cancel Request',
        show: !isMember && hasJoinReq,
        type: 'warning',
        onClick: () => cancelJoinRequest(group.id)
      },
      {
        label: 'Request to Join',
        show: !isMember && !hasJoinReq,
        type: 'success',
        onClick: () => requestToJoinGroup(group.id)
      },
      // OWNER DELETE ACTIONS
      {
        label: `Delete Now (${getDeleteApprovals(group).length}/${group.members.length})`,
        show: isOwner && hasDeleteRequest(group) && allMembersApproved(group),
        type: 'danger',
        onClick: () => deleteGroup(group.id)
      },
      {
        label: `Delete Pending (${getDeleteApprovals(group).length}/${group.members.length})`,
        show: isOwner && hasDeleteRequest(group) && !allMembersApproved(group),
        disabled: true,
        type: ''
      },
      {
        label: 'Request Delete',
        show: isOwner && !hasDeleteRequest(group),
        type: 'danger',
        onClick: () => requestGroupDeletion(group.id)
      }
    ].filter((action) => action.show)
  }
}
