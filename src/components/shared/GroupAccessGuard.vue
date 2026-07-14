<template>
  <div v-bind="$attrs">
    <!-- Pass-through: render the slot when the user is a confirmed member -->
    <slot v-if="isMember && !isInteractionBlocked" />

    <!-- Loading state while group data is being fetched -->
    <div
      v-else-if="effectiveLoading"
      class="flex items-center justify-center py-24"
    >
      <LoadingSkeleton mode="page" />
    </div>

    <!-- Group not found -->
    <div
      v-else-if="!group"
      class="flex flex-col items-center justify-center py-24 gap-4 text-center px-4"
    >
      <div class="text-5xl">🔍</div>
      <h2 class="text-xl font-semibold">{{ t('shared.groupNotFound') }}</h2>
      <p class="text-sm text-gray-500 max-w-xs">
        {{ t('shared.groupNotFoundText') }}
      </p>
      <el-button type="primary" @click="router.push('/groups')">
        {{ t('shared.goToGroups') }}
      </el-button>
    </div>

    <div
      v-else-if="isInteractionBlocked"
      class="flex flex-col items-center justify-center py-16 gap-5 text-center px-4"
    >
      <div class="text-5xl">⛔</div>
      <div>
        <h2 class="text-xl font-semibold">
          {{ group?.name || t('shared.blockedAccessFallback') }}
        </h2>
        <p class="text-sm text-gray-400 mt-1">
          {{ blockedMessage }}
        </p>
      </div>

      <el-button type="primary" @click="router.push('/groups')">
        {{ t('shared.goToGroups') }}
      </el-button>
    </div>

    <!-- User is not a member — show join options -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-16 gap-5 text-center px-4"
    >
      <div class="text-5xl">🔒</div>
      <div>
        <h2 class="text-xl font-semibold">{{ group.name }}</h2>
        <p class="text-sm text-gray-400 mt-1">{{ group.description }}</p>
      </div>

      <el-alert type="warning" :closable="false" class="max-w-sm text-left">
        <template #default>
          {{ t('shared.notMemberNotice') }}
        </template>
      </el-alert>

      <!-- Pending invitation: accept or decline -->
      <div v-if="isInvited" class="flex gap-3">
        <el-button type="success" :loading="actioning" @click="accept">
          {{ t('shared.acceptInvitation') }}
        </el-button>
        <el-button type="danger" plain :loading="actioning" @click="decline">
          {{ t('groups.decline') }}
        </el-button>
      </div>

      <!-- Pending join request already sent -->
      <div
        v-else-if="hasPendingJoinRequest"
        class="flex flex-col items-center gap-2"
      >
        <el-tag type="warning" size="large"
          >⏳ {{ t('groups.joinRequestPending') }}</el-tag
        >
        <p class="text-xs text-gray-400">
          {{
            t('groups.approvalsCount', {
              approved: joinRequestApprovals,
              total: group.members?.length ?? 0
            })
          }}
        </p>
      </div>

      <!-- No relationship yet — send join request -->
      <div v-else class="flex flex-col items-center gap-3">
        <el-button type="primary" :loading="actioning" @click="sendJoinRequest">
          {{ t('shared.requestToJoin') }}
        </el-button>
      </div>

      <el-button text @click="router.push('/groups')">{{
        t('shared.backToGroupsArrow')
      }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useFireBase } from '@/composables'
import { DB_NODES } from '@/constants'
import { maskMobile, appendNotificationForUser, showError } from '@/utils'
import {
  getActiveUserBlockedMessage,
  getBlockedEntityMessage,
  isGroupBlocked,
  isUserBlocked
} from '@/helpers'
import LoadingSkeleton from './LoadingSkeleton.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  groupId: { type: String, required: true },
  isLoading: { type: Boolean, default: false }
})

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const groupStore = useGroupStore()
const userStore = useUserStore()

const { updateData, read } = useFireBase()

// Self-load groups when the component is mounted without going through the Groups tab
// (e.g., page refresh on /shared-expenses/:groupId or following a shared URL).
const groupsLoading = ref(groupStore.getGroups.length === 0)
onMounted(async () => {
  if (groupStore.getGroups.length > 0) {
    groupsLoading.value = false
    return
  }
  try {
    const data = await read(DB_NODES.GROUPS, false)
    if (data) {
      const groupList = Object.keys(data).map((k) => ({ id: k, ...data[k] }))
      groupStore.setGroups(groupList)
    } else {
      groupStore.setGroups([])
    }
  } catch {
    groupStore.setGroups([])
  } finally {
    groupsLoading.value = false
  }
})

const effectiveLoading = computed(() => groupsLoading.value || props.isLoading)

const actioning = ref(false)
const me = computed(() => authStore.getActiveUserUid)
const group = computed(() => groupStore.getGroupById(props.groupId))
const activeUserRecord = computed(() => userStore.getUserByUid(me.value))
const isGroupBlockedState = computed(() => isGroupBlocked(group.value))
const isActiveUserBlocked = computed(() =>
  isUserBlocked(activeUserRecord.value)
)
const isInteractionBlocked = computed(
  () => isGroupBlockedState.value || isActiveUserBlocked.value
)
const blockedMessage = computed(() =>
  isGroupBlockedState.value
    ? getBlockedEntityMessage('group')
    : getActiveUserBlockedMessage()
)

