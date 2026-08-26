import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
import {
  getActiveUserBlockedMessage,
  getBlockedEntityMessage,
  isGroupBlocked,
  isUserBlocked
} from '@/helpers'
import { getDisplayMobile } from '@/utils/user-display'
import { createUserDisplayStoreProxy } from '@/composables'

export const SharedGroups = () => {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = createUserDisplayStoreProxy(authStore, userStore)
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

  const activeUserUid = computed(() => authStore.getActiveUserUid)
  const activeUserRecord = computed(() =>
    userStore.getUserByUid(activeUserUid.value)
  )
  const activeUserIsBlocked = computed(() =>
    isUserBlocked(activeUserRecord.value)
  )

  function displayMobileForGroup(targetMobile) {
    return getDisplayMobile(storeProxy, targetMobile)
  }

  function isMember(group) {
    return (group?.members || []).some(
      (member) => member.uid === activeUserUid.value
    )
  }

  function hasPendingJoinRequest(group) {
    return (group?.joinRequests || []).some(
      (request) => request.uid === activeUserUid.value
    )
  }

  function isInvited(group) {
    return (group?.pendingMembers || []).some(
      (member) => member.uid === activeUserUid.value
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
        // isAdmin/billedUser deliberately not picked here — they
        // live in user-admin-flags/{uid} and are never needed for anyone but
        // the active user (see userStore.getActiveUserAdminFlags). email is
        // the same story — it lives in user-private/{uid} (see
        // userStore.getActiveUserPrivate).
        const users = usersData.docs.map((docSnap) => {
          const user = docSnap.data()
          return {
            uid: docSnap.id,
            mobile: user.mobile || '',
            name: user.name || '',
            photoUrl: user.photoUrl || '',
            photoMeta: user.photoMeta || null,
            maskedMobile: maskMobile(user.mobile || ''),
            blocked: user.blocked === true
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
      showError(t('groupsMessages.failedLoadSharedGroups'))
    } finally {
      loading.value = false
    }
  }

  async function selectSharedGroup(group) {
    if (activeUserIsBlocked.value) {
      showError(getActiveUserBlockedMessage())
      return
    }
    if (isGroupBlocked(group)) {
      showError(getBlockedEntityMessage('group'))
      return
    }

    actioningGroupId.value = group.id
    try {
      groupStore.setActiveGroup(group.id)
      groupStore.setScrollToGroupTrigger({
        groupId: group.id,
        timestamp: Date.now()
      })
      await router.push('/groups')
      showSuccess(
        t('groupsMessages.selectedGroupSuccess', { name: group.name })
      )
    } finally {
      actioningGroupId.value = null
    }
  }

  async function requestJoin(group) {
    if (activeUserIsBlocked.value) {
      showError(getActiveUserBlockedMessage())
      return
    }
    if (isGroupBlocked(group)) {
      showError(getBlockedEntityMessage('group'))
      return
    }

    actioningGroupId.value = group.id
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
        if (member.uid === activeUserUid.value) continue
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
    } finally {
      actioningGroupId.value = null
    }
  }

  async function acceptInvitation(group) {
    if (activeUserIsBlocked.value) {
      showError(getActiveUserBlockedMessage())
      return
    }
    if (isGroupBlocked(group)) {
      showError(getBlockedEntityMessage('group'))
      return
    }

    actioningGroupId.value = group.id
    try {
      const me = userStore.getUserByUid(activeUserUid.value)
      const myName = me?.name || activeUserUid.value
      const myMobile = me?.mobile || activeUserUid.value
      const newMembers = [
        ...(group.members || []),
        { uid: activeUserUid.value }
      ]
      const newPending = (group.pendingMembers || []).filter(
        (member) => member.uid !== activeUserUid.value
      )

      let payload = {
        members: newMembers,
        pendingMembers: newPending,
        memberUids: [
          ...new Set([
            ...newMembers.map((member) => member.uid),
            ...newPending.map((member) => member.uid)
          ])
        ]
      }

      let updatedGroup = {
        ...group,
        members: newMembers,
        pendingMembers: newPending
      }

      if (group.ownerUid && group.ownerUid !== activeUserUid.value) {
        updatedGroup = appendNotificationForUser(updatedGroup, group.ownerUid, {
          id: `${Date.now()}-${Math.random()}`,
          type: 'invitation-accepted',
          message: t('groupsMessages.acceptedInvitationNotif', {
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
        t('groupsMessages.joinedGroupSuccess')
      )

      groupStore.updateGroup(updatedGroup)
    } catch {
      showError(t('groupsMessages.failedJoinGroup'))
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
    selectSharedGroup,
    activeUserIsBlocked
  }
}
