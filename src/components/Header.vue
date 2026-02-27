<template>
  <el-header
    class="kharchafy-header flex items-center justify-between shadow-md fixed top-0 left-0 w-full z-50 !bg-green-600 !text-white transition-all duration-300"
  >
    <div class="flex flex-col items-start gap-0">
      <span class="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-wide drop-shadow-sm">
        Kharchafy
      </span>
      <span class="text-xs sm:text-sm tracking-widest uppercase font-light text-white/90">
        Track · Split · Settle
      </span>
    </div>

    <div class="flex items-center gap-2">
      <!-- Theme toggle — always visible -->
      <button
        class="theme-btn"
        @click="toggleTheme"
        :title="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <!-- Moon: shown in light mode -->
        <svg v-if="!isDarkTheme" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
        <!-- Sun: shown in dark mode -->
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </button>

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
  </el-header>
</template>

<script>
import { SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

export default {
  name: 'AppHeader',
  props: {
    loggedIn: { type: Boolean, default: false },
    isDarkTheme: { type: Boolean, default: false },
    toggleTheme: { type: Function, default: () => {} }
  },
  emits: ['click-log'], // Explicitly defining emits is a Vue 3 best practice

  setup(props, { emit }) {
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

    return {
      setLoggedInStatus,
      confirmLogout,
      SwitchButton
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

.logout-btn {
  border-color: #ffffff !important;
  color: #ffffff !important;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.12) !important;
  border-color: #ffffff !important;
  color: #ffffff !important;
}
</style>
