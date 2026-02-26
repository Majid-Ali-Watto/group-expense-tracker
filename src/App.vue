<template>
  <Suspense>
    <template #default>
      <div>
        <!-- Floating Theme Toggle Button -->
        <FloatingThemeButton
          :isDarkTheme="isDarkTheme"
          :toggleTheme="toggleTheme"
        />
        <Header
          @click-log="setLoggedInStatus"
          :loggedIn="loggedIn"
          :user="tabStore.getActiveUser"
        />
        <div class="container my-auto mx-auto mt-16 p-4" v-if="!loggedIn">
          <Login />
        </div>
        <div
          v-if="loggedIn"
          class="container mx-auto mt-16 sm:mt-16 md:16 lg:mt-16"
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
              class="py-2 px-3"
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
import FloatingThemeButton from './components/generic-components/FloatingThemeButton.vue'
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
