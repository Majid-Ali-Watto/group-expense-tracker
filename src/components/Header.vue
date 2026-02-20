<template>
  <el-header 
    class="fintrack-header flex items-center justify-between shadow-md fixed top-0 left-0 w-full z-50 bg-white transition-all duration-300"
  >
    <div class="logo-section">
      <span class="text-base sm:text-xl md:text-2xl font-bold text-black">
        FinTrack
      </span>
    </div>

    <div v-if="loggedIn" class="actions-section">
      <el-button 
        type="primary" 
        plain 
        size="small" 
        @click="setLoggedInStatus"
      >
        Logout
      </el-button>
    </div>
  </el-header>
</template>

<script>
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

    return {
      setLoggedInStatus
    }
  }
}
</script>

<style scoped>
.fintrack-header {
  /* Ensure the header height is consistent with el-main's expectations */
  --el-header-padding: 0 20px;
  --el-header-height: 60px;
}

/* Since the header is fixed, remember to add padding-top to your 
   main content container (like el-main) so it doesn't hide behind the header! */
</style>
