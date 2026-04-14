<template>
  <el-dropdown
    trigger="click"
    class="min-[768px]:hidden mobile-menu-dropdown"
  >
    <button class="hamburger-btn">
      <MenuIcon class="w-6 h-6" />
    </button>
    <template #dropdown>
      <el-dropdown-menu class="mobile-dropdown-menu">
        <template v-if="loggedIn && tabs.length">
          <div class="mobile-menu-section-label">Navigation</div>
          <el-dropdown-item
            v-for="tab in tabs"
            :key="tab"
            @click="emit('tab-change', tab)"
          >
            <div
              class="flex items-center gap-3"
              :class="{ 'is-active-tab': tab === activeTab }"
            >
              <el-icon class="menu-icon" :size="20"><component :is="TAB_ICONS[tab] || ChevronRightIcon" /></el-icon>
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
            @click="emit('navigate', link.to)"
          >
            <div
              class="flex items-center gap-3"
              :class="{ 'is-active-tab': routePath === link.to }"
            >
              <el-icon class="menu-icon" :size="20"><component :is="NAV_ICONS[link.to] || ChevronRightIcon" /></el-icon>
              <span>{{ link.label }}</span>
            </div>
          </el-dropdown-item>
          <el-dropdown-item @click="emit('navigate', '/login')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
              <span>Login</span>
            </div>
          </el-dropdown-item>
          <el-dropdown-item @click="emit('navigate', '/register')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><UserFilled /></el-icon>
              <span>Create Account</span>
            </div>
          </el-dropdown-item>
          <div class="mobile-menu-divider" />
        </template>

        <template v-if="isStuckState">
          <div class="mobile-menu-section-label">Account</div>
          <el-dropdown-item @click="emit('navigate', '/login')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
              <span>Sign In</span>
            </div>
          </el-dropdown-item>
          <div class="mobile-menu-divider" />
        </template>

        <div class="mobile-menu-section-label">Actions</div>
        <el-dropdown-item v-if="!isPublicPage" @click="emit('open-help')">
          <div class="flex items-center gap-3">
            <QuestionCircleIcon class="w-5 h-5 menu-icon" />
            <span>Help</span>
          </div>
        </el-dropdown-item>

        <el-dropdown-item
          v-if="canShowBugReport"
          @click="emit('open-bug-report')"
        >
          <div class="flex items-center gap-3">
            <AlertTriangleIcon class="w-5 h-5 menu-icon" />
            <span>Report a Bug</span>
          </div>
        </el-dropdown-item>

        <el-dropdown-item @click="emit('share')">
          <div class="flex items-center gap-3">
            <ShareIcon class="w-5 h-5 menu-icon" />
            <span>Share This Page</span>
          </div>
        </el-dropdown-item>
        <div class="mobile-menu-divider" />

        <template v-if="loggedIn || canShowManageTabs">
          <div class="mobile-menu-section-label">Workspace</div>
          <el-dropdown-item v-if="loggedIn" @click="emit('show-net-position')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><DataAnalysis /></el-icon>
              <span>Expenses Summary</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item
            v-if="canShowManageTabs"
            @click="emit('open-manage-tabs')"
          >
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><Setting /></el-icon>
              <span>Manage Tabs</span>
            </div>
          </el-dropdown-item>

          <el-dropdown-item v-if="loggedIn" @click="emit('change-password')">
            <div class="flex items-center gap-3">
              <el-icon class="menu-icon" :size="20"><Key /></el-icon>
              <span>Change Password</span>
            </div>
          </el-dropdown-item>
          <div class="mobile-menu-divider" />
        </template>

        <div class="mobile-menu-section-label">Preferences</div>
        <el-dropdown-item @click="emit('toggle-theme')">
          <div class="flex items-center gap-3">
            <MoonIcon v-if="!isDarkTheme" class="w-5 h-5" />
            <SunIcon v-else class="w-5 h-5" />
            <span>{{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}</span>
          </div>
        </el-dropdown-item>

        <el-dropdown-item v-if="loggedIn" @click="emit('logout')">
          <div class="flex items-center gap-3">
            <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
            <span>Logout</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { DataAnalysis, Key, Setting, SwitchButton, Money, CreditCard, Wallet, Coin, UserFilled, Star, ChatDotRound } from '@element-plus/icons-vue'
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  MenuIcon,
  MoonIcon,
  QuestionCircleIcon,
  ShareIcon,
  SunIcon,
  UsersIcon
} from '@/components/icons'

// Tab name → icon component
const TAB_ICONS = {
  'Shared Expenses': Money,
  'Shared Loans': CreditCard,
  'Personal Expenses': Wallet,
  'Personal Loans': Coin,
  'Users': UsersIcon,
  'Groups': UserFilled,
  'Bug Reports': AlertTriangleIcon
}

// Public nav path → icon component
const NAV_ICONS = {
  '/features': Star,
  '/group-expense-tracker': UserFilled,
  '/personal-budget-tracker': Wallet,
  '/help': QuestionCircleIcon,
  '/faq': ChatDotRound
}

defineProps({
  loggedIn: { type: Boolean, default: false },
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' },
  isPublicPage: { type: Boolean, default: false },
  publicNavLinks: { type: Array, default: () => [] },
  routePath: { type: String, default: '' },
  isStuckState: { type: Boolean, default: false },
  canShowBugReport: { type: Boolean, default: false },
  canShowManageTabs: { type: Boolean, default: false },
  isDarkTheme: { type: Boolean, default: false }
})

const emit = defineEmits([
  'tab-change',
  'navigate',
  'open-help',
  'open-bug-report',
  'share',
  'show-net-position',
  'open-manage-tabs',
  'change-password',
  'toggle-theme',
  'logout'
])
</script>

<style scoped>
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
</style>

<style>
.mobile-dropdown-menu {
  min-width: 200px;
  padding: 8px 0;
}

.mobile-dropdown-menu .el-dropdown-menu__item {
  padding: 5px 16px;
}

.mobile-menu-section-label {
  padding: 6px 16px 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #9ca3af;
}

.mobile-menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 2px 10px;
}

.menu-icon {
  font-size: 20px;
  width: 20px;
  height: 20px;
}

.mobile-dropdown-menu .is-active-tab {
  color: var(--el-color-primary);
  font-weight: 600;
}

.mobile-dropdown-menu .is-active-tab svg.menu-icon {
  stroke: var(--el-color-primary);
}

.mobile-dropdown-menu .el-dropdown-menu__item:has(.is-active-tab) {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
  padding-left: 17px;
}

.mobile-dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.mobile-dropdown-menu .el-dropdown-menu__item:not(.is-disabled):hover .menu-icon {
  color: var(--el-color-primary);
}

:root.dark-theme .mobile-menu-section-label {
  color: #6b7280;
}

:root.dark-theme .mobile-menu-divider {
  background: #4b5563;
}

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
</style>
