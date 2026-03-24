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
              class="py-2 px-3 sm:px-0"
            />
          </el-tabs>

          <div class="tab-stage">
            <Transition :name="tabTransitionName" mode="out-in">
              <div :key="activeTab" class="tab-stage__panel">
                <keep-alive>
                  <HOC
                    :key="activeTab"
                    :componentToBeRendered="activeTabComponent(activeTab)"
                  />
                </keep-alive>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Expenses Summary Dialog -->
        <NetPositionDialog
          v-model="showNetPositionDialog"
          :summary="netPositionSummary"
        />
      </div>
    </template>
    <template #fallback>
      <LoadingSkeleton mode="page" />
    </template>
  </Suspense>
</template>

<script setup>
import { App } from './scripts/layout/app'
import LoadingSkeleton from './components/shared/LoadingSkeleton.vue'
import { loadAsyncComponent } from './utils/async-component'
const HOC = loadAsyncComponent(() => import('@/components/layout/HOC.vue'))
const Login = loadAsyncComponent(() => import('@/components/auth/Login.vue'))
const Header = loadAsyncComponent(
  () => import('@/components/layout/Header.vue')
)
const WelcomeBanner = loadAsyncComponent(
  () => import('@/components/generic-components/WelcomeBanner.vue')
)
const NetPositionDialog = loadAsyncComponent(
  () => import('@/components/generic-components/NetPositionDialog.vue')
)

const {
  loggedIn,
  tabs,
  displayName,
  activeTab,
  tabTransitionName,
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

<style scoped>
.tab-stage {
  position: relative;
  perspective: 1800px;
  transform-style: preserve-3d;
}

.tab-stage__panel {
  width: 100%;
  transform-origin: center center;
  backface-visibility: hidden;
  will-change: transform, opacity, filter;
}

.tab-page-forward-enter-active,
.tab-page-forward-leave-active,
.tab-page-backward-enter-active,
.tab-page-backward-leave-active {
  transition:
    transform 0.48s var(--motion-swift),
    opacity 0.34s var(--motion-smooth),
    filter 0.34s var(--motion-smooth);
}

.tab-page-forward-enter-from {
  opacity: 0;
  filter: blur(1px);
  transform: rotateY(-78deg) translateX(34px) scale(0.98);
  transform-origin: right center;
}

.tab-page-forward-leave-to {
  opacity: 0;
  filter: blur(1px);
  transform: rotateY(72deg) translateX(-28px) scale(0.985);
  transform-origin: left center;
}

.tab-page-backward-enter-from {
  opacity: 0;
  filter: blur(1px);
  transform: rotateY(78deg) translateX(-34px) scale(0.98);
  transform-origin: left center;
}

.tab-page-backward-leave-to {
  opacity: 0;
  filter: blur(1px);
  transform: rotateY(-72deg) translateX(28px) scale(0.985);
  transform-origin: right center;
}

@media (prefers-reduced-motion: reduce) {
  .tab-page-forward-enter-active,
  .tab-page-forward-leave-active,
  .tab-page-backward-enter-active,
  .tab-page-backward-leave-active {
    transition-duration: 0.01ms !important;
  }
}
</style>
