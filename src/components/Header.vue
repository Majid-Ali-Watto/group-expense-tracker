<template>
  <el-header
    class="kharchafy-header flex items-center justify-between shadow-md fixed top-0 left-0 w-full z-50 !bg-green-600 !text-white transition-all duration-300"
  >
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
            <button class="bell-btn" :title="`${notificationCount} pending actions`">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span v-if="notificationCount > 0" class="notif-badge">
                {{ notificationCount > 99 ? '99+' : notificationCount }}
              </span>
            </button>
          </template>

          <!-- Popover content -->
          <div class="notif-panel">
            <div class="notif-panel-header">
              <span class="font-semibold text-sm">Notifications</span>
              <span v-if="notificationCount > 0" class="text-xs text-amber-600 font-medium">
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
                    <div class="notif-desc">{{ notif.description }}</div>
                    <div class="notif-group">{{ notif.title }}</div>
                  </div>
                  <span class="notif-arrow">›</span>
                </div>
              </template>
            </div>
          </div>
        </el-popover>
      </div>

      <!-- Desktop buttons - visible on screens >= 640px -->
      <div class="hidden sm:flex items-center gap-2">
        <!-- Help — always visible -->
        <button class="theme-btn" @click="showHelp = true" title="Help">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <!-- Theme toggle — always visible -->
        <button
          class="theme-btn"
          @click="toggleTheme"
          :title="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <!-- Moon: shown in light mode -->
          <svg
            v-if="!isDarkTheme"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <!-- Sun: shown in dark mode -->
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
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

      <!-- Mobile hamburger menu - visible on screens < 640px -->
      <el-dropdown trigger="click" class="sm:hidden mobile-menu-dropdown">
        <button class="hamburger-btn">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <template #dropdown>
          <el-dropdown-menu class="mobile-dropdown-menu">
            <!-- Help — always visible -->
            <el-dropdown-item @click="showHelp = true">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help</span>
              </div>
            </el-dropdown-item>
            <!-- Expenses Summary - only when logged in -->
            <el-dropdown-item v-if="loggedIn" @click="handleNetPosition" divided>
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><DataAnalysis /></el-icon>
                <span>Expenses Summary</span>
              </div>
            </el-dropdown-item>
            <!-- Theme Toggle -->
            <el-dropdown-item @click="toggleTheme" divided>
              <div class="flex items-center gap-3">
                <svg
                  v-if="!isDarkTheme"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>{{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}</span>
              </div>
            </el-dropdown-item>

            <!-- Logout - only when logged in -->
            <el-dropdown-item v-if="loggedIn" @click="confirmLogout">
              <div class="flex items-center gap-3">
                <el-icon class="menu-icon" :size="20"><SwitchButton /></el-icon>
                <span>Logout</span>
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
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
</template>

<script>
import { ref } from 'vue'
import { SwitchButton, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import HelpDialog from './generic-components/HelpDialog.vue'

export default {
  name: 'AppHeader',
  components: {
    DataAnalysis,
    SwitchButton,
    HelpDialog
  },
  props: {
    loggedIn: { type: Boolean, default: false },
    isDarkTheme: { type: Boolean, default: false },
    toggleTheme: { type: Function, default: () => {} },
    notifications: { type: Array, default: () => [] },
    notificationCount: { type: Number, default: 0 }
  },
  emits: ['click-log', 'show-net-position', 'navigate-to-tab'],

  setup(_, { emit }) {
    const notifVisible = ref(false)
    const showHelp = ref(false)

    function setLoggedInStatus() {
      emit('click-log', false)
    }

    async function confirmLogout() {
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to logout?',
          'Confirm Logout',
          {
            confirmButtonText: 'Logout',
            cancelButtonText: 'Stay Logged In',
            type: 'warning'
          }
        )
        setLoggedInStatus()
      } catch {
        /* user cancelled */
      }
    }

    function handleNetPosition() {
      emit('show-net-position')
    }

    function handleNavigate(notif) {
      notifVisible.value = false
      emit('navigate-to-tab', { tab: notif.tab, groupId: notif.groupId })
    }

    return {
      notifVisible,
      showHelp,
      setLoggedInStatus,
      confirmLogout,
      handleNetPosition,
      handleNavigate,
      SwitchButton,
      DataAnalysis
    }
  },

  computed: {
    notifsByCategory() {
      const map = {}
      this.notifications.forEach((n) => {
        if (!map[n.category]) map[n.category] = []
        map[n.category].push(n)
      })
      return map
    },
    notifCategories() {
      return Object.keys(this.notifsByCategory)
    }
  }
}
</script>

<style scoped>
.kharchafy-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 80px;
}

/* Since the header is fixed, remember to add padding-top to your 
   main content container (like el-main) so it doesn't hide behind the header! */

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
  color: #e5e7eb;
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
