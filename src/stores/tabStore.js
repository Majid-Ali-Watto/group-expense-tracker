import { defineStore } from 'pinia'
import { Tabs } from '@/assets'

export const useTabStore = defineStore('tab', {
  state: () => ({
    activeTab: Tabs.GROUPS
  }),
  actions: {
    setActiveTab(tab) {
      this.activeTab = tab
    }
  },
  getters: {
    getActiveTab: (state) => state.activeTab
  }
})
