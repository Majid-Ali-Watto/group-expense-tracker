<template>
  <el-header
    class="fintrack-header flex items-center justify-between shadow-md fixed top-0 left-0 w-full z-50 !bg-green-600 !text-white transition-all duration-300"
  >
    <div class="flex flex-col items-start gap-0">
      <span class="text-xl sm:text-2xl md:text-3xl font-bold text-white">
        FinTrack
      </span>
      <span class="text-sm sm:text-base md:text-xl font-normal text-white">
        Your Personal Finance Tracker
      </span>
    </div>

    <div v-if="loggedIn" class="actions-section">
      <el-button
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
    loggedIn: { type: Boolean, default: false }
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
.fintrack-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 80px;
}

/* Since the header is fixed, remember to add padding-top to your 
   main content container (like el-main) so it doesn't hide behind the header! */

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
