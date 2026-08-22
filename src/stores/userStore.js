import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    activeUserTabConfig: null,
    activeUserTabConfigLoaded: false,
    activeUserCanManageTabs: true,
    // isAdmin/billedUser/bugResolver for the signed-in user, loaded from the
    // owner/admin-only user-admin-flags/{uid} doc — see src/helpers/user-admin-flags.js
    // and firestore.rules. Never populated for any uid but the active user's own.
    activeUserAdminFlags: null,
    activeUserAdminFlagsLoaded: false,
    // email for the signed-in user, loaded from the owner/admin-only
    // user-private/{uid} doc — same reasoning as activeUserAdminFlags above.
    // Never populated for any uid but the active user's own.
    activeUserPrivate: null,
    activeUserPrivateLoaded: false
  }),
  actions: {
    addUser(user) {
      const exists = this.users.find((u) => u.uid === user.uid)
      if (!exists) this.users.push(user)
      else Object.assign(exists, user)
    },
    setUsers(users) {
      this.users = users || []
    },
    setActiveUserTabAccess({ config = null, accessManageTabs = true } = {}) {
      this.activeUserTabConfig = config
      this.activeUserTabConfigLoaded = true
      this.activeUserCanManageTabs = accessManageTabs !== false
    },
    clearActiveUserTabAccess() {
      this.activeUserTabConfig = null
      this.activeUserTabConfigLoaded = false
      this.activeUserCanManageTabs = true
    },
    setActiveUserAdminFlags(flags = null) {
      this.activeUserAdminFlags = flags
      this.activeUserAdminFlagsLoaded = true
    },
    clearActiveUserAdminFlags() {
      this.activeUserAdminFlags = null
      this.activeUserAdminFlagsLoaded = false
    },
    setActiveUserPrivate(privateFields = null) {
      this.activeUserPrivate = privateFields
      this.activeUserPrivateLoaded = true
    },
    clearActiveUserPrivate() {
      this.activeUserPrivate = null
      this.activeUserPrivateLoaded = false
    }
  },
  getters: {
    getUsers: (state) => state.users,
    getActiveUserTabConfig: (state) => state.activeUserTabConfig,
    isActiveUserTabConfigLoaded: (state) => state.activeUserTabConfigLoaded,
    canActiveUserManageTabs: (state) => state.activeUserCanManageTabs,
    getActiveUserAdminFlags: (state) => state.activeUserAdminFlags,
    isActiveUserAdminFlagsLoaded: (state) => state.activeUserAdminFlagsLoaded,
    getActiveUserPrivate: (state) => state.activeUserPrivate,
    isActiveUserPrivateLoaded: (state) => state.activeUserPrivateLoaded,
    getUserByUid: (state) => (uid) =>
      state.users.find((u) => u.uid === uid) || null,
    getUserByMobile: (state) => (value) =>
      state.users.find((u) => u.mobile === value) || null
  }
})
