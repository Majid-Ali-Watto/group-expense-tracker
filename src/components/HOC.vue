<template>
  <Suspense>
    <template #default>
      <component
        :is="componentToBeRendered"
        v-bind="componentProps"
        v-on="listenersToPass"
        @click.stop="$emit('click')"
        ref="componentRef"
      />
    </template>
    <template #fallback>
      <div
        class="loading-wrapper"
        v-loading="true"
        element-loading-text-color="red"
        element-loading-text="Loading..."
        :element-loading-spinner="svg"
        element-loading-svg-view-box="-10, -10, 50, 50"
        element-loading-background="rgba(0, 0, 0, 0)"
      ></div>
    </template>
  </Suspense>
</template>

<script setup>
import { svg } from '../assets/loader-svg'
import { ref } from 'vue'
const componentRef = ref(null)

// Props
defineProps({
  componentToBeRendered: {
    type: [Object, Function], // Accept a component or an async component
    required: true
  },
  componentProps: {
    type: Object, // Props for the dynamic component
    default: () => ({})
  },
  listenersToPass: {
    type: Object,
    default: () => ({})
  }
})

// Expose internal `componentRef` to the parent
defineExpose({
  componentRef
})
</script>

<style scoped>
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background: rgba(30, 32, 28, 0.8); /* Optional background overlay */
}

.el-loading-text {
  color: white !important; /* Customize loading text color */
  font-size: 1.2rem; /* Better readability */
}
</style>