const isMember = computed(() =>
  (group.value?.members || []).some((m) => m.uid === me.value)
)

const isInvited = computed(() =>
  (group.value?.pendingMembers || []).some((m) => m.uid === me.value)
)

const hasPendingJoinRequest = computed(() =>
  (group.value?.joinRequests || []).some((r) => r.uid === me.value)
)

const joinRequestApprovals = computed(() => {
  const req = (group.value?.joinRequests || []).find((r) => r.uid === me.value)
  return req?.approvals?.length ?? 0
})

// ── Accept invitation ────────────────────────────────────────────────────
async function accept() {
  if (!group.value) return
  if (isInteractionBlocked.value) {
    showError(blockedMessage.value)
    return
  }
  actioning.value = true
  try {
    const myUser = userStore.getUserByUid(me.value)
    const myName = myUser?.name || me.value
    const myMobile = myUser?.mobile || me.value
    const newMembers = [...(group.value.members || []), { uid: me.value }]
    const newPending = (group.value.pendingMembers || []).filter(
      (m) => m.uid !== me.value
    )

    let payload = {
      members: newMembers,
      pendingMembers: newPending.length ? newPending : null,
      memberUids: [
        ...new Set([
          ...newMembers.map((member) => member.uid),
          ...newPending.map((member) => member.uid)
        ])
      ]
    }

    if (group.value.ownerUid && group.value.ownerUid !== me.value) {
      const withNotif = appendNotificationForUser(
        { ...group.value },
        group.value.ownerUid,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'invitation-accepted',
          message: t('groupsMessages.acceptedInvitationNotif', {
            name: myName,
            mobile: maskMobile(myMobile),
            groupName: group.value.name
          }),
          updatedBy: me.value,
          timestamp: Date.now()
        }
      )
      if (withNotif.notifications)
        payload.notifications = withNotif.notifications
    }

    await updateData(
      `${DB_NODES.GROUPS}/${props.groupId}`,
      () => payload,
      t('groupsMessages.joinedGroupSuccess')
    )
  } catch {
    showError(t('shared.acceptInvitationFailed'))
  } finally {
    actioning.value = false
  }
}

// ── Decline invitation ───────────────────────────────────────────────────
async function decline() {
  if (!group.value) return
  if (isInteractionBlocked.value) {
    showError(blockedMessage.value)
    return
  }
  actioning.value = true
  try {
    const myUser = userStore.getUserByUid(me.value)
    const myName = myUser?.name || me.value
    const myMobile = myUser?.mobile || me.value
    const newPending = (group.value.pendingMembers || []).filter(
      (m) => m.uid !== me.value
    )
    let payload = {
      pendingMembers: newPending.length ? newPending : null,
      memberUids: newPending.map((member) => member.uid)
    }

    if (group.value.ownerUid && group.value.ownerUid !== me.value) {
      const withNotif = appendNotificationForUser(
        { ...group.value },
        group.value.ownerUid,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'invitation-declined',
          message: t('groupsMessages.declinedInvitationNotif', {
            name: myName,
            mobile: maskMobile(myMobile),
            groupName: group.value.name
          }),
          updatedBy: me.value,
          timestamp: Date.now()
        }
      )
      if (withNotif.notifications)
        payload.notifications = withNotif.notifications
    }

    await updateData(
      `${DB_NODES.GROUPS}/${props.groupId}`,
      () => payload,
      t('groupsMessages.invitationDeclined')
    )
  } catch {
    showError(t('shared.declineInvitationFailed'))
  } finally {
    actioning.value = false
  }
}

// ── Send join request ────────────────────────────────────────────────────
async function sendJoinRequest() {
  if (!group.value) return
  if (isInteractionBlocked.value) {
    showError(blockedMessage.value)
    return
  }
  actioning.value = true
  try {
    const myUser = userStore.getUserByUid(me.value)
    const myName = myUser?.name || me.value
    const myMobile = myUser?.mobile || me.value
    const existing = group.value.joinRequests || []
    if (existing.some((r) => r.uid === me.value)) {
      showError(t('shared.pendingJoinRequestExists'))
      return
    }

    const newRequests = [
      ...existing,
      { uid: me.value, mobile: myMobile, approvals: [] }
    ]
    let payload = { joinRequests: newRequests }

    // Notify all existing members
    let updatedGroup = { ...group.value }
    for (const member of group.value.members || []) {
      if (member.uid !== me.value) {
        updatedGroup = appendNotificationForUser(updatedGroup, member.uid, {
          id: `${Date.now()}-${Math.random()}`,
          type: 'join-request',
          message: t('groupsMessages.wantsToJoinNotif', {
            name: myName,
            mobile: maskMobile(myMobile),
            groupName: group.value.name
          }),
          updatedBy: me.value,
          timestamp: Date.now()
        })
      }
    }
    if (updatedGroup.notifications)
      payload.notifications = updatedGroup.notifications

    await updateData(
      `${DB_NODES.GROUPS}/${props.groupId}`,
      () => payload,
      t('shared.joinRequestSent')
    )
  } catch {
    showError(t('shared.joinRequestFailed'))
  } finally {
    actioning.value = false
  }
}
</script>
