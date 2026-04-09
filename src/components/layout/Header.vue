<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <el-header
    class="kharchafy-header flex flex-col shadow-md fixed top-0 left-0 w-full z-50 !bg-green-600 !text-white transition-all duration-300"
  >
    <div class="flex items-center justify-between w-full h-20">
      <div class="flex flex-col items-start gap-0">
        <span
          class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-sm"
        >
          Kharchafy
        </span>
        <span
          class="text-xs sm:text-sm tracking-widest uppercase font-light text-white/90"
        >
          Track · Split · Settle
        </span>
      </div>

      <div class="flex items-center gap-2">
        <nav v-if="isPublicPage" class="hidden lg:flex items-center gap-2 mr-2">
          <button
            v-for="link in publicNavLinks"
            :key="link.to"
            class="public-nav-link"
            :class="{ 'public-nav-link--active': route.path === link.to }"
            @click="navigateTo(link.to)"
          >
            {{ link.label }}
          </button>
        </nav>

        <!-- Notification Bell — shown when logged in -->
        <div v-if="loggedIn" class="relative">
          <el-popover
            v-model:visible="notifVisible"
            placement="bottom-end"
            :width="320"
            trigger="click"
            popper-class="notif-popover-popper"
          >
            <template #reference>
              <button
                class="bell-btn"
                :title="`${notificationCount} pending actions`"
              >
                <BellIcon class="w-5 h-5" />
                <span v-if="notificationCount > 0" class="notif-badge">
                  {{ notificationCount > 99 ? '99+' : notificationCount }}
                </span>
              </button>
            </template>

            <!-- Popover content -->
            <div class="notif-panel">
              <div class="notif-panel-header">
                <span class="font-semibold text-sm">Notifications</span>
                <span
                  v-if="notificationCount > 0"
                  class="text-xs text-amber-600 font-medium"
                >
                  {{ notificationCount }} pending
                </span>
              </div>

              <div v-if="notifications.length === 0" class="notif-empty">
                ✅ No pending actions
              </div>

              <div v-else class="notif-list">
                <!-- Group by category -->
                <template v-for="category in notifCategories" :key="category">
                  <div class="notif-category-label">{{ category }}</div>
                  <div
                    v-for="notif in notifsByCategory[category]"
                    :key="notif.id"
                    class="notif-item"
                    @click="handleNavigate(notif)"
                  >
                    <span class="notif-icon">{{ notif.icon }}</span>
                    <div class="notif-text">
                      <div
                        v-overflow-popup="{ title: 'Notification' }"
                        class="notif-desc"
                      >
                        {{ notif.description }}
                      </div>
                      <div
                        v-overflow-popup="{ title: 'Related Section' }"
                        class="notif-group"
                      >
                        {{ notif.title }}
                      </div>
                    </div>
                    <span class="notif-arrow">›</span>
                  </div>
                </template>
              </div>
            </div>
          </el-popover>
        </div>

        <!-- Desktop buttons - visible on screens >= 768px -->
        <div class="hidden md:flex items-center gap-2">
          <!-- Bug Report — only when logged in -->
          <button
            v-if="loggedIn"
            class="theme-btn"
            @click="showBugReport = true"
            title="Report a Bug"
          >
            <AlertTriangleIcon class="w-5 h-5" />
          </button>

          <!-- Help — always visible -->
          <button
            class="theme-btn"
            @click="isPublicPage ? navigateTo('/help') : (showHelp = true)"
            title="Help"
          >
            <QuestionCircleIcon class="w-5 h-5" />
          </button>

          <button
            v-if="isPublicPage"
            class="guest-link-btn"
            @click="navigateTo('/login')"
          >
            Login
          </button>

          <button
            v-if="isPublicPage"
            class="guest-cta-btn"
            @click="navigateTo('/register')"
          >
            Create Account
          </button>

          <!-- Share current URL — always visible -->
          <button
            class="theme-btn"
            @click="shareCurrentUrl"
            title="Share current page"
          >
            <ShareIcon class="w-5 h-5" />
          </button>

          <!-- Theme toggle — always visible -->
          <button
            class="theme-btn"
            @click="toggleTheme"
            :title="
              isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            "
          >
            <!-- Moon: shown in light mode -->
            <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
            <!-- Sun: shown in dark mode -->
            <SunIcon v-else class="w-5 h-5" />
          </button>

          <!-- Expenses Summary — only when logged in -->
          <el-button
            v-if="loggedIn"
            type="success"
            plain
            size="small"
            :icon="DataAnalysis"
            class="net-position-btn"
            @click="handleNetPosition"
          >
            Expenses Summary
          </el-button>

          <!-- Logout — only when logged in -->
          <el-button
            v-if="loggedIn"
            type="primary"
            plain
            size="small"
            :icon="SwitchButton"
            class="logout-btn"
            @click="confirmLogout"
          >
            Logout
          </el-button>
        </div>

        <!-- Mobile hamburger menu - visible on screens < 768px -->
        <el-dropdown trigger="click" class="md:hidden mobile-menu-dropdown">
          <button class="hamburger-btn">
            <MenuIcon class="w-6 h-6" />
          </button>
          <template #dropdown>
            <el-dropdown-menu class="mobile-dropdown-menu">
              <!-- Navigation tabs — only when logged in and tabs exist -->
              <template v-if="loggedIn && tabs.length">
                <div class="mobile-menu-section-label">Navigation</div>
                <el-dropdown-item
                  v-for="tab in tabs"
                  :key="tab"
                  @click="$emit('tab-change', tab)"
                >
                  <div
                    class="flex items-center gap-3"
                    :class="{ 'is-active-tab': tab === activeTab }"
                  >
                    <ChevronRightIcon class="w-5 h-5 menu-icon" />
                    <span>{{ tab }}</span>
                  </div>
                </el-dropdown-item>
                <div class="mobile-menu-divider" />
              </template>

              <template v-if="isPublicPage">
                <div class="mobile-menu-section-label">Explore</div>
                <el-dropdown-item
                  v-for="link in publicNavLinks"
                  :key="link.to"
                  @click="navigateTo(link.to)"
                >
                  <div
                    class="flex items-center gap-3"
                    :class="{ 'is-active-tab': route.path === link.to }"
                  >
                    <ChevronRightIcon class="w-5 h-5 menu-icon" />
                    <span>{{ link.label }}</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/login')">
                  <div class="flex items-center gap-3">
                    <ChevronRightIcon class="w-5 h-5 menu-icon" />
                    <span>Login</span>
                  </div>
                </el-dropdown-item>
                <el-dropdown-item @click="navigateTo('/register')">
                  <div class="flex items-center gap-3">
                    <ChevronRightIcon class="w-5 h-5 menu-icon" />
                    <span>Create Account</span>
                  </div>
                </el-dropdown-item>
                <div class="mobile-menu-divider" />
              </template>

              <!-- Help — always visible -->
              <el-dropdown-item v-if="!isPublicPage" @click="showHelp = true">
                <div class="flex items-center gap-3">
                  <QuestionCircleIcon class="w-5 h-5 menu-icon" />
                  <span>Help</span>
                </div>
              </el-dropdown-item>

              <!-- Bug Report — only when logged in -->
              <el-dropdown-item v-if="loggedIn" @click="showBugReport = true">
                <div class="flex items-center gap-3">
                  <AlertTriangleIcon class="w-5 h-5 menu-icon" />
                  <span>Report a Bug</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item @click="shareCurrentUrl">
                <div class="flex items-center gap-3">
                  <ShareIcon class="w-5 h-5 menu-icon" />
                  <span>Share This Page</span>
                </div>
              </el-dropdown-item>
              <!-- Expenses Summary - only when logged in -->
              <el-dropdown-item
                v-if="loggedIn"
                @click="handleNetPosition"
                divided
              >
                <div class="flex items-center gap-3">
                  <el-icon class="menu-icon" :size="20"
                    ><DataAnalysis
                  /></el-icon>
                  <span>Expenses Summary</span>
                </div>
              </el-dropdown-item>
              <!-- Theme Toggle -->
              <el-dropdown-item @click="toggleTheme" divided>
                <div class="flex items-center gap-3">
                  <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
                  <SunIcon v-else class="w-5 h-5" />
                  <span>{{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}</span>
                </div>
              </el-dropdown-item>

              <!-- Logout - only when logged in -->
              <el-dropdown-item v-if="loggedIn" @click="confirmLogout">
                <div class="flex items-center gap-3">
                  <el-icon class="menu-icon" :size="20"
                    ><SwitchButton
                  /></el-icon>
                  <span>Logout</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </el-header>

  <!-- Help Dialog — rendered outside el-header so it can overlay correctly -->
  <HelpDialog
    v-model="showHelp"
    :loggedIn="loggedIn"
    :isDarkTheme="isDarkTheme"
    :toggleTheme="toggleTheme"
    @logout="confirmLogout"
  />

  <!-- Bug Report Dialog -->
  <el-dialog
    v-model="showBugReport"
    title="Report a Bug"
    :width="'min(95vw, 740px)'"
    append-to-body
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    class="bug-report-dialog"
  >
    <BugReportPage
      v-if="showBugReport"
      :view="bugReportView"
      :open-bug-id="bugReportOpenId"
    />
  </el-dialog>
</template>

<script setup>
import { SwitchButton, DataAnalysis } from '@element-plus/icons-vue'
import {
  AlertTriangleIcon,
  BellIcon,
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  QuestionCircleIcon,
  ShareIcon,
  SunIcon
} from '@/components/icons'
import { Header } from '@/scripts/layout'
import { loadAsyncComponent } from '@/utils/async-component'

defineOptions({ inheritAttrs: false })
const HelpDialog = loadAsyncComponent(
  () => import('../generic-components/HelpDialog.vue')
)
const BugReportPage = loadAsyncComponent(
  () => import('../bug-report/BugReport.vue')
)

const props = defineProps({
  loggedIn: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' },
  isDarkTheme: { type: Boolean, default: false },
  toggleTheme: { type: Function, default: () => {} },
  notifications: { type: Array, default: () => [] },
  notificationCount: { type: Number, default: 0 },
  dismissNotification: { type: Function, default: () => {} }
})

const emit = defineEmits([
  'click-log',
  'show-net-position',
  'navigate-to-tab',
  'tab-change'
])

const {
  route,
  notifVisible,
  showHelp,
  showBugReport,
  bugReportView,
  bugReportOpenId,
  isPublicPage,
  publicNavLinks,
  confirmLogout,
  handleNetPosition,
  navigateTo,
  shareCurrentUrl,
  handleNavigate,
  notifsByCategory,
  notifCategories
} = Header(props, emit)
</script>

<style scoped>
.kharchafy-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 80px;
}

