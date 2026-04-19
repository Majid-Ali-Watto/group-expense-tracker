<template>
  <el-dialog
    :model-value="visible"
    title="Adjust Profile Photo"
    :width="'min(96vw, 920px)'"
    append-to-body
    destroy-on-close
    @opened="handleDialogOpened"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="profile-photo-editor">
      <div
        ref="editorViewportRef"
        class="profile-photo-editor__canvas"
        @pointerdown="handlePointerDown"
      >
        <div class="profile-photo-editor__viewport-frame">
          <img
            v-if="sourceUrl"
            ref="imageRef"
            :src="sourceUrl"
            alt="Profile photo editor"
            class="profile-photo-editor__image"
            :style="editorImageStyle"
            @load="handleImageLoad"
            draggable="false"
          />
        </div>
      </div>

      <div class="profile-photo-editor__sidebar">
        <div class="profile-photo-editor__preview-block">
          <p class="profile-photo-editor__label">Preview</p>
          <div class="profile-photo-editor__preview-frame">
            <div class="profile-photo-editor__preview">
              <img
                v-if="sourceUrl && imageLoaded"
                :src="sourceUrl"
                alt="Profile photo preview"
                class="profile-photo-editor__preview-image"
                :style="previewImageStyle"
                draggable="false"
              />
            </div>
          </div>
        </div>

        <div class="profile-photo-editor__controls">
          <p class="profile-photo-editor__label">Zoom</p>
          <el-slider
            v-model="zoomLevel"
            :min="1"
            :max="3"
            :step="0.05"
            @input="handleZoom"
          />

          <div class="profile-photo-editor__actions">
            <el-button size="small" @click="zoomOut">Zoom Out</el-button>
            <el-button size="small" @click="zoomIn">Zoom In</el-button>
            <el-button size="small" @click="rotateLeft">Rotate Left</el-button>
            <el-button size="small" @click="rotateRight">
              Rotate Right
            </el-button>
            <el-button size="small" @click="resetEditor">Reset</el-button>
          </div>
        </div>

        <p class="profile-photo-editor__hint">
          Drag the image to reposition it inside the crop area, then use zoom or
          rotate before uploading.
        </p>
      </div>
    </div>

    <template #footer>
      <div class="profile-photo-editor__footer">
        <el-button size="small" @click="emit('update:visible', false)">
          Cancel
        </el-button>
        <el-button
          size="small"
          type="success"
          :loading="submitting"
          :disabled="submitting || !sourceUrl || !imageLoaded"
          @click="confirmCrop"
        >
          Upload Photo
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  sourceUrl: { type: String, default: '' },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'confirm'])

const imageRef = ref(null)
const editorViewportRef = ref(null)
const editorSize = ref(360)
const imageLoaded = ref(false)
const naturalWidth = ref(0)
const naturalHeight = ref(0)
const zoomLevel = ref(1)
const rotation = ref(0)
const offsetX = ref(0)
const offsetY = ref(0)

const previewSize = 160
let resizeObserver = null
let dragState = null

const normalizedRotation = computed(() => {
  const raw = rotation.value % 360
  return raw < 0 ? raw + 360 : raw
})

const isQuarterTurn = computed(() => normalizedRotation.value % 180 !== 0)

const rotatedNaturalWidth = computed(() =>
  isQuarterTurn.value ? naturalHeight.value : naturalWidth.value
)

const rotatedNaturalHeight = computed(() =>
  isQuarterTurn.value ? naturalWidth.value : naturalHeight.value
)

function resolveBaseScale(size) {
  if (
    !imageLoaded.value ||
    !rotatedNaturalWidth.value ||
    !rotatedNaturalHeight.value
  ) {
    return 1
  }

  return Math.max(
    size / rotatedNaturalWidth.value,
    size / rotatedNaturalHeight.value
  )
}

const editorBaseScale = computed(() => resolveBaseScale(editorSize.value))
const previewBaseScale = computed(() => resolveBaseScale(previewSize))

const rotatedDisplayWidth = computed(
  () => rotatedNaturalWidth.value * editorBaseScale.value * zoomLevel.value
)

const rotatedDisplayHeight = computed(
  () => rotatedNaturalHeight.value * editorBaseScale.value * zoomLevel.value
)

function clampOffsets(nextX = offsetX.value, nextY = offsetY.value) {
  const maxOffsetX = Math.max(
    0,
    (rotatedDisplayWidth.value - editorSize.value) / 2
  )
  const maxOffsetY = Math.max(
    0,
    (rotatedDisplayHeight.value - editorSize.value) / 2
  )

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY))
  }
}

const editorImageStyle = computed(() => ({
  width: `${naturalWidth.value * editorBaseScale.value * zoomLevel.value}px`,
  height: `${naturalHeight.value * editorBaseScale.value * zoomLevel.value}px`,
  transform: `translate(-50%, -50%) translate(${offsetX.value}px, ${offsetY.value}px) rotate(${rotation.value}deg)`
}))

const previewImageStyle = computed(() => ({
  width: `${naturalWidth.value * previewBaseScale.value * zoomLevel.value}px`,
  height: `${naturalHeight.value * previewBaseScale.value * zoomLevel.value}px`,
  transform: `translate(-50%, -50%) translate(${(offsetX.value / editorSize.value) * previewSize}px, ${(offsetY.value / editorSize.value) * previewSize}px) rotate(${rotation.value}deg)`
}))

function resetEditor() {
  zoomLevel.value = 1
  rotation.value = 0
  offsetX.value = 0
  offsetY.value = 0
}

