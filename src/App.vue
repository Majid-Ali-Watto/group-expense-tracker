<template>
  <Suspense>
    <template #default>
      <div>
        <Header
          @click-log="setLoggedInStatus"
          @show-net-position="handleShowNetPosition"
          @navigate-to-tab="({ tab, groupId }) => navigateToTab(tab, groupId)"
          @tab-change="handleActiveTab"
          :loggedIn="loggedIn"
          :tabs="tabs"
          :activeTab="activeTab"
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
import { svg } from './assets/loader-svg'
import { App } from './scripts/layout/app'
import { defineAsyncComponent } from 'vue'
const HOC = defineAsyncComponent(() => import('@/components/layout/HOC.vue'))
const Login = defineAsyncComponent(() => import('@/components/auth/Login.vue'))
const Header = defineAsyncComponent(
  () => import('@/components/layout/Header.vue')
)
const WelcomeBanner = defineAsyncComponent(
  () => import('@/components/generic-components/WelcomeBanner.vue')
)
const NetPositionDialog = defineAsyncComponent(
  () => import('@/components/generic-components/NetPositionDialog.vue')
)

const {
  loggedIn,
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
  navigateToTab,
  allNotifications,
  notificationCount
} = App()
</script>
