import { ref, computed } from 'vue'
import { store } from '../stores/store'
import useFireBase from '../api/firebase-apis'
import { showError, showSuccess } from '../utils/showAlerts'
import { maskMobile } from '../utils/maskMobile'

export const GroupsCreate = () => {
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
    if (!groupForm.value.members || groupForm.value.members.length < 2) {
      return showError('At least two members are required to create a group')
    }

    const id = Date.now().toString()
    const payload = {
      id,
      name: groupForm.value.name,
      description: groupForm.value.description || '',
      ownerMobile: userStore.getActiveUser,
      members: (groupForm.value.members || []).map((m) => ({
        mobile: m,
        name: userStore.getUserByMobile(m)?.name || m
      }))
    }
    try {
      await updateData(`groups/${id}`, () => payload, 'Group created')
      userStore.addGroup(payload)
      showSuccess('Group created')
      groupForm.value = { name: '', description: '', members: [] }
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
