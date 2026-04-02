<template>
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
      :dismissNotification="dismissNotification"
    />

    <!-- Tab navigation bar — only shown when authenticated -->
    <div
      v-if="loggedIn"
      class="container mx-auto mt-20"
      style="max-width: 980px"
    >
      <WelcomeBanner :displayName="displayName" />
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
    </div>

    <!-- Single RouterView renders everything:
         /login, /register → Login.vue (self-centered)
         /groups etc       → tab content (sits below the tab bar above) -->
    <div
      :class="loggedIn ? 'container mx-auto' : ''"
      :style="loggedIn ? 'max-width: 980px' : ''"
    >
      <div class="tab-stage">
        <RouterView v-slot="{ Component }">
          <Transition :name="tabTransitionName" mode="out-in">
            <component
              :is="Component"
              :key="$route.path"
              class="tab-stage__panel max-[980px]:px-2 mb-4"
            />
          </Transition>
        </RouterView>
      </div>
    </div>

    <!-- Expenses Summary Dialog -->
    <NetPositionDialog
      v-model="showNetPositionDialog"
      :summary="netPositionSummary"
    />
  </div>
</template>

<script setup>
import { App } from '@/scripts/layout'
import { loadAsyncComponent } from '@/utils'
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
  isDarkTheme,
  toggleTheme,
  showNetPositionDialog,
  netPositionSummary,
  handleShowNetPosition,
  navigateToTab,
  allNotifications,
  notificationCount,
  dismissNotification
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
