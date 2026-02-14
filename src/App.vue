<template>
  <Suspense>
    <template #default>
      <div>
        <Header
          @click-log="isLoggedIn"
          :loggedIn="loggedIn"
          :user="tabStore.getActiveUser"
        />
        <div class="container my-auto mx-auto mt-16 p-4" v-if="!loggedIn">
          <Login :isLoggedIn="isLoggedIn" />
        </div>
        <div
          v-if="loggedIn"
          class="container mx-auto mt-16 sm:mt-16 md:16 lg:mt-16"
        >
          <span
            class="text-sm font-medium text-gray-600 flex flex-wrap flex-row items-center gap-2"
          >
            <span>
              <svg
                class="inline-block w-3 h-3 mr-1 text-green-500"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx="4" cy="4" r="3" />
              </svg>
              Welcome,
              <b class="font-medium text-green-800 bg-gray-100 p-1 rounded">{{
                displayName
              }}</b>
            </span>
            <span>
              <svg
                class="inline-block w-3 h-3 mr-1 text-green-500"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx="4" cy="4" r="3" />
              </svg>
              Active Group:
              <b class="font-medium text-green-800 bg-gray-100 p-1 rounded">{{
                activeGroup || "No Group Selected"
              }}</b>
            </span>
          </span>

          <!-- Tabs -->
          <el-tabs
            v-model="activeTab"
            @tab-change="handleActiveTab"
            type="border-card"
            class="mt-2"
          >
            <el-tab-pane
              v-for="(tab, index) in tabs"
              :key="index"
              :label="tab"
              :name="tab"
              lazy
            >
              <keep-alive>
                <HOC :componentToBeRendered="activeTabComponent(tab)" />
              </keep-alive>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </template>
    <template #fallback>
      <div
        class="loading-wrapper"
        v-loading="true"
        element-loading-text-color="red"
        element-loading-text="Loading..."
        :element-loading-spinner="svg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(0, 0, 0, 0)"
        style="width: 100%"
      ></div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent, ref, onMounted, computed } from "vue";
import { store } from "./stores/store"; // Pinia store
import useFireBase from "./api/firebase-apis";
import { tabs } from "./assets/data";
import { svg } from "./assets/loader-svg";
import { getActiveTab } from "./utils/active-tab";
// Lazy-loaded components
const HOC = defineAsyncComponent(() => import("@/components/HOC.vue"));
const Login = defineAsyncComponent(() => import("@/components/Login.vue"));
const Header = defineAsyncComponent(() => import("@/components/Header.vue"));

// State
const loggedIn = ref(false); // Default state
const tabStore = store(); // Pinia store

const { read } = useFireBase();
const displayName = computed(
  () => tabStore.getUserByMobile(tabStore.getActiveUser)?.name || "Guest",
);
const activeGroup = computed(
  () => tabStore.getGroupById(tabStore.getActiveGroup)?.name,
);

onMounted(async () => {
  try {
    const users = await read("users");
    if (users) {
      // users is object keyed by mobile
      const list = Object.keys(users).map((k) => ({
        mobile: k,
        name: users[k].name || "",
      }));
      tabStore.setUsers(list);
    }
    const groups = await read("groups");
    if (groups) {
      const glist = Object.keys(groups).map((k) => ({ id: k, ...groups[k] }));
      tabStore.setGroups(glist);
    }
  } catch (e) {
    // ignore
  }
});

// Current active tab from store
const activeTab = ref(tabStore.getActiveTab || tabs[0]);

// Function to handle login state
function isLoggedIn(logged) {
  loggedIn.value = logged;
}

// Function to handle tab changes
function handleActiveTab(tab) {
  activeTab.value = tab;
  tabStore.setActiveTab(tab); // Update tab in store
}

// Map activeTab to dynamic components
const activeTabComponent = (activeTab) => {
  return getActiveTab(activeTab);
};
</script>

<style>
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background: rgba(30, 32, 28, 0.8); /* Optional for background overlay */
}
.el-loading-text {
  color: white !important;
}
/* .demo-tabs > .el-tabs__content {
		padding: 32px;
		color: #6b778c;
		font-size: 32px;
		font-weight: 600;
	} */
</style>
