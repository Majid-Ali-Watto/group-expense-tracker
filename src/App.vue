<template>
  <Suspense>
    <template #default>
      <div>
        <Header
          @click-log="setLoggedInStatus"
          :loggedIn="loggedIn"
          :user="tabStore.getActiveUser"
          :isDarkTheme="isDarkTheme"
          :toggleTheme="toggleTheme"
        />
        <div
          v-if="!loggedIn"
          class="container min-h-screen flex items-center justify-center mx-auto px-4 pt-24 pb-12"
        >
          <div>
            <Login />
          </div>
        </div>
        <div
          v-if="loggedIn"
          class="container mx-auto mt-20"
        >
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
import WelcomeBanner from './components/generic-components/WelcomeBanner.vue'
import { App } from './scripts/app'

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
  toggleTheme
} = App()
</script>
