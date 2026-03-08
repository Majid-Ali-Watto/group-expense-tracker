import { ref, computed } from 'vue'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { showError } from '../utils/showAlerts'
import { maskMobile } from '../utils/maskMobile'

export const GroupsCreate = (emit) => {
  const userStore = store()
  const { updateData } = useFireBase()

  const groupForm = ref({ name: '', description: '', members: [] })
  const groupFormRef = ref(null)

  const usersOptions = computed(() => userStore.getUsers || [])

  const activeUser = computed(() => userStore.getActiveUser)

  function getUserLabel(u) {
    const displayMob =
      u.mobile === activeUser.value
        ? u.mobile
        : u.maskedMobile || maskMobile(u.mobile)
    return `${u.name} (${displayMob})`
  }

  async function createGroup() {
    groupFormRef.value.validate(async (valid) => {
      if (!valid) return
      await doCreateGroup()
    })
  }

  async function doCreateGroup() {
    const creatorMobile = userStore.getActiveUser

    // Auto-include creator if not already selected
    if (!groupForm.value.members.includes(creatorMobile)) {
      groupForm.value.members = [creatorMobile, ...groupForm.value.members]
    }

    if (groupForm.value.members.length < 2) {
      return showError('At least two members are required to create a group')
    }

    const newName = groupForm.value.name.trim().toLowerCase()
    const allGroups = userStore.getGroups || []

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
      ownerMobile: userStore.getActiveUser,
      // Only the creator joins immediately; all others receive an invitation
      members: [{ mobile: creatorMobile, name: userStore.getUserByMobile(creatorMobile)?.name || creatorMobile }],
      pendingMembers: allSelected
        .filter((m) => m !== creatorMobile)
        .map((m) => ({ mobile: m, name: userStore.getUserByMobile(m)?.name || m }))
    }
    try {
      await updateData(`groups/${id}`, () => payload, 'Group created — invitations sent to selected members')
      userStore.addGroup(payload)
      groupForm.value = { name: '', description: '', members: [] }
      if (emit) emit('groupCreated')
    } catch (err) {
      showError(err)
    }
  }

  return {
    groupForm,
    groupFormRef,
    usersOptions,
    createGroup,
    getUserLabel
  }
}