/* Navigation section label in hamburger menu */
.mobile-menu-section-label {
  padding: 8px 20px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9ca3af;
}

.mobile-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 12px 4px;
}

:deep(.is-active-tab) {
  color: var(--el-color-primary);
  font-weight: 600;
}

:deep(.is-active-tab svg.menu-icon) {
  stroke: var(--el-color-primary);
}

/* Style the parent li when inner div is active */
:deep(.el-dropdown-menu__item:has(.is-active-tab)) {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 17px;
}

:root.dark-theme .mobile-menu-section-label {
  color: #6b7280;
}

:root.dark-theme .mobile-menu-divider {
  background: #4b5563;
}

:root.dark-theme :deep(.is-active-tab) {
  color: #93c5fd;
}

:root.dark-theme :deep(.is-active-tab svg.menu-icon) {
  stroke: #93c5fd;
}

:root.dark-theme :deep(.el-dropdown-menu__item:has(.is-active-tab)) {
  background-color: #1e3a5f;
  border-left-color: #93c5fd;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.hamburger-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.8);
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #ffffff;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.public-nav-link,
.guest-link-btn,
.guest-cta-btn {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: transparent;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.public-nav-link--active,
.guest-cta-btn {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.72);
}

.public-nav-link:hover,
.guest-link-btn:hover,
.guest-cta-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.theme-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.logout-btn,
.net-position-btn {
  border-color: #ffffff !important;
  color: #ffffff !important;
}

.logout-btn:hover,
.net-position-btn:hover {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: #ffffff !important;
  color: #ffffff !important;
}

/* Mobile dropdown menu styling */
:deep(.mobile-dropdown-menu) {
  min-width: 200px;
  padding: 8px 0;
}

:deep(.mobile-dropdown-menu .el-dropdown-menu__item) {
  padding: 12px 20px;
  font-size: 15px;
}

.menu-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

:deep(.mobile-dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

:deep(
  .mobile-dropdown-menu
    .el-dropdown-menu__item:not(.is-disabled):hover
    .menu-icon
) {
  color: var(--el-color-primary);
}

/* Dark theme support for mobile dropdown */
:root.dark-theme :deep(.mobile-dropdown-menu) {
  background-color: #374151;
  border-color: #4b5563;
}

:root.dark-theme :deep(.mobile-dropdown-menu .el-dropdown-menu__item) {
  color: #e5e7eb !important;
}

:root.dark-theme :deep(.mobile-dropdown-menu .el-dropdown-menu__item span) {
  color: #e5e7eb !important;
}

:root.dark-theme :deep(.mobile-dropdown-menu .el-dropdown-menu__item svg) {
  stroke: #e5e7eb;
}

:root.dark-theme :deep(.mobile-dropdown-menu .el-dropdown-menu__item .el-icon) {
  color: #e5e7eb !important;
}

:root.dark-theme
  :deep(.mobile-dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover) {
  background-color: #4b5563;
  color: #93c5fd;
}

:root.dark-theme
  :deep(
    .mobile-dropdown-menu
      .el-dropdown-menu__item:not(.is-disabled):hover
      .menu-icon
  ) {
  color: #93c5fd;
}

:root.dark-theme
  :deep(.mobile-dropdown-menu .el-dropdown-menu__item.is-divided) {
  border-top-color: #4b5563;
}

/* ── Notification Bell ─────────────────────────────────────── */
.bell-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;
}

.bell-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: 8px;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

/* ── Notification Popover Content ──────────────────────────── */
.notif-panel {
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notif-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px 10px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.notif-empty {
  padding: 24px 0;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-category-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9ca3af;
  padding: 10px 4px 4px;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.notif-item:hover {
  background-color: #f3f4f6;
}

.notif-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

.notif-text {
  flex: 1;
  min-width: 0;
}

.notif-desc {
  font-size: 13px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-group {
  font-size: 11px;
  color: #6b7280;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-arrow {
  font-size: 18px;
  color: #9ca3af;
  flex-shrink: 0;
}

/* ── Dark Theme Support for Notifications ──────────────────── */
:root.dark-theme :deep(.notif-popover-popper) {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

:root.dark-theme :deep(.notif-popover-popper .el-popper__arrow::before) {
  background-color: #1f2937 !important;
  border-color: #374151 !important;
}

:root.dark-theme .notif-panel-header {
  border-bottom-color: #374151;
  color: #e5e7eb;
}

:root.dark-theme .notif-panel-header .text-amber-600 {
  color: #fbbf24 !important;
}

:root.dark-theme .notif-empty {
  color: #9ca3af;
}

:root.dark-theme .notif-category-label {
  color: #6b7280;
}

:root.dark-theme .notif-item:hover {
  background-color: #374151;
}

:root.dark-theme .notif-desc {
  color: #e5e7eb;
}

:root.dark-theme .notif-group {
  color: #9ca3af;
}

:root.dark-theme .notif-arrow {
  color: #6b7280;
}
</style>

<!-- Global (non-scoped) styles for teleported dropdown dark mode -->
<style>
:root.dark-theme .mobile-dropdown-menu {
  background-color: #374151 !important;
  border-color: #4b5563 !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item {
  color: #e5e7eb !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item span {
  color: #e5e7eb !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item svg {
  stroke: #e5e7eb;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item .el-icon {
  color: #e5e7eb !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: #4b5563 !important;
  color: #93c5fd !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover
  svg {
  stroke: #93c5fd;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:not(.is-disabled):hover
  .el-icon {
  color: #93c5fd !important;
}

:root.dark-theme .mobile-dropdown-menu .el-dropdown-menu__item.is-divided {
  border-top-color: #4b5563 !important;
}

:root.dark-theme .mobile-dropdown-menu .is-active-tab {
  color: #93c5fd !important;
  font-weight: 600;
}

:root.dark-theme .mobile-dropdown-menu .is-active-tab svg {
  stroke: #93c5fd !important;
}

:root.dark-theme
  .mobile-dropdown-menu
  .el-dropdown-menu__item:has(.is-active-tab) {
  background-color: #1e3a5f !important;
  border-left-color: #93c5fd !important;
}

/* Support & Bug Report dialog dark theme */
:root.dark-theme .support-dialog .el-dialog,
:root.dark-theme .bug-report-dialog .el-dialog {
  background-color: #1f2937 !important;
}

:root.dark-theme .support-dialog .el-dialog__title,
:root.dark-theme .bug-report-dialog .el-dialog__title {
  color: #f9fafb !important;
}

:root.dark-theme .support-dialog .el-dialog__header,
:root.dark-theme .bug-report-dialog .el-dialog__header {
  border-bottom-color: #374151 !important;
}

:root.dark-theme .support-dialog .el-dialog__headerbtn .el-dialog__close,
:root.dark-theme .bug-report-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #9ca3af !important;
}

/* Make dialog body scrollable on small screens */
.support-dialog .el-dialog__body,
.bug-report-dialog .el-dialog__body {
  max-height: 80vh;
  overflow-y: auto;
}
</style>
