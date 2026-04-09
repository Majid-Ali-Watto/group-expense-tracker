import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  auth,
  onAuthStateChanged,
  collection,
  database,
  getDocs,
  query,
  where
} from '@/firebase'
import { useFireBase } from '@/composables'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import {
  normalizeSharedGroupIds,
  appendNotificationForUser,
  maskMobile,
  showError,
  showSuccess
} from '@/utils'

export const SharedGroups = () => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { read, updateData } = useFireBase()

  const loading = ref(true)
  const actioningGroupId = ref(null)
  let unsubscribeAuth = null

  const sharedIds = computed(() => normalizeSharedGroupIds(route.query.ids))
  const sharedGroups = computed(() =>
    sharedIds.value.map((id) => groupStore.getGroupById(id)).filter(Boolean)
  )
  const missingGroupIds = computed(() =>
    sharedIds.value.filter((id) => !groupStore.getGroupById(id))
  )

  const activeUser = computed(() => authStore.getActiveUser)

  function displayMobileForGroup(targetMobile) {
    if (!targetMobile) return ''
    const user = userStore.getUserByMobile(targetMobile)
    const resolvedMobile = user?.mobile || targetMobile
    // Active user sees their own real mobile; everyone else is always masked
    if (targetMobile === activeUser.value) return resolvedMobile
    return user?.maskedMobile || maskMobile(resolvedMobile)
  }

  function isMember(group) {
    return (group?.members || []).some(
      (member) => member.mobile === activeUser.value
    )
  }

  function hasPendingJoinRequest(group) {
    return (group?.joinRequests || []).some(
      (request) => request.mobile === activeUser.value
    )
  }

  function isInvited(group) {
    return (group?.pendingMembers || []).some(
      (member) => member.mobile === activeUser.value
    )
  }

  async function loadSharedGroups() {
    loading.value = true
    try {
      const [usersData, groupsData] = await Promise.all([
        getDocs(
          query(
            collection(database, DB_NODES.USERS),
            where('emailVerified', '==', true)
          )
        ),
        read(DB_NODES.GROUPS, false)
      ])

      if (!usersData.empty) {
        const users = usersData.docs.map((docSnap) => {
          const user = docSnap.data()
          return {
            uid: docSnap.id,
            mobile: user.mobile || '',
            name: user.name || '',
            email: user.email || '',
            maskedMobile: maskMobile(user.mobile || ''),
            bugResolver: user.bugResolver === true
          }
        })
        userStore.setUsers(users)
      }

      if (groupsData) {
        const groups = Object.keys(groupsData).map((id) => ({
          id,
          ...groupsData[id]
        }))
        groupStore.setGroups(groups)
      } else {
        groupStore.setGroups([])
      }
    } catch (error) {
      console.error('Failed to load shared groups:', error)
      showError('Failed to load shared groups.')
    } finally {
      loading.value = false
    }
  }

  async function selectSharedGroup(group) {
    actioningGroupId.value = group.id
    try {
      groupStore.setActiveGroup(group.id)
      groupStore.setScrollToGroupTrigger({
        groupId: group.id,
        timestamp: Date.now()
      })
      await router.push('/groups')
      showSuccess(`Selected group: ${group.name}`)
    } finally {
      actioningGroupId.value = null
    }
  }

  async function requestJoin(group) {
    actioningGroupId.value = group.id
    try {
      const me = userStore.getUserByUid(activeUser.value)
      const myName = me?.name || activeUser.value
      const myMobile = me?.mobile || activeUser.value
      const newRequests = [
        ...(group.joinRequests || []),
        { uid: activeUser.value, mobile: myMobile, approvals: [] }
      ]

      let payload = { joinRequests: newRequests }
      let updatedGroup = { ...group, joinRequests: newRequests }

      for (const member of group.members || []) {
        if (member.mobile === activeUser.value) continue
        updatedGroup = appendNotificationForUser(updatedGroup, member.mobile, {
          id: `${Date.now()}-${Math.random()}`,
          type: 'join-request',
          message: `${myName} (${maskMobile(myMobile)}) wants to join "${group.name}"`,
          updatedBy: activeUser.value,
          timestamp: Date.now()
        })
      }

      if (updatedGroup.notifications) {
        payload = { ...payload, notifications: updatedGroup.notifications }
      }

      await updateData(
        `${DB_NODES.GROUPS}/${group.id}`,
        () => payload,
        'Join request sent! Waiting for member approval.'
      )

      groupStore.updateGroup(updatedGroup)
    } catch {
      showError('Failed to send join request. Please try again.')
    } finally {
      actioningGroupId.value = null
    }
  }

  async function acceptInvitation(group) {
    actioningGroupId.value = group.id
    try {
      const me = userStore.getUserByUid(activeUser.value)
      const myName = me?.name || activeUser.value
      const myMobile = me?.mobile || activeUser.value
      const newMembers = [
        ...(group.members || []),
        { uid: activeUser.value, mobile: myMobile }
      ]
      const newPending = (group.pendingMembers || []).filter(
        (member) => member.mobile !== myMobile
      )

      let payload = {
        members: newMembers,
        pendingMembers: newPending.length ? newPending : null,
        memberMobiles: [
          ...new Set([
            ...newMembers.map((member) => member.uid || member.mobile),
            ...newPending.map((member) => member.uid || member.mobile)
          ])
        ]
      }

      let updatedGroup = {
        ...group,
        members: newMembers,
        pendingMembers: newPending.length ? newPending : null
      }

      if (group.ownerMobile && group.ownerMobile !== activeUser.value) {
        updatedGroup = appendNotificationForUser(
          updatedGroup,
          group.ownerMobile,
          {
            id: `${Date.now()}-${Math.random()}`,
            type: 'invitation-accepted',
            message: `${myName} (${maskMobile(myMobile)}) accepted your invitation to join "${group.name}"`,
            updatedBy: activeUser.value,
            timestamp: Date.now()
          }
        )
      }

      if (updatedGroup.notifications) {
        payload = { ...payload, notifications: updatedGroup.notifications }
      }

      await updateData(
        `${DB_NODES.GROUPS}/${group.id}`,
        () => payload,
        'You have joined the group!'
      )

      groupStore.updateGroup(updatedGroup)
    } catch {
      showError('Failed to join this group. Please try again.')
    } finally {
      actioningGroupId.value = null
    }
  }

  async function joinSharedGroup(group) {
    if (isMember(group)) {
      return selectSharedGroup(group)
    }
    if (hasPendingJoinRequest(group)) return
    if (isInvited(group)) {
      return acceptInvitation(group)
    }
    return requestJoin(group)
  }

  function loadBalances() {}

  onMounted(() => {
    unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        loading.value = false
        return
      }

      unsubscribeAuth?.()
      unsubscribeAuth = null
      loadSharedGroups()
    })
  })

  onUnmounted(() => {
    unsubscribeAuth?.()
  })

  watch(sharedIds, () => {
    if (!auth.currentUser) return
    loadSharedGroups()
  })

  return {
    loading,
    actioningGroupId,
    sharedIds,
    sharedGroups,
    missingGroupIds,
    userStore,
    displayMobileForGroup,
    isMember,
    hasPendingJoinRequest,
    joinSharedGroup,
    loadBalances,
    selectSharedGroup
  }
}
