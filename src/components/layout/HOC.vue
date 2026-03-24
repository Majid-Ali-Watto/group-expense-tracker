<template>
  <Suspense>
    <template #default>
      <component
        :is="componentToBeRendered"
        v-bind="componentProps"
        v-on="listenersToPass"
        ref="componentRef"
        class="px-2 mb-4"
      />
    </template>
    <template #fallback>
      <LoadingSkeleton mode="page" />
    </template>
  </Suspense>
</template>

<script setup>
import { ref } from 'vue'
import LoadingSkeleton from '../shared/LoadingSkeleton.vue'
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
