<template>
  <img
    v-if="src"
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    :loading="loading"
    :decoding="decoding"
    :style="resolvedStyle"
    draggable="false"
  />
</template>

<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: 'Image' },
  fit: { type: String, default: 'cover' },
  loading: { type: String, default: 'lazy' },
  decoding: { type: String, default: 'async' }
})

const attrs = useAttrs()

const resolvedStyle = computed(() => {
  const baseStyle = { objectFit: props.fit }

  if (!attrs.style) return baseStyle
  if (Array.isArray(attrs.style)) return [baseStyle, ...attrs.style]

  return [baseStyle, attrs.style]
})
</script>
