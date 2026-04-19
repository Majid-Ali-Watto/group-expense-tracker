<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    append-to-body
    @update:model-value="$emit('update:modelValue', $event)"
    @closed="resetViewer"
  >
    <div class="ipd-shell">
      <div
        v-if="hasMultiple"
        class="ipd-toolbar ipd-toolbar--top"
      >
        <el-button size="small" :disabled="currentIndex <= 0" @click="previous">
          Previous
        </el-button>
        <span class="ipd-counter">
          {{ currentIndex + 1 }} / {{ normalizedImages.length }}
        </span>
        <el-button
          size="small"
          :disabled="currentIndex >= normalizedImages.length - 1"
          @click="next"
        >
          Next
        </el-button>
      </div>

      <div class="ipd-toolbar">
        <el-button size="small" :disabled="zoom <= minZoom" @click="zoomOut">
          -
        </el-button>
        <span class="ipd-zoom">{{ Math.round(zoom * 100) }}%</span>
        <el-button size="small" :disabled="zoom >= maxZoom" @click="zoomIn">
          +
        </el-button>
        <el-button size="small" @click="resetZoom">Reset</el-button>
      </div>

      <div class="ipd-stage">
        <AppImage
          v-if="currentImage"
          :src="currentImage.url"
          :alt="currentImage.name || 'Preview image'"
          class="ipd-image"
          fit="contain"
          :style="{ transform: `scale(${zoom})` }"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppImage from './AppImage.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
  title: { type: String, default: 'Image Preview' },
  width: { type: String, default: 'min(92vw, 720px)' }
})

defineEmits(['update:modelValue'])

const minZoom = 1
const maxZoom = 3
const zoomStep = 0.25

const zoom = ref(1)
const currentIndex = ref(0)

const normalizedImages = computed(() =>
  (props.images || []).filter((image) => image?.url)
)
const hasMultiple = computed(() => normalizedImages.value.length > 1)
const currentImage = computed(
  () => normalizedImages.value[currentIndex.value] || null
)

function clampIndex(index) {
  if (!normalizedImages.value.length) return 0
  return Math.min(
    Math.max(index, 0),
    Math.max(normalizedImages.value.length - 1, 0)
  )
}

function resetZoom() {
  zoom.value = 1
}

function resetViewer() {
  currentIndex.value = clampIndex(props.initialIndex || 0)
  resetZoom()
}

function zoomIn() {
  zoom.value = Math.min(maxZoom, zoom.value + zoomStep)
}

function zoomOut() {
  zoom.value = Math.max(minZoom, zoom.value - zoomStep)
}

function previous() {
  if (currentIndex.value <= 0) return
  currentIndex.value -= 1
  resetZoom()
}

function next() {
  if (currentIndex.value >= normalizedImages.value.length - 1) return
  currentIndex.value += 1
  resetZoom()
}

watch(
  [() => props.modelValue, () => props.initialIndex, normalizedImages],
  ([visible, initialIndex]) => {
    if (!visible) return
    currentIndex.value = clampIndex(initialIndex || 0)
    resetZoom()
  },
  { immediate: true }
)
</script>

<style scoped>
.ipd-shell {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ipd-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ipd-toolbar--top {
  justify-content: space-between;
}

.ipd-counter,
.ipd-zoom {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
}

.ipd-stage {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 260px;
  max-height: 70vh;
  overflow: auto;
  border-radius: 18px;
  background: rgba(148, 163, 184, 0.08);
  padding: 1rem;
}

.ipd-image {
  max-width: 100%;
  max-height: calc(70vh - 2rem);
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.18s ease;
}

:global(:root.dark-theme) .ipd-stage {
  background: rgba(15, 23, 42, 0.8);
}
</style>
