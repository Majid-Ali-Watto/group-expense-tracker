<template>
  <div class="text-center text-gray-500 py-4">
    <span v-if="searchQuery">No groups match your search.</span>
    <span v-else>No other groups available.</span>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})
</script>
