<template>
  <Suspense>
    <template #default>
      <div>
        <Header
          @click-log="setLoggedInStatus"
          @show-net-position="handleShowNetPosition"
          @navigate-to-tab="({ tab, groupId }) => navigateToTab(tab, groupId)"
          :loggedIn="loggedIn"
          :user="tabStore.getActiveUser"
          :isDarkTheme="isDarkTheme"
          :toggleTheme="toggleTheme"
          :notifications="allNotifications"
          :notificationCount="notificationCount"
        />
        <div
          v-if="!loggedIn"
          class="container min-h-screen flex items-center justify-center mx-auto px-4 pt-24 pb-12"
        >
          <div>
            <Login />
          </div>
        </div>
        <div v-if="loggedIn" class="container mx-auto mt-20">
          <!-- Welcome Banner -->
          <WelcomeBanner :displayName="displayName" />

          <!-- Tabs -->
          <el-tabs
            v-model="activeTab"
            @tab-change="handleActiveTab"
            class="demo-tabs"
            type="card"
            tab-position="top"
          >
            <el-tab-pane
              v-for="(tab, index) in tabs"
              :key="index"
              :label="tab"
              :name="tab"
              lazy
              class="py-2 px-3 sm:px-0"
            >
              <keep-alive>
                <HOC :componentToBeRendered="activeTabComponent(tab)" />
              </keep-alive>
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- Expenses Summary Dialog -->
        <NetPositionDialog
          v-model="showNetPositionDialog"
          :summary="netPositionSummary"
        />
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
import { ref, computed, watch, nextTick } from 'vue'
import { svg } from './assets/loader-svg'
import WelcomeBanner from './components/generic-components/WelcomeBanner.vue'
import NetPositionDialog from './components/generic-components/NetPositionDialog.vue'
import { App } from './scripts/app'
import { useGlobalNotifications } from './utils/useGlobalNotifications'

const {
  HOC,
  Login,
  Header,
  loggedIn,
  tabStore,
  tabs,
  displayName,
  activeTab,
  setLoggedInStatus,
  handleActiveTab,
  activeTabComponent,
  isDarkTheme,
  toggleTheme,
  showNetPositionDialog,
  netPositionSummary,
  handleShowNetPosition,
  navigateToTab
} = App()

// Initialize notification system only after successful login
const allNotifications = ref([])
const notificationCount = computed(() => allNotifications.value.length)
let notificationCleanup = null

// Watch for login state changes
watch(
  loggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      // User logged in - initialize notifications in next tick to avoid blocking UI
      nextTick(() => {
        const { allNotifications: notifs, cleanup } = useGlobalNotifications()
        
        // Update refs reactively
        watch(
          notifs,
          (newNotifs) => {
            allNotifications.value = newNotifs
          },
          { immediate: true }
        )
        
        // Store cleanup function
        notificationCleanup = cleanup
      })
    } else {
      // User logged out - cleanup notifications
      if (notificationCleanup) {
        notificationCleanup()
        notificationCleanup = null
      }
      allNotifications.value = []
    }
  },
  { immediate: true }
)
</script>