function measureEditorSize() {
  const size = editorViewportRef.value?.clientWidth || 360
  editorSize.value = Math.max(240, size)

  const clamped = clampOffsets(offsetX.value, offsetY.value)
  offsetX.value = clamped.x
  offsetY.value = clamped.y
}

function handleDialogOpened() {
  nextTick(() => {
    measureEditorSize()

    resizeObserver?.disconnect()
    if (editorViewportRef.value) {
      resizeObserver = new ResizeObserver(() => {
        measureEditorSize()
      })
      resizeObserver.observe(editorViewportRef.value)
    }
  })
}

function handleImageLoad() {
  const image = imageRef.value
  if (!image) return

  naturalWidth.value = image.naturalWidth || 0
  naturalHeight.value = image.naturalHeight || 0
  imageLoaded.value = true
  resetEditor()

  nextTick(() => {
    measureEditorSize()
  })
}

function handleZoom(value) {
  zoomLevel.value = Number(value) || 1
  const clamped = clampOffsets(offsetX.value, offsetY.value)
  offsetX.value = clamped.x
  offsetY.value = clamped.y
}

function zoomIn() {
  handleZoom(Math.min(3, Number((zoomLevel.value + 0.1).toFixed(2))))
}

function zoomOut() {
  handleZoom(Math.max(1, Number((zoomLevel.value - 0.1).toFixed(2))))
}

function rotateLeft() {
  rotation.value -= 90
  const clamped = clampOffsets(offsetX.value, offsetY.value)
  offsetX.value = clamped.x
  offsetY.value = clamped.y
}

function rotateRight() {
  rotation.value += 90
  const clamped = clampOffsets(offsetX.value, offsetY.value)
  offsetX.value = clamped.x
  offsetY.value = clamped.y
}

function handlePointerDown(event) {
  if (!imageLoaded.value) return

  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    originX: offsetX.value,
    originY: offsetY.value
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
}

function handlePointerMove(event) {
  if (!dragState) return

  const next = clampOffsets(
    dragState.originX + (event.clientX - dragState.startX),
    dragState.originY + (event.clientY - dragState.startY)
  )

  offsetX.value = next.x
  offsetY.value = next.y
}

function handlePointerUp() {
  dragState = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
}

function confirmCrop() {
  if (!imageRef.value || !imageLoaded.value || !editorSize.value) return

  const canvasSize = 720
  const ratio = canvasSize / editorSize.value
  const outputBaseScale = resolveBaseScale(canvasSize)
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize

  const context = canvas.getContext('2d')
  if (!context) return

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.translate(
    canvasSize / 2 + offsetX.value * ratio,
    canvasSize / 2 + offsetY.value * ratio
  )
  context.rotate((rotation.value * Math.PI) / 180)
  context.scale(
    outputBaseScale * zoomLevel.value,
    outputBaseScale * zoomLevel.value
  )
  context.drawImage(
    imageRef.value,
    -naturalWidth.value / 2,
    -naturalHeight.value / 2,
    naturalWidth.value,
    naturalHeight.value
  )
  context.restore()

  canvas.toBlob(
    (blob) => {
      if (!blob) return
      emit('confirm', blob)
    },
    'image/jpeg',
    0.92
  )
}

watch(
  () => [props.visible, props.sourceUrl],
  ([visible, sourceUrl]) => {
    if (!visible || !sourceUrl) {
      imageLoaded.value = false
      naturalWidth.value = 0
      naturalHeight.value = 0
      resetEditor()
      resizeObserver?.disconnect()
      resizeObserver = null
      handlePointerUp()
    }
  }
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  handlePointerUp()
})
</script>

<style scoped>
.profile-photo-editor {
  display: grid;
  gap: 1rem;
}

.profile-photo-editor__canvas {
  position: relative;
  width: 100%;
  max-width: 520px;
  aspect-ratio: 1;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    repeating-conic-gradient(
        from 45deg,
        rgba(148, 163, 184, 0.1) 0deg 90deg,
        rgba(148, 163, 184, 0.18) 90deg 180deg
      )
      50% / 18px 18px;
  justify-self: center;
  touch-action: none;
  cursor: grab;
}

.profile-photo-editor__canvas:active {
  cursor: grabbing;
}

.profile-photo-editor__viewport-frame {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 18px;
}

.profile-photo-editor__image {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  max-width: none;
  user-select: none;
  transform-origin: center center;
}

.profile-photo-editor__sidebar {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.profile-photo-editor__preview-block {
  display: grid;
  gap: 0.5rem;
}

.profile-photo-editor__label {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.profile-photo-editor__preview-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 176px;
  height: 176px;
  padding: 8px;
  border-radius: 28px;
  border: 1px solid rgba(34, 197, 94, 0.2);
  background: rgba(34, 197, 94, 0.04);
}

.profile-photo-editor__preview {
  position: relative;
  width: 160px;
  height: 160px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.06);
}

.profile-photo-editor__preview-image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  border-radius: 999px;
  transform-origin: center center;
}

.profile-photo-editor__controls {
  display: grid;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background: color-mix(in srgb, var(--card-bg) 94%, transparent);
}

.profile-photo-editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.profile-photo-editor__hint {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.profile-photo-editor__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

:global(:root.dark-theme) .profile-photo-editor__canvas {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    repeating-conic-gradient(
        from 45deg,
        rgba(51, 65, 85, 0.55) 0deg 90deg,
        rgba(71, 85, 105, 0.48) 90deg 180deg
      )
      50% / 18px 18px;
}

@media (min-width: 768px) {
  .profile-photo-editor {
    grid-template-columns: minmax(0, 1fr) 260px;
    align-items: start;
  }
}
</style>
