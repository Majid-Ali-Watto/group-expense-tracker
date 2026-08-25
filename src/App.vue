<template>
  <el-config-provider>
    <Analytics />
    <div
      class="flex flex-col min-h-screen"
      :dir="locale === 'ur' ? 'rtl' : 'ltr'"
    >
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
      <div v-if="loggedIn" class="app-tab-header container mx-auto mt-20">
        <!-- style="max-width: 980px" -->
        <WelcomeBanner
          :displayName="displayName"
          :activeTab="activeTab"
          :isAdminActive="isAdminActive"
        />
        <div
          v-if="!isAdminActive"
          :key="tabBarKey"
          class="app-tabs"
          :class="{ 'app-tabs--rtl': locale === 'ur' }"
        >
          <button
            type="button"
            class="app-tabs__arrow"
            :disabled="!canScrollTabsPrev"
            :aria-label="locale === 'ur' ? 'پچھلے ٹیبز' : 'Previous tabs'"
            @click="scrollTabs('prev')"
          >
            <span aria-hidden="true">{{ locale === 'ur' ? '>' : '<' }}</span>
          </button>
          <div
            ref="tabsScroller"
            class="app-tabs__scroller"
            role="tablist"
            @scroll="updateTabsScrollState"
          >
            <button
              v-for="tab in tabs"
              :key="tab"
              type="button"
              role="tab"
              class="app-tabs__item"
              :class="{ 'is-active': tab === activeTab }"
              :aria-selected="tab === activeTab"
              @click="selectTab(tab)"
            >
              {{ tabLabel(tab) }}
            </button>
          </div>
          <button
            type="button"
            class="app-tabs__arrow"
            :disabled="!canScrollTabsNext"
            :aria-label="locale === 'ur' ? 'اگلے ٹیبز' : 'Next tabs'"
            @click="scrollTabs('next')"
          >
            <span aria-hidden="true">{{ locale === 'ur' ? '<' : '>' }}</span>
          </button>
        </div>
      </div>

      <!-- Single RouterView renders everything:
         /login, /register → Login.vue (self-centered)
         /groups etc       → tab content (sits below the tab bar above) -->
      <div class="flex-1" :class="useAppContainer ? 'container mx-auto' : ''">
        <!-- :style="loggedIn ? 'max-width: 980px' : ''" -->
        <div v-if="isBootingPrivateRoute" class="private-route-boot">
          <div
            class="private-route-boot__loader"
            role="status"
            aria-live="polite"
          >
            <span class="private-route-boot__spinner" aria-hidden="true"></span>
            <span>{{
              locale === 'ur' ? 'دوبارہ لوڈ ہو رہا ہے...' : 'Reloading...'
            }}</span>
          </div>
        </div>
        <div v-else class="tab-stage">
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

      <PublicFooter v-if="showPublicFooter" />

      <!-- Expenses Summary Dialog -->
      <NetPositionDialog
        v-if="loggedIn"
        v-model="showNetPositionDialog"
        :summary="netPositionSummary"
      />
    </div>
  </el-config-provider>
</template>

<script setup>
import { provide } from 'vue'
import { Analytics } from '@vercel/analytics/vue'
import { App } from '@/scripts/layout'

const {
  Header,
  WelcomeBanner,
  PublicFooter,
  NetPositionDialog,
  locale,
  loggedIn,
  logout,
  tabs,
  displayName,
  activeTab,
  tabBarKey,
  tabsScroller,
  canScrollTabsPrev,
  canScrollTabsNext,
  tabLabel,
  scrollTabs,
  selectTab,
  updateTabsScrollState,
  tabTransitionName,
  showPublicFooter,
  useAppContainer,
  isBootingPrivateRoute,
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
  dismissNotification,
  isAdminActive
} = App()

// The Settings page (a route, so a descendant of this component's own
// subtree) needs to trigger a full logout for the "Reset app" action.
// logout() closes over sync-listener teardown created inside App() —
// App() itself can only run once (from here), so provide/inject is the
// smallest way to reach it rather than re-extracting it into a singleton
// composable the way useTheme.js already was.
provide('appLogout', logout)
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

.private-route-boot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 112px 10px 32px;
}

.private-route-boot__loader {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text-primary);
  font-weight: 700;
}

.private-route-boot__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(34, 197, 94, 0.22);
  border-top-color: var(--success-700);
  border-radius: 50%;
  animation: private-route-boot-spin 0.8s linear infinite;
}

@keyframes private-route-boot-spin {
  to {
    transform: rotate(360deg);
  }
}

.app-tabs {
  display: flex;
  align-items: stretch;
  gap: 6px;
  margin-top: 0;
  border-bottom: 1px solid var(--border-color);
  background: var(--tab-gradient-start);
  margin-bottom: 12px;
}

.app-tabs--rtl {
  direction: rtl;
}

.app-tabs__scroller {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.app-tabs__scroller::-webkit-scrollbar {
  display: none;
}

.app-tabs__arrow,
.app-tabs__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 40px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1.35;
  white-space: nowrap;
}

.app-tabs__arrow {
  flex: 0 0 32px;
  padding: 0;
  font-size: 1.25rem;
  cursor: pointer;
}

.app-tabs__arrow:disabled {
  display: none;
}

.app-tabs__item {
  flex: 0 0 auto;
  padding: 0 18px;
  cursor: pointer;
}

.app-tabs__item.is-active {
  background-color: var(--tab-active-bg);
  color: var(--success-700);
}

html[lang='ur'] .app-tabs__arrow,
html[lang='ur'] .app-tabs__item {
  line-height: 1.35 !important;
}

@media (max-width: 767px) {
  .app-tab-header {
    margin-bottom: 12px;
  }

  .app-tabs {
    display: none;
  }
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
