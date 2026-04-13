<template>
  <nav v-if="isVisible" class="hidden lg:flex items-center gap-2 mr-2">
    <button
      v-for="link in publicNavLinks"
      :key="link.to"
      class="public-nav-link"
      :class="{ 'public-nav-link--active': routePath === link.to }"
      @click="emit('navigate', link.to)"
    >
      {{ link.label }}
    </button>
  </nav>
</template>

<script setup>
defineProps({
  isVisible: { type: Boolean, default: false },
  publicNavLinks: { type: Array, default: () => [] },
  routePath: { type: String, default: '' }
})

const emit = defineEmits(['navigate'])
</script>

<style scoped>
.public-nav-link {
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

.public-nav-link--active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.72);
}

.public-nav-link:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
