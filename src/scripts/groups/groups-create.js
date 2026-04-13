import { ref, watch } from 'vue'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useFireBase, useUsersOptions } from '@/composables'
import { showError } from '@/utils'
import { DB_NODES } from '@/constants'
import { ACTIVE_USER_BLOCKED_MESSAGE, isUserBlocked } from '@/helpers'

export const GroupsCreate = (emit, props) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { setData, isSubmitting } = useFireBase()
  const { usersOptions } = useUsersOptions({ allUsers: true })

  const createEmptyGroupForm = () => ({
    name: '',
    description: '',
    members: [],
    category: ''
  })

  const groupForm = ref(createEmptyGroupForm())
  const groupFormRef = ref(null)


  function buildMemberSnapshot(userId) {
    const user = userStore.getUserByUid(userId)
    return {
      uid: userId,
      mobile: user?.mobile || userId,
      name: user?.name || '',
      phone: user?.mobile || ''
    }
  }

  async function createGroup() {
    groupFormRef.value.validate(async (valid) => {
      if (!valid) return
      await doCreateGroup()
    })
  }

  async function doCreateGroup() {
    const creatorId = authStore.getActiveUser
    if (isUserBlocked(userStore.getUserByUid(creatorId))) {
      return showError(ACTIVE_USER_BLOCKED_MESSAGE)
    }

    // Auto-include creator if not already selected
    if (!groupForm.value.members.includes(creatorId)) {
      groupForm.value.members = [creatorId, ...groupForm.value.members]
    }

    if (groupForm.value.members.length < 2) {
      return showError('At least two members are required to create a group')
    }

    const newName = groupForm.value.name.trim().toLowerCase()
    const allGroups = groupStore.getGroups || []

    // Rule 1: owner can never create two groups with the same name
    const ownerDuplicate = allGroups.some(
      (g) =>
        g.ownerMobile === creatorId && g.name.trim().toLowerCase() === newName
    )
    if (ownerDuplicate) {
      return showError('You already have a group with this name')
    }

    // Rule 2: none of the other members (excluding creator) can already be
    // in an existing group with the same name
    const otherMembers = (groupForm.value.members || []).filter(
      (m) => m !== creatorId
    )
    const sameNameGroups = allGroups.filter(
      (g) => g.name.trim().toLowerCase() === newName
    )
    const memberConflict = sameNameGroups.some((g) => {
      const existingIds = [
        ...(g.members || []),
        ...(g.pendingMembers || [])
      ].map((m) => m.uid || m.mobile)
      return otherMembers.some((m) => existingIds.includes(m))
    })
    if (memberConflict) {
      return showError(
        'One or more members are already in a group with this name'
      )
    }

    const id = Date.now().toString()
    const allSelected = groupForm.value.members || []
    const pendingMembers = allSelected
      .filter((m) => m !== creatorId)
      .map((m) => buildMemberSnapshot(m))
    const payload = {
      id,
      name: groupForm.value.name,
      description: groupForm.value.description || '',
      category: groupForm.value.category || '',
      blocked: false,
      ownerMobile: authStore.getActiveUser,
      // Only the creator joins immediately; all others receive an invitation
      members: [buildMemberSnapshot(creatorId)],
      pendingMembers,
      // Flat array of UIDs (members + pending) used for
      // efficient per-user Firestore queries via array-contains.
      memberMobiles: [
        ...new Set([creatorId, ...pendingMembers.map((m) => m.uid || m.mobile)])
      ]
    }
    try {
      await setData(
        `${DB_NODES.GROUPS}/${id}`,
        payload,
        'Group created — invitations sent to selected members'
      )
      resetCreateForm()
      if (emit) emit('groupCreated', payload)
    } catch (err) {
      showError(err)
    }
  }

  function resetCreateForm() {
    groupForm.value = createEmptyGroupForm()
    groupFormRef.value?.clearValidate()
  }

  watch(
    () => props?.preselectedMember,
    (val) => {
      if (val && !groupForm.value.members.includes(val)) {
        groupForm.value.members = [val]
      }
    },
    { immediate: true }
  )

  return {
    groupForm,
    groupFormRef,
    usersOptions,
    createGroup,
    resetCreateForm,
    isSubmitting
  }
}
