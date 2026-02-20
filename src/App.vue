<template>
  <Suspense>
    <template #default>
      <div>
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
          <div class="mb-4 px-2">
            <div
              class="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm border border-green-100 p-4 sm:p-5"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <!-- User Info -->
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <div
                      class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md"
                    >
                      <svg
                        class="w-5 h-5 sm:w-6 sm:h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5"
                    >
                      Welcome back
                    </p>
                    <p
                      class="text-base sm:text-lg font-bold text-gray-800 truncate"
                    >
                      {{ displayName }}
                    </p>
                  </div>
                </div>

                <!-- Group Info -->
                <div class="flex items-center gap-3 sm:ml-4">
                  <div class="flex-shrink-0">
                    <div
                      class="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md"
                      :class="
                        activeGroup
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                          : 'bg-gray-300'
                      "
                    >
                      <svg
                        class="w-5 h-5 sm:w-6 sm:h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5"
                    >
                      Active Group
                    </p>
                    <p
                      class="text-base sm:text-lg font-bold truncate"
                      :class="activeGroup ? 'text-gray-800' : 'text-gray-400'"
                    >
                      {{ activeGroup || 'No Group Selected' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <el-tabs
            v-model="activeTab"
            @tab-change="handleActiveTab"
            class="mt-2"
            type="border-card"
            tab-position="top"
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
import { svg } from './assets/loader-svg'
import { App } from './scripts/app'

const {
  HOC,
  Login,
  Header,
  loggedIn,
  tabStore,
  tabs,
  displayName,
  activeGroup,
  activeTab,
  setLoggedInStatus,
  handleActiveTab,
  activeTabComponent
} = App()
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
</style>
