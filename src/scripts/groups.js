import { ref, onMounted, onUnmounted, computed } from 'vue'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { showError, showSuccess } from '../utils/showAlerts'
import { ElMessageBox } from 'element-plus'
import { onValue, off } from '../firebase'
import { maskMobile } from '../utils/maskMobile'

export const Groups = () => {
  const showCreateGroup = ref(false)
  const searchQuery = ref('')
  const pinnedGroupIds = ref([])

  const openCreateGroup = () => {
    showCreateGroup.value = true
  }

  const closeCreateGroup = () => {
    showCreateGroup.value = false
  }

  const userStore = store()
  const { read, updateData, removeData, dbRef, setData } = useFireBase()

  const groups = ref([])
  let groupsListener = null

  // Filtered groups based on search query
  const filteredGroups = computed(() => {
    if (!searchQuery.value) {
      return groups.value
    }

    const query = searchQuery.value.toLowerCase().trim()
    return groups.value.filter((group) => {
      // Search by group name
      if (group.name && group.name.toLowerCase().includes(query)) {
        return true
      }
      // Search by group ID/code
      if (group.id && group.id.toLowerCase().includes(query)) {
        return true
      }
      // Search by owner mobile
      if (
        group.ownerMobile &&
        group.ownerMobile.toLowerCase().includes(query)
      ) {
        return true
      }
      // Search by owner name
      const ownerName = userStore.getUserByMobile(group.ownerMobile)?.name
      if (ownerName && ownerName.toLowerCase().includes(query)) {
        return true
      }
      // Search by member name or mobile
      if (
        group.members &&
        group.members.some(
          (m) =>
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.mobile && m.mobile.toLowerCase().includes(query))
        )
      ) {
        return true
      }
      return false
    })
  })

  const joinedGroups = computed(() => {
    const filtered = filteredGroups.value.filter((g) => isMemberOfGroup(g))
    const pinned = filtered.filter((g) => pinnedGroupIds.value.includes(g.id))
    const unpinned = filtered.filter(
      (g) => !pinnedGroupIds.value.includes(g.id)
    )
    return [...pinned, ...unpinned]
  })

  const otherGroups = computed(() =>
    filteredGroups.value.filter((g) => !isMemberOfGroup(g))
  )

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
    return `pinnedGroups_${userStore.getActiveUser}`
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

  onMounted(async () => {
    loadPins()

    // Fetch users — needed for group creation and member display
    try {
      const users = await read('users')
      if (users) {
        const list = Object.keys(users).map((k) => ({
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
          userStore.setGroups(groups.value)

          // Auto-select the user's group on first load if none is already active
          if (!userStore.getActiveGroup) {
            const mobile = userStore.getActiveUser
            const myGroup = groups.value.find((g) =>
              (g.members || []).some((m) => m.mobile === mobile)
            )
            if (myGroup) userStore.setActiveGroup(myGroup.id)
          }
        } else {
          groups.value = []
          userStore.setGroups([])
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

  // Check if current user is a member of the group
  function isMemberOfGroup(group) {
    const mobile = userStore.getActiveUser
    return group.members && group.members.some((m) => m.mobile === mobile)
  }

  // Check if current user has a pending join request
  function hasPendingRequest(group) {
    const mobile = userStore.getActiveUser
    return (
      group.joinRequests && group.joinRequests.some((r) => r.mobile === mobile)
    )
  }

  // Get join requests for a group
  function getJoinRequests(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    return group?.joinRequests || []
  }

  // Check if group has a deletion request
  function hasDeleteRequest(group) {
    return group.deleteRequest && group.deleteRequest.requested === true
  }

  // Get deletion approvals for a group
  function getDeleteApprovals(group) {
    return group.deleteRequest?.approvals || []
  }

  // Check if all members have approved deletion
  function allMembersApproved(group) {
    if (!hasDeleteRequest(group)) return false
    const approvals = getDeleteApprovals(group)
    return group.members.every((member) =>
      approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  // Get members who haven't approved yet
  function getPendingApprovals(group) {
    if (!hasDeleteRequest(group)) return []
    const approvals = getDeleteApprovals(group)
    return group.members.filter(
      (member) =>
        !approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  // Check if current user has approved deletion
  function hasUserApprovedDeletion(group) {
    const mobile = userStore.getActiveUser
    const approvals = getDeleteApprovals(group)
    return approvals.some((approval) => approval.mobile === mobile)
  }

  // ========== Join Request Helpers with Member Approval ==========
  function getJoinRequestApprovals(group, requestMobile) {
    const request = group.joinRequests?.find((r) => r.mobile === requestMobile)
    return request?.approvals || []
  }

  function getPendingJoinApprovals(group, requestMobile) {
    const approvals = getJoinRequestApprovals(group, requestMobile)
    return group.members.filter(
      (member) =>
        !approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  function hasUserApprovedJoinRequest(group, requestMobile) {
    const mobile = userStore.getActiveUser
    const approvals = getJoinRequestApprovals(group, requestMobile)
    return approvals.some((approval) => approval.mobile === mobile)
  }

  function allMembersApprovedJoinRequest(group, requestMobile) {
    const approvals = getJoinRequestApprovals(group, requestMobile)
    return group.members.every((member) =>
      approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  // ========== Leave Group Helpers ==========
  function getLeaveRequests(group) {
    return group.leaveRequests || []
  }

  function hasLeaveRequest(group, mobile) {
    return getLeaveRequests(group).some((r) => r.mobile === mobile)
  }

  function getLeaveApprovals(group, mobile) {
    const request = getLeaveRequests(group).find((r) => r.mobile === mobile)
    return request?.approvals || []
  }

  function allMembersApprovedLeave(group, mobile) {
    const approvals = getLeaveApprovals(group, mobile)
    return group.members.every(
      (member) =>
        approvals.some((approval) => approval.mobile === member.mobile) ||
        member.mobile === mobile
    )
  }

  function hasUserApprovedLeaveRequest(group, leaveMobile) {
    const mobile = userStore.getActiveUser
    const request = getLeaveRequests(group).find(
      (r) => r.mobile === leaveMobile
    )
    return request?.approvals?.some((a) => a.mobile === mobile) || false
  }

  // ========== Edit Request Helpers ==========
  function hasEditRequest(group) {
    return group.editRequest !== undefined && group.editRequest !== null
  }

  function getEditApprovals(group) {
    return group.editRequest?.approvals || []
  }

  function getAllAffectedMembers(group) {
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

  function allAffectedMembersApprovedEdit(group) {
    if (!hasEditRequest(group)) return false
    const approvals = getEditApprovals(group)
    const allAffected = getAllAffectedMembers(group)

    return allAffected.every((member) =>
      approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  function hasUserApprovedEditRequest(group) {
    const mobile = userStore.getActiveUser
    return (
      group.editRequest?.approvals?.some((a) => a.mobile === mobile) || false
    )
  }

  function isUserAffectedByEdit(group) {
    const mobile = userStore.getActiveUser
    const allAffected = getAllAffectedMembers(group)
    return allAffected.some((m) => m.mobile === mobile)
  }

  // ========== Notification Helpers ==========
  function getUserNotifications(group) {
    const mobile = userStore.getActiveUser
    return group.notifications?.[mobile] || []
  }

  async function hideNotification(groupId, notificationId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = userStore.getActiveUser
      if (!group.notifications || !group.notifications[mobile]) return

      // Remove the notification
      group.notifications[mobile] = group.notifications[mobile].filter(
        (n) => n.id !== notificationId
      )

      // Clean up empty notification arrays
      if (group.notifications[mobile].length === 0) {
        delete group.notifications[mobile]
      }

      await updateData(`groups/${groupId}`, () => group, '')

      const groupIndex = groups.value.findIndex((g) => g.id === groupId)
      if (groupIndex !== -1) {
        groups.value[groupIndex] = group
        userStore.updateGroup(group)
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
        userStore.getUserByMobile(userStore.getActiveUser)?.name ||
        userStore.getActiveUser,
      timestamp: Date.now()
    }

    if (!group.notifications) {
      group.notifications = {}
    }

    // Notify all members except the one performing the action
    group.members.forEach((member) => {
      if (member.mobile !== userStore.getActiveUser) {
        if (!group.notifications[member.mobile]) {
          group.notifications[member.mobile] = []
        }
        group.notifications[member.mobile].push(notification)
      }
    })
  }

  // ========== Ownership Transfer Helpers ==========
  function hasUserApprovedOwnershipTransfer(group) {
    const mobile = userStore.getActiveUser
    return (
      group.transferOwnershipRequest?.approvals?.some(
        (a) => a.mobile === mobile
      ) || false
    )
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
    return group.members.filter((m) => m.mobile !== userStore.getActiveUser)
  })

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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup(group)
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

      const mobile = userStore.getActiveUser

      // Remove from join requests
      group.joinRequests = (group.joinRequests || []).filter(
        (r) => r.mobile !== mobile
      )

      await updateData(`groups/${groupId}`, () => group, 'Request cancelled')

      // Update local state
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index !== -1) {
        groups.value[index] = group
        userStore.updateGroup(group)
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup(group)
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
        userStore.updateGroup(group)
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
        userStore.updateGroup(group)
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

    userStore.setActiveGroup(id)
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
        requestedBy: userStore.getActiveUser,
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
        userStore.updateGroup(group)
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup({ ...group })
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
        userStore.updateGroup({ ...group })
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
      userStore.removeGroup(groupId)

      if (userStore.getActiveGroup === groupId) {
        userStore.setActiveGroup(null)
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
    if (group.ownerMobile !== userStore.getActiveUser) {
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
          updatedBy: userStore.getActiveUser,
          updatedByName:
            userStore.getUserByMobile(userStore.getActiveUser)?.name ||
            userStore.getActiveUser,
          timestamp: Date.now()
        }

        // Add notification for each member (except the one making the change)
        if (!updatedGroup.notifications) {
          updatedGroup.notifications = {}
        }

        group.members.forEach((member) => {
          if (member.mobile !== userStore.getActiveUser) {
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
        userStore.updateGroup(updatedGroup)
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
          requestedBy: userStore.getActiveUser,
          requestedByName:
            userStore.getUserByMobile(userStore.getActiveUser)?.name ||
            userStore.getActiveUser,
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
        userStore.updateGroup(group)
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
        userStore.updateGroup(updatedGroup)
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup({ ...group })
      }

      showSuccess('Edit request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Add Member Request Functions ==========
  function hasAddMemberRequest(group) {
    return (
      group.addMemberRequest && Object.keys(group.addMemberRequest).length > 0
    )
  }

  function getAddMemberRequestApprovals(group) {
    return group.addMemberRequest?.approvals || []
  }

  function hasUserApprovedAddMemberRequest(group) {
    const mobile = userStore.getActiveUser
    return getAddMemberRequestApprovals(group).some((a) => a.mobile === mobile)
  }

  function allMembersApprovedAddMember(group) {
    if (!hasAddMemberRequest(group)) return false
    const approvals = getAddMemberRequestApprovals(group)
    return group.members.every((member) =>
      approvals.some((approval) => approval.mobile === member.mobile)
    )
  }

  async function requestAddMember(groupId, newMember) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return showError('Group not found')

      // Check if member already exists
      if (group.members.some((m) => m.mobile === newMember.mobile)) {
        return showError('This member is already in the group')
      }

      const mobile = userStore.getActiveUser
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

      const mobile = userStore.getActiveUser
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup(group)
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup(group)
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
        userStore.updateGroup(group)
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
        requestedBy: userStore.getActiveUser,
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
        userStore.updateGroup(group)
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

      const mobile = userStore.getActiveUser
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
        userStore.updateGroup({ ...group })
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
        userStore.updateGroup({ ...group })
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
    if (targetMobile === userStore.getActiveUser) return targetMobile
    const isActiveUserInGroup = (group?.members || []).some(
      (m) => m.mobile === userStore.getActiveUser
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

  function displayMasked(targetMobile) {
    if (!targetMobile) return ''
    return (
      userStore.getUserByMobile(targetMobile)?.maskedMobile ||
      maskMobile(targetMobile)
    )
  }

  function displayMobileInEditDialog(targetMobile) {
    const editGroup = groups.value.find((g) => g.id === editingGroupId.value)
    return displayMobileForGroup(targetMobile, editGroup)
  }

  return {
    // Refs / reactive
    showCreateGroup,
    searchQuery,
    filteredGroups,
    joinedGroups,
    otherGroups,
    editDialogVisible,
    editForm,
    transferDialogVisible,
    newOwnerMobile,
    transferOwnershipMembers,
    addMemberDialogVisible,
    selectedMemberToAdd,
    availableUsersToAdd,
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
    getJoinRequestApprovals,
    getPendingJoinApprovals,
    hasUserApprovedJoinRequest,
    allMembersApprovedJoinRequest,

    // Membership checks
    isMemberOfGroup,
    hasPendingRequest,

    // Delete request helpers
    hasDeleteRequest,
    getDeleteApprovals,
    allMembersApproved,
    getPendingApprovals,
    hasUserApprovedDeletion,

    // Leave group
    getLeaveRequests,
    hasLeaveRequest,
    getLeaveApprovals,
    allMembersApprovedLeave,
    hasUserApprovedLeaveRequest,
    requestLeaveGroup,
    approveLeaveRequest,
    rejectLeaveRequest,

    // Edit request
    hasEditRequest,
    getEditApprovals,
    getAllAffectedMembers,
    hasUserApprovedEditRequest,
    isUserAffectedByEdit,
    approveEditRequest,
    rejectEditRequest,

    // Add member request
    hasAddMemberRequest,
    getAddMemberRequestApprovals,
    hasUserApprovedAddMemberRequest,
    allMembersApprovedAddMember,
    requestAddMember,
    approveAddMemberRequest,
    finalizeAddMember,
    rejectAddMemberRequest,
    showAddMemberDialog,
    submitAddMemberRequest,

    // Notifications
    getUserNotifications,
    hideNotification,

    // Pin
    isPinned,
    togglePin,

    // Mobile display helpers
    displayMobileForGroup,
    displayMasked,
    displayMobileInEditDialog,

    // Ownership transfer
    hasUserApprovedOwnershipTransfer,
    showTransferOwnershipDialog,
    requestOwnershipTransfer,
    approveOwnershipTransfer,
    rejectOwnershipTransfer
  }
}
