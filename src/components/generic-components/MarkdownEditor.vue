<template>
  <div class="mde-wrapper" :class="{ 'mde-error': hasError }">
    <!-- Toolbar -->
    <div class="mde-toolbar">
      <button type="button" class="mde-btn" title="Bold" @mousedown.prevent="wrap('**', '**')"><b>B</b></button>
      <button type="button" class="mde-btn" title="Italic" @mousedown.prevent="wrap('*', '*')"><i>I</i></button>
      <button type="button" class="mde-btn mde-btn--mono" title="Inline code" @mousedown.prevent="wrap('`', '`')">&lt;/&gt;</button>
      <button type="button" class="mde-btn mde-btn--mono" title="Code block" @mousedown.prevent="insertCodeBlock()">&#9641;&thinsp;Block</button>
      <span class="mde-sep" />
      <button type="button" class="mde-btn" title="Bullet list" @mousedown.prevent="prefixLine('- ')">&#8226; List</button>
      <button type="button" class="mde-btn" title="Numbered list" @mousedown.prevent="prefixLine('1. ')">1. List</button>
      <template v-if="showTemplate">
        <span class="mde-sep" />
        <button type="button" class="mde-btn mde-btn--template" title="Insert bug report template" @mousedown.prevent="$emit('template')">
          &#128196; Template
        </button>
      </template>
      <template v-if="allowImages">
        <span class="mde-sep" />
        <label
          class="mde-btn mde-btn--image"
          :class="{ 'is-disabled': localImages.length >= maxImages || disabled }"
          title="Attach image"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Image
          <input
            type="file"
            accept="image/*"
            multiple
            class="mde-file-input"
            :disabled="localImages.length >= maxImages || disabled"
            @change="handleFiles"
          />
        </label>
      </template>
      <span class="mde-hint">Markdown supported</span>
    </div>

    <!-- Textarea -->
    <el-input
      ref="inputRef"
      :model-value="modelValue"
      type="textarea"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :show-word-limit="showWordLimit"
      :disabled="disabled"
      class="mde-textarea"
      @update:model-value="$emit('update:modelValue', $event)"
      @keydown="handleKeydown"
    />

    <!-- Attached image previews -->
    <div v-if="allowImages && localImages.length" class="mde-image-list">
      <div v-for="(img, i) in localImages" :key="i" class="mde-image-item">
        <a :href="img.preview" target="_blank" rel="noopener noreferrer" class="mde-image-thumb-link">
          <img :src="img.preview" :alt="img.file.name" class="mde-image-thumb" />
        </a>
        <span class="mde-image-name">{{ img.file.name }}</span>
        <button type="button" class="mde-image-remove" @mousedown.prevent="removeImage(i)">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue:    { type: String,  default: '' },
  placeholder:   { type: String,  default: '' },
  rows:          { type: Number,  default: 4 },
  maxlength:     { type: Number,  default: 500 },
  showWordLimit: { type: Boolean, default: false },
  showTemplate:  { type: Boolean, default: false },
  allowImages:   { type: Boolean, default: false },
  maxImages:     { type: Number,  default: 3 },
  disabled:      { type: Boolean, default: false },
  hasError:      { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:images', 'template', 'keydown'])

const inputRef = ref(null)
const localImages = ref([])  // [{ file: File, preview: dataURL }]

// ── Toolbar actions ──────────────────────────────────────────
function wrap(before, after) {
  const el = inputRef.value?.textarea
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const selected = el.value.slice(start, end) || 'text'
  const replacement = before + selected + after
  emit('update:modelValue', el.value.slice(0, start) + replacement + el.value.slice(end))
  nextTick(() => {
    el.focus()
    el.setSelectionRange(start + before.length, start + before.length + selected.length)
  })
}

function prefixLine(prefix) {
  const el = inputRef.value?.textarea
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const text = el.value

  // Find where the first affected line begins
  const blockStart = text.lastIndexOf('\n', start - 1) + 1
  // Don't include a trailing newline that may be at `end`
  const blockEnd = end > start && text[end - 1] === '\n' ? end - 1 : end

  const lines = text.slice(blockStart, blockEnd).split('\n')

  const newLines = prefix === '1. '
    ? lines.map((line, i) => `${i + 1}. ${line}`)
    : lines.map((line) => prefix + line)

  const newBlock = newLines.join('\n')
  emit('update:modelValue', text.slice(0, blockStart) + newBlock + text.slice(blockEnd))
  nextTick(() => {
    el.focus()
    el.setSelectionRange(blockStart, blockStart + newBlock.length)
  })
}

function insertCodeBlock() {
  const el = inputRef.value?.textarea
  if (!el) return
  const { selectionStart: start, selectionEnd: end } = el
  const selected = el.value.slice(start, end)
  const block = '```\n' + (selected || 'code here') + '\n```'
  emit('update:modelValue', el.value.slice(0, start) + block + el.value.slice(end))
  nextTick(() => {
    el.focus()
    // place cursor inside the block
    const innerStart = start + 4
    const innerEnd = innerStart + (selected || 'code here').length
    el.setSelectionRange(innerStart, innerEnd)
  })
}

// ── Keydown: auto-continue numbered lists ───────────────────
function handleKeydown(e) {
  if (e.key === 'Enter') {
    const el = inputRef.value?.textarea
    if (el) {
      const { selectionStart: start, selectionEnd: end } = el
      const text = el.value
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const lineText = text.slice(lineStart, start)
      const match = lineText.match(/^(\d+)\. /)
      if (match) {
        e.preventDefault()
        const lineContent = lineText.slice(match[0].length)
        if (lineContent === '' && start === end) {
          // Empty list item — break out of the list
          const newText = text.slice(0, lineStart) + text.slice(start)
          emit('update:modelValue', newText)
          nextTick(() => { el.focus(); el.setSelectionRange(lineStart, lineStart) })
        } else {
          // Continue list with next number
          const nextPrefix = `\n${parseInt(match[1]) + 1}. `
          const newText = text.slice(0, start) + nextPrefix + text.slice(end)
          emit('update:modelValue', newText)
          nextTick(() => { const p = start + nextPrefix.length; el.focus(); el.setSelectionRange(p, p) })
        }
        emit('keydown', e)
        return
      }
    }
  }
  emit('keydown', e)
}

// ── Image handling ───────────────────────────────────────────
function handleFiles(e) {
  const files = Array.from(e.target.files || [])
  const remaining = props.maxImages - localImages.value.length
  files.slice(0, remaining).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      localImages.value = [...localImages.value, { file, preview: ev.target.result }]
      emit('update:images', localImages.value)
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

function removeImage(i) {
  localImages.value = localImages.value.filter((_, idx) => idx !== i)
  emit('update:images', localImages.value)
}

function clearImages() {
  localImages.value = []
  emit('update:images', [])
}

defineExpose({ clearImages, images: localImages })
</script>

<style scoped>
.mde-wrapper {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.mde-wrapper.mde-error {
  border-color: #ef4444;
}

/* ── Toolbar ────────────────────────────────────────────────── */
.mde-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 8px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
  flex-wrap: wrap;
}

.mde-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.12s;
  min-width: 24px;
  height: 24px;
  line-height: 1;
}

.mde-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.mde-btn--mono    { font-family: monospace; font-size: 11.5px; }
.mde-btn--template { color: #6366f1; }
.mde-btn--template:hover { border-color: #6366f1 !important; background: #eef2ff !important; }

.mde-btn--image {
  cursor: pointer;
  position: relative;
}
.mde-btn--image.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.mde-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.mde-sep {
  width: 1px;
  height: 16px;
  background: var(--el-border-color);
  margin: 0 4px;
  flex-shrink: 0;
}

.mde-hint {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* ── Textarea ───────────────────────────────────────────────── */
.mde-textarea :deep(.el-textarea__inner) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  resize: vertical;
}

/* ── Image list ─────────────────────────────────────────────── */
.mde-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
}

.mde-image-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 4px 6px 4px 4px;
  max-width: 200px;
}

.mde-image-thumb-link { flex-shrink: 0; }

.mde-image-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}

.mde-image-name {
  font-size: 11px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  max-width: 100px;
  flex: 1;
}

.mde-image-remove {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 0;
}
.mde-image-remove:hover { background: #fee2e2; color: #ef4444; }

/* ── Dark theme ─────────────────────────────────────────────── */
:root.dark-theme .mde-toolbar  { background: #1f2937; border-color: #374151; }
:root.dark-theme .mde-btn      { color: #d1d5db; }
:root.dark-theme .mde-btn:hover { background: #374151; border-color: #4b5563; color: #f3f4f6; }
:root.dark-theme .mde-sep      { background: #374151; }
:root.dark-theme .mde-textarea :deep(.el-textarea__inner) { background: #1f2937; color: #e5e7eb; }
:root.dark-theme .mde-image-list  { background: #1f2937; border-color: #374151; }
:root.dark-theme .mde-image-item  { background: #111827; border-color: #374151; }
:root.dark-theme .mde-image-name  { color: #9ca3af; }
:root.dark-theme .mde-image-remove { background: #374151; color: #6b7280; }
:root.dark-theme .mde-image-remove:hover { background: rgba(239,68,68,0.2); color: #fca5a5; }
</style>
