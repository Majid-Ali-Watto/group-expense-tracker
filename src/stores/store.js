// stores/useTabStore.js
import { defineStore } from "pinia";
import getCurrentMonth from "../utils/getCurrentMonth";
import { Tabs } from "../assets/enums";

export const store = defineStore("tab", {
  state: () => ({
    activeTab: Tabs.GROUPS, // Default active tab
    activeUser: null,
    groups: [],
    activeGroup: null,
    users: [],
    expenseRef: null,
    loansRef: null,
    salaryRef: null,
    selectedMonth: getCurrentMonth(),
  }),
  actions: {
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    setActiveUser(user) {
      this.activeUser = user;
    },
    addUser(user) {
      // user: { name, mobile }
      const exists = this.users.find((u) => u.mobile === user.mobile);
      if (!exists) this.users.push(user);
      else Object.assign(exists, user);
    },
    addGroup(group) {
      // group: { id, name, ownerMobile, members: [{name,mobile}], inviteCode }
      const exists = this.groups.find((g) => g.id === group.id);
      if (!exists) this.groups.push(group);
      else Object.assign(exists, group);
    },
    setGroups(groups) {
      this.groups = groups || [];
    },
    setActiveGroup(groupId) {
      this.activeGroup = groupId;
    },
    setUsers(users) {
      this.users = users || [];
    },
    setExpenseRef(state) {
      this.expenseRef = state;
    },
    setLoansRef(state) {
      this.loansRef = state;
    },
    setSalaryRef(state) {
      this.salaryRef = state;
    },
    setCurrentMonth(month) {
      this.selectedMonth = month;
    },
    removeGroup(id) {
      this.groups = this.groups.filter((g) => g.id !== id);
    },
    updateGroup(updated) {
      const index = this.groups.findIndex((g) => g.id === updated.id);
      if (index !== -1) {
        this.groups[index] = updated;
      }
    },
  },
  getters: {
    getActiveTab: (state) => state.activeTab,
    getActiveUser: (state) => state.activeUser,
    getUsers: (state) => state.users,
    getUserByMobile: (state) => (mobile) =>
      state.users.find((u) => u.mobile === mobile) || null,
    getGroups: (state) => state.groups,
    getActiveGroup: (state) => state.activeGroup,
    getGroupById: (state) => (id) =>
      state.groups.find((g) => g.id === id) || null,
    getExpenseRef: (state) => state.expenseRef,
    getLoansRef: (state) => state.loansRef,
    getSalaryRef: (state) => state.salaryRef,
    getSelectedMonth: (state) => state.selectedMonth,
  },
});
