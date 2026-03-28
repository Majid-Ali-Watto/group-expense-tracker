import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useGroupStore } from '../../stores/groupStore'
import { useUserStore } from '../../stores/userStore'
import useFireBase from '../../api/firebase-apis'
import { showError } from '../../utils/showAlerts'
import { DB_NODES } from '../../constants/db-nodes'
import { formatUserDisplay } from '../../utils/user-display'

export const GroupsCreate = (emit, props) => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const { updateData, isSubmitting } = useFireBase()

  const groupForm = ref({
    name: '',
    description: '',
    members: [],
    category: ''
  })
  const groupFormRef = ref(null)

  const usersOptions = computed(() =>
    (userStore.getUsers || []).map((user) => ({
      label: getUserLabel(user),
      value: user.mobile
    }))
  )

  const activeUser = computed(() => authStore.getActiveUser)

  function getUserLabel(u) {
    return formatUserDisplay(storeProxy, u.mobile, {
      name: u.name,
      preferMasked: u.mobile !== activeUser.value
    })
  }

  async function createGroup() {
    groupFormRef.value.validate(async (valid) => {
      if (!valid) return
      await doCreateGroup()
    })
  }

  async function doCreateGroup() {
    const creatorMobile = authStore.getActiveUser

    // Auto-include creator if not already selected
    if (!groupForm.value.members.includes(creatorMobile)) {
      groupForm.value.members = [creatorMobile, ...groupForm.value.members]
    }

    if (groupForm.value.members.length < 2) {
      return showError('At least two members are required to create a group')
    }

    const newName = groupForm.value.name.trim().toLowerCase()
    const allGroups = groupStore.getGroups || []

    // Rule 1: owner can never create two groups with the same name
    const ownerDuplicate = allGroups.some(
      (g) =>
        g.ownerMobile === creatorMobile &&
        g.name.trim().toLowerCase() === newName
    )
    if (ownerDuplicate) {
      return showError('You already have a group with this name')
    }

    // Rule 2: none of the other members (excluding creator) can already be
    // in an existing group with the same name
    const otherMembers = (groupForm.value.members || []).filter(
      (m) => m !== creatorMobile
    )
    const sameNameGroups = allGroups.filter(
      (g) => g.name.trim().toLowerCase() === newName
    )
    const memberConflict = sameNameGroups.some((g) => {
      const existingMobiles = [
        ...(g.members || []),
        ...(g.pendingMembers || [])
      ].map((m) => m.mobile)
      return otherMembers.some((m) => existingMobiles.includes(m))
    })
    if (memberConflict) {
      return showError(
        'One or more members are already in a group with this name'
      )
    }

    const id = Date.now().toString()
    const allSelected = groupForm.value.members || []
    const payload = {
      id,
      name: groupForm.value.name,
      description: groupForm.value.description || '',
      category: groupForm.value.category || '',
      ownerMobile: authStore.getActiveUser,
      // Only the creator joins immediately; all others receive an invitation
      members: [
        {
          mobile: creatorMobile
        }
      ],
      pendingMembers: allSelected
        .filter((m) => m !== creatorMobile)
        .map((m) => ({
          mobile: m
        }))
    }
    try {
      await updateData(
        `${DB_NODES.GROUPS}/${id}`,
        () => payload,
        'Group created — invitations sent to selected members'
      )
      groupStore.addGroup(payload)
      groupForm.value = { name: '', description: '', members: [], category: '' }
      if (emit) emit('groupCreated')
    } catch (err) {
      showError(err)
    }
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
    isSubmitting
  }
}
