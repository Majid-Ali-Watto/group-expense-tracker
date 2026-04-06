import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GROUP_CATEGORIES } from '@/assets'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useFireBase, useDebouncedRef } from '@/composables'
import {
  showError,
  showSuccess,
  maskMobile,
  buildSharedGroupsLocation,
  appendNotificationForUser,
  removeNotificationForUser,
  formatMemberDisplay,
  formatUserDisplay
} from '@/utils'
import { ElMessageBox } from 'element-plus'
import {
  onSnapshot,
  auth,
  onAuthStateChanged,
  deleteField,
  collectionGroup,
  query,
  where,
  getDocs,
  database
} from '@/firebase'
import { DB_NODES } from '@/constants'
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
  hasDeleteRequest,
  getDeleteApprovals,
  hasUserApprovedDeletion,
  hasUserApprovedJoinRequest,
  isCurrentUserPendingOwner
} from '@/helpers'

export const Groups = () => {
  const isPageLoading = ref(true)
  const showCreateGroup = ref(false)
  const route = useRoute()
  const router = useRouter()
  const searchQuery = useDebouncedRef(route.query.q || '', 300)
  const sortOrder = ref(route.query.sort || '') // '' | 'asc' | 'desc'
  const filterByUser = ref(route.query.user || '')
  const filterByCategory = ref(route.query.category || '')
  const pinnedGroupIds = ref([])

  const openCreateGroup = () => {
    showCreateGroup.value = true
  }

  const closeCreateGroup = () => {
    showCreateGroup.value = false
  }

  // Sync all filters to URL so they are bookmarkable and shareable
  watch([searchQuery, sortOrder, filterByUser, filterByCategory], () => {
    const query = {}
    if (searchQuery.value) query.q = searchQuery.value
    if (sortOrder.value) query.sort = sortOrder.value
    if (filterByUser.value) query.user = filterByUser.value
    if (filterByCategory.value) query.category = filterByCategory.value
    router.replace({ path: route.path, query })
  })

  // When create-group dialog closes via any path, remove ?new from URL
  watch(showCreateGroup, (open) => {
    if (!open && route.query.new) {
      const rest = { ...route.query }
      delete rest.new
      router.replace({ path: route.path, query: rest })
    }
  })

  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const { read, readShallow, updateData, removeData, dbRef, setData } =
    useFireBase()

  /**
   * Returns a flat, deduplicated array of mobile numbers for all members
   * (accepted) and pendingMembers (invited).  Stored as `memberMobiles` on
   * the group document so Firestore's array-contains query can scope the
   * groups listener to only the current user's relevant groups.
   */
  function computeMemberMobiles(group) {
    const set = new Set()
    ;(group.members || []).forEach((m) => {
      if (m.uid || m.mobile) set.add(m.uid || m.mobile)
    })
    ;(group.pendingMembers || []).forEach((m) => {
      if (m.uid || m.mobile) set.add(m.uid || m.mobile)
    })
    return [...set]
  }

  const groups = computed(() => groupStore.getGroups || [])
  const groupBalances = ref({})
  let groupsListener = null

  // All unique members across all groups (excluding the current user), sorted by name
  const allGroupMembers = computed(() => {
    const me = authStore.getActiveUser
    const seen = new Set()
    const members = []
    for (const g of groups.value) {
      for (const m of g.members || []) {
        const memberId = m.uid || m.mobile
        if (memberId !== me && !seen.has(memberId)) {
          seen.add(memberId)
          members.push({
            mobile: memberId,
            name:
              m.name || userStore.getUserByMobile(memberId)?.name || memberId
          })
        }
      }
    }
    return members.sort((a, b) => a.name.localeCompare(b.name))
  })

  const allGroupMemberOptions = computed(() =>
    allGroupMembers.value.map((member) => ({
      label: formatUserDisplay(storeProxy, member.mobile, {
        name: member.name
      }),
      value: member.mobile
    }))
  )

  // All categories for the filter dropdown
  const allCategoryOptions = computed(() => [
    { label: '🗂️ All', value: '' },
    ...GROUP_CATEGORIES
  ])

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

    if (filterByCategory.value) {
      result = result.filter((g) => g.category === filterByCategory.value)
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

  const joinedGroupsForShare = computed(() =>
    groups.value.filter((group) => isMemberOfGroup(group))
  )

  const pinnedGroupsForShare = computed(() =>
    joinedGroupsForShare.value.filter((group) =>
      pinnedGroupIds.value.includes(group.id)
    )
  )

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
    const myUser = userStore.getUserByMobile(me)
    const myName = myUser?.name || me
    const myMobile = myUser?.mobile || me
    const newMembers = [...(group.members || []), { mobile: me }]
    const newPending = (group.pendingMembers || []).filter(
      (m) => m.mobile !== me
    )
    let updatedGroup = {
      ...group,
      members: newMembers,
      pendingMembers: newPending.length ? newPending : null
    }
    // Notify the group creator
    if (group.ownerMobile && group.ownerMobile !== me) {
      updatedGroup = appendNotificationForUser(
        updatedGroup,
        group.ownerMobile,
        {
          id: Date.now().toString() + Math.random(),
          type: 'invitation-accepted',
          message: `${myName} (${maskMobile(myMobile)}) accepted your invitation to join "${group.name}"`,
          updatedBy: me,
          timestamp: Date.now()
        }
      )
    }
    const payload = {
      members: updatedGroup.members,
      pendingMembers: updatedGroup.pendingMembers,
      memberMobiles: computeMemberMobiles(updatedGroup)
    }
    if (updatedGroup.notifications)
      payload.notifications = updatedGroup.notifications
    await updateData(
      `${DB_NODES.GROUPS}/${groupId}`,
      () => payload,
      'You have joined the group!'
    )
    groupStore.addGroup(updatedGroup)
  }

  async function rejectInvitation(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    if (!group) return
    const me = authStore.getActiveUser
    const myUser = userStore.getUserByMobile(me)
    const myName = myUser?.name || me
    const myMobile = myUser?.mobile || me
    const newPending = (group.pendingMembers || []).filter(
      (m) => m.mobile !== me
    )
    let updatedGroup = {
      ...group,
      pendingMembers: newPending.length ? newPending : null
    }
    // Notify the group creator
    if (group.ownerMobile && group.ownerMobile !== me) {
      updatedGroup = appendNotificationForUser(
        updatedGroup,
        group.ownerMobile,
        {
          id: Date.now().toString() + Math.random(),
          type: 'invitation-declined',
          message: `${myName} (${maskMobile(myMobile)}) declined your invitation to join "${group.name}"`,
          updatedBy: me,
          timestamp: Date.now()
        }
      )
    }
    const payload = {
      pendingMembers: updatedGroup.pendingMembers,
      memberMobiles: computeMemberMobiles(updatedGroup)
    }
    if (updatedGroup.notifications)
      payload.notifications = updatedGroup.notifications
    await updateData(
      `${DB_NODES.GROUPS}/${groupId}`,
      () => payload,
      'Invitation declined.'
    )
    groupStore.addGroup(updatedGroup)
  }

  const editDialogVisible = ref(false)
  const editingGroupId = ref(null)
  const originalMembers = ref([])
  const initialEditForm = ref({
    name: '',
    description: '',
    members: []
  })

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

  function buildShareLink(groupIds) {
    const location = buildSharedGroupsLocation(groupIds)
    const resolved = router.resolve(location)
    return `${window.location.origin}${resolved.href}`
  }

  async function copyShareLink(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      const copied = document.execCommand('copy')
      if (!copied) throw new Error('Copy command failed')
      return true
    } finally {
      document.body.removeChild(textarea)
    }
  }

  async function shareGroups(groupList, label = 'groups') {
    if (!groupList.length) {
      showError(`No ${label} available to share`)
      return
    }

    const names = groupList.map((group) => group.name).join(', ')
    const url = buildShareLink(groupList.map((group) => group.id))
    const sharePayload = {
      title:
        groupList.length === 1
          ? `Shared group: ${groupList[0].name}`
          : `Shared ${label}`,
      text:
        groupList.length === 1
          ? `Open "${groupList[0].name}" in Kharchafy.`
          : `Open these ${label} in Kharchafy: ${names}`,
      url
    }

    try {
      if (navigator.share) {
        await navigator.share(sharePayload)
        return
      }
    } catch (error) {
      if (error?.name === 'AbortError') return
    }

    try {
      await copyShareLink(url)
      showSuccess('Share link copied to clipboard!')
    } catch {
      window.prompt('Copy this share link:', url)
      showError('Failed to share group link.')
    }
  }

  function shareJoinedGroups() {
    return shareGroups(joinedGroupsForShare.value, 'joined groups')
  }

  function sharePinnedGroups() {
    return shareGroups(pinnedGroupsForShare.value, 'pinned groups')
  }

  function shareSingleGroup(group) {
    return shareGroups([group], 'group')
  }

  // Get join requests for a group
  function getJoinRequests(groupId) {
    const group = groups.value.find((g) => g.id === groupId)
    return group?.joinRequests || []
  }

  onMounted(() => {
    loadPins()

    // Open the create-group dialog immediately if the URL contains ?new=1
    // (e.g., a shared link or bookmarked shortcut)
    if (route.query.new === '1') {
      showCreateGroup.value = true
    }

    // Wait for Firebase Auth to confirm the current user before reading RTDB.
    // Without this, the onValue listener fires before the auth token is attached
    // to the request, causing permission_denied even though loggedIn is true in Pinia.
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeAuth() // one-shot — we only need the first confirmation

      if (!firebaseUser) {
        isPageLoading.value = false
        return
      }

      // Fetch users — needed for group creation and member display
      // Only include verified users to prevent unverified accounts from being added to groups
      try {
        const users = await read(DB_NODES.USERS)
        if (users) {
          const list = Object.keys(users)
            .filter((k) => users[k].emailVerified === true) // Only verified users
            .map((k) => ({
              uid: k,
              mobile: users[k].mobile || '',
              name: users[k].name || '',
              email: users[k].email || '',
              maskedMobile: maskMobile(users[k].mobile || ''),
              bugResolver: users[k].bugResolver === true
            }))
          userStore.setUsers(list)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }

      // Set up real-time listener for groups.
      const groupsRef = dbRef(DB_NODES.GROUPS)

      const loadingTimeout = setTimeout(() => {
        isPageLoading.value = false
      }, 8000)

      groupsListener = onSnapshot(
        groupsRef,
        (snapshot) => {
          clearTimeout(loadingTimeout)
          isPageLoading.value = false
          if (!snapshot.empty) {
            const groupList = snapshot.docs.map((d) => ({
              id: d.id,
              ...d.data()
            }))
            groupStore.setGroups(groupList)

            // Auto-select the user's group on first load if none is already active
            if (!groupStore.getActiveGroup) {
              const mobile = authStore.getActiveUser
              const myGroup = groups.value.find((g) =>
                (g.members || []).some((m) => m.mobile === mobile)
              )
              if (myGroup) groupStore.setActiveGroup(myGroup.id)
            }
          } else {
            groupStore.setGroups([])
          }
        },
        (error) => {
          isPageLoading.value = false
          // Ignore permission errors that fire after logout — Firebase revokes the
          // auth token before this listener is detached (on component unmount).
          if (authStore.getActiveUser) {
            console.error('Error loading groups:', error)
          }
        }
      )
    }) // end onAuthStateChanged
  })

  onUnmounted(() => {
    // Clean up the listener when component is unmounted
    if (groupsListener) groupsListener()
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
        (await read(
          `${DB_NODES.SHARED_EXPENSES}/${groupId}/months/${monthNode}/payments`,
          false
        )) || {}

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
        (await read(
          `${DB_NODES.SHARED_LOANS}/${groupId}/months/${monthNode}/loans`,
          false
        )) || null
      const loansSource =
        loansMonthNode ||
        (await read(`${DB_NODES.SHARED_LOANS}/${groupId}`, false)) ||
        {} // fallback for legacy flat storage

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

      const remaining = record.notifications?.[mobile]

      if (remaining && remaining.length) {
        await updateData(
          `${DB_NODES.GROUPS}/${groupId}`,
          () => ({ [`notifications.${mobile}`]: remaining }),
          ''
        )
      } else {
        await updateData(
          `${DB_NODES.GROUPS}/${groupId}`,
          () => ({ [`notifications.${mobile}`]: deleteField() }),
          ''
        )
      }

      groupStore.updateGroup(record)
    } catch (err) {
      showError(err.message || err)
    }
  }

  function createNotification(group, message, type = 'rejection') {
    const notification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      rejectedBy: authStore.getActiveUser,
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
      value: member.uid || member.mobile
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

    const currentMemberMobiles = group.members.map((m) => m.uid || m.mobile)
    return userStore.getUsers.filter(
      (u) => !currentMemberMobiles.includes(u.uid || u.mobile)
    )
  })

  const availableUsersToAddOptions = computed(() =>
    availableUsersToAdd.value.map((user) => ({
      label: formatUserDisplay(storeProxy, user.uid || user.mobile, {
        name: user.name,
        preferMasked: true
      }),
      value: user.uid || user.mobile
    }))
  )

  function showAddMemberDialog(groupId) {
    addMemberGroupId.value = groupId
    selectedMemberToAdd.value = ''
    addMemberDialogVisible.value = true
  }

  function resetAddMemberForm() {
    selectedMemberToAdd.value = ''
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
      uid: user.uid || selectedMemberToAdd.value,
      mobile: user.uid || selectedMemberToAdd.value,
      phone: user.mobile || '',
      name: user.name || ''
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

      // Initialize joinRequests array if it doesn't exist
      if (!group.joinRequests) {
        group.joinRequests = []
      }

      // Add request with empty approvals array
      group.joinRequests.push({
        uid: mobile,
        mobile,
        approvals: [] // Initialize approvals for all members to vote
      })

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Join request sent'
      )

      groupStore.updateGroup(group)

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

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Request cancelled'
      )

      groupStore.updateGroup(group)

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

      // Find the join request
      const request = group.joinRequests.find((r) => r.mobile === requestMobile)
      if (!request) return

      // Initialize approvals if not exists
      if (!request.approvals) {
        request.approvals = []
      }

      // Add approval
      request.approvals.push({ uid: mobile, mobile })

      // Auto-add member if all existing members have now approved
      if (allMembersApprovedJoinRequest(group, requestMobile)) {
        if (!group.members.find((m) => m.mobile === requestMobile)) {
          group.members.push({ uid: requestMobile, mobile: requestMobile })
        }

        const ownerExists = group.members.some(
          (m) => m.mobile === group.ownerMobile
        )
        if (!group.ownerMobile || !ownerExists) {
          group.ownerMobile = requestMobile
        }

        group.joinRequests = (group.joinRequests || []).filter(
          (r) => r.mobile !== requestMobile
        )
        group.memberMobiles = computeMemberMobiles(group)

        await updateData(
          `${DB_NODES.GROUPS}/${groupId}`,
          () => group,
          'Member added'
        )

        groupStore.updateGroup(group)

        showSuccess(
          `${userStore.getUserByMobile(requestMobile)?.name || requestMobile} has been added to the group`
        )
        return
      }

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Approval recorded'
      )

      groupStore.updateGroup(group)

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
        group.members.push({
          uid: request.uid || request.mobile,
          mobile: request.uid || request.mobile
        })
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
      group.memberMobiles = computeMemberMobiles(group)

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Member added'
      )

      groupStore.updateGroup(group)

      showSuccess(
        `${userStore.getUserByMobile(request.mobile)?.name || request.mobile} has been added to the group`
      )
    } catch (err) {
      showError(err.message || err)
    }
  }

  // Reject join request
  async function rejectJoinRequest(groupId, mobile) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const requestUserName = userStore.getUserByMobile(mobile)?.name || mobile

      // Remove from join requests
      group.joinRequests = (group.joinRequests || []).filter(
        (r) => r.mobile !== mobile
      )

      // Create notification for members
      createNotification(
        group,
        `Join request from ${requestUserName} (${maskMobile(mobile)}) was rejected`
      )

      // Notify the requester
      appendNotificationForUser(group, mobile, {
        id: Date.now().toString() + Math.random(),
        type: 'rejection',
        message: `Your request to join "${group.name}" was rejected`,
        rejectedBy: authStore.getActiveUser,
        timestamp: Date.now()
      })

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Request rejected'
      )

      groupStore.updateGroup(group)

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

  function removeGroupLocally(groupId) {
    groupStore.removeGroup(groupId)

    if (groupStore.getActiveGroup === groupId) {
      groupStore.setActiveGroup(null)
    }
  }

  // Request group deletion (owner only)
  async function requestGroupDeletion(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      if (group.members.length === 1) {
        await ElMessageBox.confirm(
          'You are the only member in this group. It will be deleted immediately without any approval step.',
          'Delete Group',
          {
            confirmButtonText: 'Delete Group',
            cancelButtonText: 'Cancel',
            type: 'error'
          }
        )

        await removeData(`${DB_NODES.GROUPS}/${groupId}`)
        removeGroupLocally(groupId)
        showSuccess('Group deleted successfully')
        return
      }

      await ElMessageBox.confirm(
        'This will send a deletion request to all group members. The group can only be deleted after all members approve.',
        'Request Group Deletion',
        {
          confirmButtonText: 'Send Request',
          cancelButtonText: 'Cancel',
          type: 'error'
        }
      )

      // Initialize deletion request
      group.deleteRequest = {
        requested: true,
        requestedBy: authStore.getActiveUser,
        requestedAt: new Date().toISOString(),
        approvals: []
      }

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => group,
        'Deletion request sent'
      )

      groupStore.updateGroup(group)

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

      // Add approval
      if (!group.deleteRequest.approvals) {
        group.deleteRequest.approvals = []
      }

      group.deleteRequest.approvals.push({
        uid: mobile,
        mobile,
        approvedAt: new Date().toISOString()
      })

      if (allMembersApproved(group)) {
        // All members approved — delete the group immediately
        await removeData(`${DB_NODES.GROUPS}/${groupId}`)
        removeGroupLocally(groupId)
        showSuccess('All members approved. Group has been deleted.')
        return
      }

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ deleteRequest: group.deleteRequest }),
        ''
      )

      groupStore.updateGroup({ ...group })

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

      const me = authStore.getActiveUser
      const myUser = userStore.getUserByUid(me)
      const myName = myUser?.name || me
      const myMobile = myUser?.mobile || me

      // Create notification for members
      createNotification(
        group,
        `Group deletion request cancelled by ${myName} (${maskMobile(myMobile)})`
      )

      // Remove deletion request from local object
      delete group.deleteRequest

      // Update notifications in database
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ notifications: group.notifications }),
        ''
      )

      // Explicitly remove the deleteRequest from Firebase
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ deleteRequest: deleteField() }),
        ''
      )

      groupStore.updateGroup({ ...group })

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
      await removeData(`${DB_NODES.GROUPS}/${groupId}`)
      removeGroupLocally(groupId)
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
    originalMembers.value = [...group.members.map((m) => m.uid || m.mobile)]

    initialEditForm.value = {
      name: group.name,
      description: group.description || '',
      members: group.members.map((m) => m.uid || m.mobile)
    }
    editForm.value = {
      ...initialEditForm.value,
      members: [...initialEditForm.value.members]
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
        const changeParts = []
        if (nameChanged)
          changeParts.push(`Name: "${group.name}" → "${editForm.value.name}"`)
        if (descriptionChanged)
          changeParts.push(
            `Description: "${group.description || '(empty)'}" → "${editForm.value.description || '(empty)'}"`
          )
        const notification = {
          id: Date.now().toString(),
          type: 'group_updated',
          message: `Group updated — ${changeParts.join(' | ')}`,
          updatedBy: authStore.getActiveUser,
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
          `${DB_NODES.GROUPS}/${editingGroupId.value}`,
          () => updatedGroup,
          'Group updated'
        )

        groupStore.updateGroup(updatedGroup)
        editDialogVisible.value = false
        showSuccess('Group updated and members notified')
        return
      }

      // If members changed, create edit request
      if (membersChanged) {
        await ElMessageBox.confirm(
          `This will send an edit request to existing and newly added members for approval. Removed members will be notified. The changes will be applied after all remaining members approve.`,
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
          name: editForm.value.name,
          newMembers: editForm.value.members.map((m) => ({
            uid: m,
            mobile: m
          })),
          addedMembers: addedMembers.map((m) => ({ uid: m, mobile: m })),
          removedMembers: removedMembers.map((m) => ({ uid: m, mobile: m })),
          approvals: []
        }

        let updatedGroup = { ...group, editRequest }

        // Notify removed members — they are informed but not required to approve
        const requestedBy = authStore.getActiveUser
        for (const mobile of removedMembers) {
          updatedGroup = appendNotificationForUser(updatedGroup, mobile, {
            id: Date.now().toString() + Math.random(),
            type: 'removal-pending',
            message: `You have been proposed for removal from "${group.name}". This will take effect once existing members approve.`,
            updatedBy: requestedBy,
            timestamp: Date.now()
          })
        }

        await updateData(
          `${DB_NODES.GROUPS}/${editingGroupId.value}`,
          () => updatedGroup,
          'Edit request sent'
        )

        groupStore.updateGroup(updatedGroup)
        editDialogVisible.value = false
        showSuccess('Edit request sent to members for approval')
      } else if (nameChanged) {
        // Just name changed (already handled above, but this is a fallback)
        const updatedGroup = {
          ...group,
          name: editForm.value.name
        }

        await updateData(
          `${DB_NODES.GROUPS}/${editingGroupId.value}`,
          () => updatedGroup,
          'Group name updated'
        )

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

      // Create new editRequest with added approval
      const currentApprovals = group.editRequest.approvals || []

      // Check if user already approved
      if (currentApprovals.some((a) => a.mobile === mobile)) {
        return showSuccess('You have already approved this request')
      }

      const newApprovals = [...currentApprovals, { mobile }]
      newApprovals[newApprovals.length - 1] = { uid: mobile, mobile }

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
        finalGroup.memberMobiles = computeMemberMobiles(finalGroup)

        await setData(
          `${DB_NODES.GROUPS}/${groupId}`,
          finalGroup,
          'Edit applied'
        )
        showSuccess('Edit changes applied successfully')
      } else {
        // Just save the approval
        await updateData(
          `${DB_NODES.GROUPS}/${groupId}`,
          () => ({ editRequest: updatedEditRequest }),
          ''
        )
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

      const me = authStore.getActiveUser
      const myUser = userStore.getUserByUid(me)
      const myName = myUser?.name || me
      const myMobile = myUser?.mobile || me
      const er = group.editRequest
      const erParts = []
      if (er.name && er.name !== group.name) erParts.push(`name → "${er.name}"`)
      if ((er.addedMembers || []).length)
        erParts.push(
          `+${er.addedMembers.length} member${er.addedMembers.length > 1 ? 's' : ''}`
        )
      if ((er.removedMembers || []).length)
        erParts.push(
          `-${er.removedMembers.length} member${er.removedMembers.length > 1 ? 's' : ''}`
        )
      const erDetail = erParts.length ? ` [${erParts.join(' | ')}]` : ''

      // Create notification for members
      createNotification(
        group,
        `Group edit request cancelled by ${myName} (${maskMobile(myMobile)})${erDetail}`
      )

      // Remove the edit request from local object
      delete group.editRequest

      // Update notifications in database first
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ notifications: group.notifications }),
        ''
      )

      // Explicitly remove the editRequest from Firebase
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ editRequest: deleteField() }),
        ''
      )

      groupStore.updateGroup({ ...group })

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

      const addMemberRequest = {
        requestedBy: mobile,
        requestedAt: new Date().toISOString(),
        newMember: newMember,
        approvals: [{ uid: mobile, mobile }]
      }

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ addMemberRequest }),
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

      const currentApprovals = group.addMemberRequest.approvals || []

      if (currentApprovals.some((a) => a.mobile === mobile)) {
        return showSuccess('You have already approved this request')
      }

      const updatedRequest = {
        ...group.addMemberRequest,
        approvals: [...currentApprovals, { uid: mobile, mobile }]
      }

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ addMemberRequest: updatedRequest }),
        ''
      )

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
      updatedGroup.memberMobiles = computeMemberMobiles(updatedGroup)

      await setData(
        `${DB_NODES.GROUPS}/${groupId}`,
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

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({ addMemberRequest: deleteField() }),
        ''
      )
      showSuccess('Add member request rejected')
    } catch (err) {
      if (err !== 'cancel') {
        showError(err.message || err)
      }
    }
  }

  // ========== Leave Group Functions ==========

  // Returns a human-readable block reason, or null if leave is allowed.
  async function getLeaveBlockReason(group, mobile) {
    const paymentIncludesUser = (payment) => {
      if (!payment) return false
      if (payment.payer === mobile) return true
      if (
        payment.payerMode === 'multiple' &&
        Array.isArray(payment.payers) &&
        payment.payers.some((payer) => payer.mobile === mobile)
      )
        return true
      if (
        Array.isArray(payment.split) &&
        payment.split.some((split) => split.mobile === mobile)
      )
        return true
      if (
        Array.isArray(payment.participants) &&
        payment.participants.some((p) =>
          typeof p === 'string'
            ? p === mobile
            : p?.mobile === mobile || p?.userId === mobile
        )
      )
        return true
      return false
    }

    // Block if any group-level request is pending
    const openRequests = [
      group.editRequest && 'a membership edit is pending',
      group.deleteRequest && 'a group deletion request is pending',
      group.addMemberRequest && 'an add-member request is pending',
      group.transferOwnershipRequest && 'an ownership transfer is pending',
      group.settlementRequest && 'a settlement request is pending',
      (group.joinRequests || []).length > 0 && 'a join request is pending'
    ].filter(Boolean)

    if (openRequests.length > 0) {
      return `Cannot leave while ${openRequests[0]}. Resolve it first.`
    }

    try {
      let net = 0
      let hasActiveUserTransactions = false

      // ── Payments — query via collectionGroup using the 'group' field
      // (all payments saved via the app carry a 'group' field set to the groupId)
      const paymentsSnap = await getDocs(
        query(
          collectionGroup(database, 'payments'),
          where('group', '==', group.id)
        )
      )
      for (const paymentDoc of paymentsSnap.docs) {
        const payment = { id: paymentDoc.id, ...paymentDoc.data() }

        if (payment?.deleteRequest || payment?.updateRequest) {
          return 'Cannot leave while a shared expense change request is pending. Resolve it first.'
        }

        if (paymentIncludesUser(payment)) hasActiveUserTransactions = true

        const amount = parseFloat(payment.amount) || 0
        if (!amount) continue

        let share = 0
        if (Array.isArray(payment.split)) {
          const selfSplit = payment.split.find((s) => s.mobile === mobile)
          share = parseFloat(selfSplit?.amount) || 0
        } else if (Array.isArray(payment.participants)) {
          const isParticipant = payment.participants.some((p) =>
            typeof p === 'string'
              ? p === mobile
              : p?.mobile === mobile || p?.userId === mobile
          )
          if (isParticipant) share = amount / payment.participants.length
        }

        let credit = 0
        if (payment.payerMode === 'multiple' && Array.isArray(payment.payers)) {
          const selfPayer = payment.payers.find((p) => p.mobile === mobile)
          credit = parseFloat(selfPayer?.amount) || 0
        } else if (payment.payer === mobile) {
          credit = amount
        }

        net += credit - share
      }

      // ── Loans — query via collectionGroup (new loans have 'group' field)
      const loansSnap = await getDocs(
        query(
          collectionGroup(database, 'loans'),
          where('group', '==', group.id)
        )
      )
      for (const loanDoc of loansSnap.docs) {
        const loan = { id: loanDoc.id, ...loanDoc.data() }

        if (loan?.deleteRequest || loan?.updateRequest) {
          return 'Cannot leave while a shared loan change request is pending. Resolve it first.'
        }

        if (loan?.giver === mobile || loan?.receiver === mobile)
          hasActiveUserTransactions = true

        const amt = parseFloat(loan.amount) || 0
        if (!amt) continue
        if (loan.giver === mobile) net += amt
        if (loan.receiver === mobile) net -= amt
      }

      // ── Fallback: check old loans via month enumeration (loans without 'group' field)
      const loanMonths = await readShallow(
        `${DB_NODES.SHARED_LOANS}/${group.id}/months`,
        false
      )
      for (const month of loanMonths || []) {
        const loansByMonth =
          (await read(
            `${DB_NODES.SHARED_LOANS}/${group.id}/months/${month}/loans`,
            false
          )) || {}
        Object.values(loansByMonth).forEach((loan) => {
          if (loan?.group) return // already counted via collectionGroup above
          if (loan?.deleteRequest || loan?.updateRequest) {
            throw new Error(
              'Cannot leave while a shared loan change request is pending. Resolve it first.'
            )
          }
          if (loan?.giver === mobile || loan?.receiver === mobile)
            hasActiveUserTransactions = true
          const amt = parseFloat(loan.amount) || 0
          if (!amt) return
          if (loan.giver === mobile) net += amt
          if (loan.receiver === mobile) net -= amt
        })
      }

      const roundedNet = parseFloat(net.toFixed(2))
      if (hasActiveUserTransactions) {
        return 'Cannot leave while you still have active shared expenses or loans in this group. Finalize settlement first.'
      }
      if (roundedNet !== 0) {
        return `Cannot leave while you have an unsettled balance (${roundedNet > 0 ? '+' : ''}${roundedNet}). Settle up first.`
      }
    } catch (err) {
      if (err instanceof Error && err.message) return err.message
      console.error('Balance check failed during leave', err)
      return 'Could not verify your balance. Please try again.'
    }

    return null
  }

  async function requestLeaveGroup(groupId) {
    try {
      const group = groups.value.find((g) => g.id === groupId)
      if (!group) return

      const mobile = authStore.getActiveUser
      const isOwner = group.ownerMobile === mobile
      const memberCount = group.members.length

      if (memberCount === 1) {
        await ElMessageBox.confirm(
          'You are the only member in this group. Leaving will immediately delete the empty group.',
          'Leave Group',
          {
            confirmButtonText: 'Leave and Delete Group',
            cancelButtonText: 'Cancel',
            type: 'error'
          }
        )
        await removeData(`${DB_NODES.GROUPS}/${groupId}`)
        removeGroupLocally(groupId)
        showSuccess('You left the group and it was deleted automatically.')
        return
      }

      // Owner with more than 2 members must transfer ownership first
      if (isOwner && memberCount > 2) {
        await ElMessageBox.confirm(
          'You are the group owner. You must transfer ownership to another member before leaving the group.',
          'Transfer Ownership Required',
          {
            confirmButtonText: 'Transfer Ownership',
            cancelButtonText: 'Cancel',
            type: 'info'
          }
        )
        showTransferOwnershipDialog(groupId)
        return
      }

      // Check open requests and unsettled balance before allowing leave
      const blockReason = await getLeaveBlockReason(group, mobile)
      if (blockReason) {
        return showError(blockReason)
      }

      const otherMember = group.members.find((m) => m.mobile !== mobile)
      const confirmMessage =
        isOwner && memberCount === 2
          ? `You are the owner. Ownership will be transferred to ${userStore.getUserByMobile(otherMember.mobile)?.name || otherMember.mobile} when you leave.`
          : 'Are you sure you want to leave this group?'

      await ElMessageBox.confirm(confirmMessage, 'Leave Group', {
        confirmButtonText: 'Leave',
        cancelButtonText: 'Cancel',
        type: 'info'
      })

      // Transfer ownership if leaving owner with 2 members
      const updatedGroup = { ...group }
      if (isOwner && otherMember) {
        updatedGroup.ownerMobile = otherMember.mobile
      }

      updatedGroup.members = updatedGroup.members.filter(
        (m) => m.mobile !== mobile
      )
      updatedGroup.memberMobiles = computeMemberMobiles(updatedGroup)

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => updatedGroup,
        'You have left the group'
      )
      groupStore.updateGroup(updatedGroup)
      showSuccess('You have left the group')
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
        'This will send an ownership transfer request to the selected member. The transfer will happen once they accept.',
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

      // Add transfer request — only the new owner needs to accept
      group.transferOwnershipRequest = {
        newOwner: newOwnerMobile.value,
        requestedBy: authStore.getActiveUser
      }

      await updateData(
        `${DB_NODES.GROUPS}/${transferOwnershipGroupId.value}`,
        () => group,
        'Transfer request sent'
      )

      groupStore.updateGroup(group)

      transferDialogVisible.value = false
      showSuccess('Ownership transfer request sent to the selected member')
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

      // Only the designated new owner may accept
      if (group.transferOwnershipRequest?.newOwner !== mobile) {
        return showError(
          'Only the designated new owner can accept this transfer'
        )
      }

      // Transfer ownership immediately upon new owner's acceptance
      group.ownerMobile = group.transferOwnershipRequest.newOwner
      delete group.transferOwnershipRequest

      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({
          ownerMobile: group.ownerMobile,
          transferOwnershipRequest: deleteField()
        }),
        ''
      )

      groupStore.updateGroup({ ...group })
      showSuccess('Ownership has been transferred successfully')
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

      const newOwnerMobile = group.transferOwnershipRequest?.newOwner
      const newOwnerName =
        userStore.getUserByMobile(newOwnerMobile)?.name || newOwnerMobile

      // Create notification for members
      createNotification(
        group,
        `Ownership transfer request to ${newOwnerName} (${maskMobile(newOwnerMobile)}) was rejected`
      )

      // Remove transfer request from local object
      delete group.transferOwnershipRequest

      // Update notifications and remove transfer request in database
      await updateData(
        `${DB_NODES.GROUPS}/${groupId}`,
        () => ({
          notifications: group.notifications || null,
          transferOwnershipRequest: deleteField()
        }),
        ''
      )

      groupStore.updateGroup({ ...group })

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
    const user = userStore.getUserByMobile(targetMobile)
    const resolvedMobile = user?.mobile || targetMobile
    if (targetMobile === authStore.getActiveUser) return resolvedMobile
    const isActiveUserInGroup = (group?.members || []).some(
      (m) => m.mobile === authStore.getActiveUser
    )
    const isTargetInGroup = (group?.members || []).some(
      (m) => m.mobile === targetMobile
    )
    if (isActiveUserInGroup && isTargetInGroup) return resolvedMobile
    return user?.maskedMobile || maskMobile(resolvedMobile)
  }

  function displayMobileInEditDialog(targetMobile) {
    const editGroup = groups.value.find((g) => g.id === editingGroupId.value)
    return displayMobileForGroup(targetMobile, editGroup)
  }

  const editMemberOptions = computed(() =>
    (userStore.getUsers || []).map((user) => ({
      label: formatUserDisplay(storeProxy, user.uid || user.mobile, {
        name: user.name,
        group: groups.value.find((g) => g.id === editingGroupId.value),
        preferMasked: !groups.value
          .find((g) => g.id === editingGroupId.value)
          ?.members?.some(
            (member) =>
              (member.uid || member.mobile) === (user.uid || user.mobile)
          )
      }),
      value: user.uid || user.mobile
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
        isCurrentUserPendingOwner(group)
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
    isPageLoading,
    searchQuery,
    sortOrder,
    filterByUser,
    filterByCategory,
    allGroupMembers,
    allGroupMemberOptions,
    allCategoryOptions,
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
    resetAddMemberForm,

    // Notifications
    hideNotification,
    groupNotifications,

    // Pin
    isPinned,
    togglePin,
    joinedGroupsForShare,
    pinnedGroupsForShare,
    shareJoinedGroups,
    sharePinnedGroups,
    shareSingleGroup,

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
        label: 'Share',
        show: true,
        type: 'success',
        onClick: () => shareSingleGroup(group)
      },
      {
        label: 'Leave',
        show: isMember,
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
        label: `Delete Pending (${getDeleteApprovals(group).length}/${group.members.length})`,
        show: isOwner && hasDeleteRequest(group),
        disabled: true,
        type: ''
      },
      {
        label: group.members.length === 1 ? 'Delete Group' : 'Request Delete',
        show: isOwner && !hasDeleteRequest(group),
        type: 'danger',
        onClick: () => requestGroupDeletion(group.id)
      }
    ].filter((action) => action.show)
  }
}
