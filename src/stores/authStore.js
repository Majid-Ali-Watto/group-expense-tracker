import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    activeUserUid: null,
    sessionToken: null
  }),
  actions: {
    setActiveUserUid(uid) {
      this.activeUserUid = uid
    },
    setSessionToken(token) {
      this.sessionToken = token
    }
  },
  getters: {
    getActiveUserUid: (state) => state.activeUserUid,
    getSessionToken: (state) => state.sessionToken
  }
})
