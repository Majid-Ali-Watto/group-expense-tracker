<template>
  <!-- Thread list -->
  <div v-if="notes.length" class="nt-thread">
    <div
      v-for="note in notes"
      :key="note.id"
      :id="`${idPrefix}-${note.id}`"
      class="nt-item"
      :class="`nt-item--${note.authorType}`"
    >
      <div class="nt-avatar" :class="`nt-avatar--${note.authorType}`">
        {{ avatarChar(note) }}
      </div>

      <div class="nt-body">
        <div class="nt-meta">
          <span class="nt-author">{{ authorLabel(note) }}</span>
          <span class="nt-time">{{ formatDate(note.createdAt) }}</span>
          <span v-if="note.editedAt" class="nt-edited">(edited)</span>
        </div>

        <!-- Edit mode -->
        <template v-if="noteEditingId === note.id">
          <MarkdownEditor
            v-model="localEditText"
            :rows="2"
            :maxlength="1000"
            :has-error="!!noteEditError"
            @keydown.enter.ctrl.prevent="
              $emit('save-edit', note, localEditText)
            "
          />
          <p v-if="noteEditError" class="nt-edit-error">{{ noteEditError }}</p>
          <div class="nt-edit-actions">
            <button class="nt-edit-cancel" @click="$emit('cancel-edit')">
              Cancel
            </button>
            <button
              class="nt-edit-save"
              :disabled="noteEditSavingId === note.id"
              @click="$emit('save-edit', note, localEditText)"
            >
              {{ noteEditSavingId === note.id ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </template>

        <!-- View mode -->
        <template v-else>
          <!-- Reply-to quote (click → scroll to original) -->
          <div
            v-if="note.replyTo"
            class="nt-quote"
            @click="$emit('scroll-to', note.replyTo.noteId)"
          >
            <span class="nt-quote-author">
              <ReplyIcon
                class="w-2.5 h-2.5"
                style="display: inline; margin-right: 2px"
              />
              {{ note.replyTo.authorName }}
            </span>
            <p class="nt-quote-text">{{ note.replyTo.textPreview }}</p>
          </div>

          <!-- Note text + copy button -->
          <div class="nt-text-row">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <p class="nt-text" v-html="markdownToHtml(note.text)"></p>
            <button
              class="nt-copy-btn"
              title="Copy note"
              @click.stop="copyText(note.text)"
            >
              <CopyIcon class="w-3 h-3" />
            </button>
          </div>

          <!-- Note images -->
          <div v-if="note.images?.length" class="nt-imgs">
            <div
              v-for="(img, ni) in note.images"
              :key="ni"
              class="nt-img-thumb"
            >
              <AppImage :src="img.url" :alt="`Image ${ni + 1}`" />
              <span class="nt-img-overlay">
                <a
                  :href="img.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="nt-img-action-btn"
                  title="Open"
                >
                  <ExternalLinkIcon class="w-3.5 h-3.5" />
                </a>
                <button
                  class="nt-img-action-btn"
                  title="Download"
                  @click.prevent="
                    downloadImage(img.url, `note-image-${ni + 1}`)
                  "
                >
                  <DownloadIcon class="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          </div>

          <!-- Reactions chips -->
          <div v-if="reactionsOf(note).length" class="nt-reactions">
            <button
              v-for="rx in reactionsOf(note)"
              :key="rx.emoji"
              class="nt-reaction-chip"
              :class="{ 'is-mine': rx.mine }"
              :title="rx.mine ? 'Remove reaction' : 'Add reaction'"
              @click="$emit('toggle-reaction', note, rx.emoji)"
            >
              {{ rx.emoji }} {{ rx.count }}
            </button>
          </div>

          <!-- Action bar -->
          <div class="nt-actions">
            <!-- Reply -->
            <button
              class="nt-action-btn"
              title="Reply to this note"
              @click="$emit('reply', note)"
            >
              <ReplyIcon class="w-3 h-3" />
            </button>

            <!-- Emoji picker -->
            <div class="nt-reaction-wrap">
              <button
                class="nt-action-btn"
                title="React"
                @click.stop="$emit('toggle-picker', note.id, $event)"
              >
                <SmileIcon class="w-3 h-3" />
              </button>
              <div
                v-if="openReactionPicker === note.id"
                class="nt-reaction-picker"
                :class="`align-${reactionPickerAlign}`"
              >
                <button
                  v-for="emoji in REACTION_EMOJIS"
                  :key="emoji"
                  class="nt-reaction-picker-btn"
                  :class="{ 'is-selected': isReactedByMe(note, emoji) }"
                  @click.stop="$emit('toggle-reaction', note, emoji)"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <!-- Edit (only for notes the current user owns) -->
            <button
              v-if="canEdit(note)"
              class="nt-action-btn"
              title="Edit"
              @click="$emit('start-edit', note)"
            >
              <EditIcon class="w-3 h-3" />
            </button>

            <!-- Delete (only for notes the current user owns) -->
            <button
              v-if="canDelete(note)"
              class="nt-action-btn nt-action-btn--del"
              title="Delete"
              @click="$emit('delete', note)"
            >
              <TrashIcon class="w-3 h-3" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Compose area -->
  <div class="nt-compose">
    <!-- Reply banner -->
    <div v-if="replyingTo" class="nt-reply-banner">
      <span class="nt-reply-banner-label">
        Replying to <strong>{{ replyingTo.authorName }}</strong
        >:
        <span class="nt-reply-banner-preview">{{
          replyingTo.text.slice(0, 80)
        }}</span>
      </span>
      <button
        class="nt-reply-banner-dismiss"
        title="Cancel reply"
        @click="$emit('cancel-reply')"
      >
        ✕
      </button>
    </div>

    <MarkdownEditor
      :model-value="composeText"
      :rows="2"
      :maxlength="1000"
      :placeholder="composePlaceholder"
      :allow-images="true"
      :max-images="3"
      :has-error="!!composeError"
      :ref="(el) => $emit('editor-mounted', el)"
      @update:model-value="$emit('update:composeText', $event)"
      @keydown.enter.ctrl.prevent="$emit('send')"
    />
    <p v-if="composeError" class="nt-compose-error">{{ composeError }}</p>
    <div class="nt-compose-actions">
      <span class="nt-charcount">{{ (composeText || '').length }}/1000</span>
      <button class="nt-send-btn" :disabled="sending" @click="$emit('send')">
        {{ sending ? 'Sending…' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  REACTION_EMOJIS,
  markdownToHtml,
  formatDate,
  copyText,
  downloadImage
} from '@/scripts/bug-reports'
import { AppImage, MarkdownEditor } from '@/components/generic-components'
import {
  CopyIcon,
  DownloadIcon,
  EditIcon,
  ExternalLinkIcon,
  ReplyIcon,
  SmileIcon,
  TrashIcon
} from '@/components/icons'

const props = defineProps({
  notes: { type: Array, default: () => [] },
  /** DOM id prefix used for scroll-to-note targets, e.g. 'bra-note' */
  idPrefix: { type: String, required: true },
  /** Callback to determine avatar character */
  avatarCharFn: {
    type: Function,
    default: (note) => (note.authorName || '?').charAt(0).toUpperCase()
  },
  /** Callback to determine displayed author label */
  authorLabelFn: {
    type: Function,
    default: (note) => note.authorName ?? note.authorType
  },
  /** Callback: should Edit be shown for this note? */
  canEdit: { type: Function, default: () => false },
  /** Callback: should Delete be shown for this note? */
  canDelete: { type: Function, default: () => false },
  /** Callback: is this note reacted by me with this emoji? */
  isReactedByMe: { type: Function, default: () => false },
  /** Callback to map a note to its reaction summaries (array of { emoji, count, mine }) */
  reactionsOf: { type: Function, default: () => [] },
  // Picker state (owned by parent, driven by NoteThread script)
  openReactionPicker: { type: [String, null], default: null },
  reactionPickerAlign: { type: String, default: 'left' },
  // Reply banner state
  replyingTo: { type: Object, default: null },
  // Note edit state
  noteEditingId: { type: [String, null], default: null },
  noteEditText: { type: String, default: '' },
  noteEditError: { type: String, default: '' },
  noteEditSavingId: { type: [String, null], default: null },
  // Compose
  composeText: { type: String, default: '' },
  composeError: { type: String, default: '' },
  composePlaceholder: {
    type: String,
    default: 'Write a note… Ctrl+Enter to send'
  },
  sending: { type: Boolean, default: false }
})

defineEmits([
  'toggle-picker',
  'toggle-reaction',
  'reply',
  'cancel-reply',
  'scroll-to',
  'start-edit',
  'cancel-edit',
  'save-edit',
  'delete',
  'update:composeText',
  'send',
  'editor-mounted'
])

// Local copy of noteEditText so MarkdownEditor can mutate without prop violation
const localEditText = ref(props.noteEditText)
watch(
  () => props.noteEditText,
  (v) => {
    localEditText.value = v
  }
)

function avatarChar(note) {
  return props.avatarCharFn(note)
}

function authorLabel(note) {
  return props.authorLabelFn(note)
}
</script>

<style scoped>
/* ── Thread ──────────────────────────────────────────────────────────────── */
.nt-thread {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}

.nt-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.nt-item--reporter {
  flex-direction: row-reverse;
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
.nt-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.nt-avatar--admin {
  background: #dbeafe;
  color: #1d4ed8;
}
.nt-avatar--reporter {
  background: #dcfce7;
  color: #15803d;
}

/* ── Note body ──────────────────────────────────────────────────────────── */
.nt-body {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 40px);
}

.nt-item--reporter .nt-body {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
}

.nt-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.nt-item--reporter .nt-meta {
  flex-direction: row-reverse;
}

.nt-author {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.nt-time {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.nt-edited {
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

/* ── Note text bubble ───────────────────────────────────────────────────── */
.nt-text-row {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.nt-text {
  font-size: 12.5px;
  line-height: 1.55;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--el-text-color-primary);
  display: inline-block;
}

.nt-item--admin .nt-text {
  background: #eff6ff;
  color: #1e3a5f;
  border-radius: 2px 8px 8px 8px;
}
.nt-item--reporter .nt-text {
  background: #f0fdf4;
  color: #14532d;
  border-radius: 8px 2px 8px 8px;
}

/* markdown inside note text */
.nt-text :deep(p) {
  margin: 0 0 3px;
}
.nt-text :deep(p:last-child) {
  margin-bottom: 0;
}
.nt-text :deep(strong) {
  font-weight: 600;
}
.nt-text :deep(em) {
  font-style: italic;
}
.nt-text :deep(code) {
  font-family: monospace;
  font-size: 11.5px;
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 4px;
  border-radius: 3px;
}
.nt-text :deep(pre) {
  margin: 4px 0;
  border-radius: 5px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.07);
  padding: 8px 10px;
  white-space: pre-wrap;
}
.nt-text :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 11px;
}
.nt-text :deep(ul) {
  margin: 2px 0 3px 0;
  padding-left: 18px;
  list-style-type: disc;
}
.nt-text :deep(ol) {
  margin: 2px 0 3px 0;
  padding-left: 22px;
  list-style-type: decimal;
}
.nt-text :deep(li) {
  margin: 1px 0;
}

/* ── Copy button ────────────────────────────────────────────────────────── */
.nt-copy-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 0;
  transition: all 0.12s;
  margin-top: 1px;
}
.nt-copy-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

/* ── Note images ────────────────────────────────────────────────────────── */
.nt-imgs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.nt-img-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.nt-img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nt-img-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}
.nt-img-thumb:hover .nt-img-overlay {
  opacity: 1;
}

.nt-img-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s;
  text-decoration: none;
}
.nt-img-action-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* ── Reactions ──────────────────────────────────────────────────────────── */
.nt-reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.nt-reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 7px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-light);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;
  line-height: 1.6;
}
.nt-reaction-chip:hover {
  border-color: #6366f1;
  background: #eef2ff;
}
.nt-reaction-chip.is-mine {
  border-color: #6366f1;
  background: #e0e7ff;
  font-weight: 600;
}

/* ── Action bar ─────────────────────────────────────────────────────────── */
.nt-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.nt-item:hover .nt-actions {
  opacity: 1;
}

.nt-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 0;
  transition: all 0.12s;
}
.nt-action-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}
.nt-action-btn--del:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

/* ── Emoji picker ───────────────────────────────────────────────────────── */
.nt-reaction-wrap {
  position: relative;
}

.nt-reaction-picker {
  position: absolute;
  bottom: calc(100% + 4px);
  z-index: 20;
  display: flex;
  gap: 2px;
  padding: 5px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
}
.nt-reaction-picker.align-left {
  left: 0;
  right: auto;
}
.nt-reaction-picker.align-right {
  right: 0;
  left: auto;
}

.nt-reaction-picker-btn {
  font-size: 16px;
  line-height: 1;
  padding: 3px 4px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: background 0.1s;
}
.nt-reaction-picker-btn:hover {
  background: var(--el-fill-color);
}
.nt-reaction-picker-btn.is-selected {
  background: #e0e7ff;
  border-color: #6366f1;
}

/* ── Reply-to quote block ───────────────────────────────────────────────── */
.nt-quote {
  margin-bottom: 5px;
  padding: 4px 8px;
  border-left: 2px solid #6366f1;
  background: rgba(99, 102, 241, 0.07);
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  transition: background 0.12s;
}
.nt-quote:hover {
  background: rgba(99, 102, 241, 0.14);
}

.nt-quote-author {
  font-size: 10px;
  font-weight: 700;
  color: #6366f1;
  display: block;
  margin-bottom: 1px;
}

.nt-quote-text {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Note edit controls ─────────────────────────────────────────────────── */
.nt-edit-error {
  font-size: 11.5px;
  color: #ef4444;
  margin: 3px 0 0;
}

.nt-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 5px;
}

.nt-edit-cancel {
  padding: 3px 10px;
  border-radius: 5px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}
.nt-edit-cancel:hover {
  background: var(--el-fill-color);
}

.nt-edit-save {
  padding: 3px 10px;
  border-radius: 5px;
  border: none;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.nt-edit-save:hover:not(:disabled) {
  background: #4338ca;
}
.nt-edit-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Compose area ───────────────────────────────────────────────────────── */
.nt-compose {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nt-reply-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 10px;
  border-left: 3px solid #6366f1;
  background: #eef2ff;
  border-radius: 4px;
  font-size: 12px;
}

.nt-reply-banner-label {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-regular);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.nt-reply-banner-preview {
  color: var(--el-text-color-placeholder);
  font-style: italic;
}

.nt-reply-banner-dismiss {
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  font-size: 13px;
  padding: 0 2px;
  line-height: 1;
}
.nt-reply-banner-dismiss:hover {
  color: var(--el-text-color-primary);
}

.nt-compose-error {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: #ef4444;
}

.nt-compose-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}

.nt-charcount {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-right: auto;
}

.nt-send-btn {
  padding: 4px 12px;
  border-radius: 5px;
  border: none;
  background: #6366f1;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}
.nt-send-btn:hover:not(:disabled) {
  background: #4338ca;
}
.nt-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Scroll-flash highlight ─────────────────────────────────────────────── */
@keyframes nt-flash {
  0% {
    background: rgba(99, 102, 241, 0.22);
  }
  100% {
    background: transparent;
  }
}

/* Highlight class is added/removed by scrollToNote() via classList */
:global(.nt-note-flash) {
  animation: nt-flash 1.5s ease-out forwards;
  border-radius: 8px;
}

/* ── Dark theme ─────────────────────────────────────────────────────────── */
:root.dark-theme .nt-avatar--admin {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}
:root.dark-theme .nt-avatar--reporter {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}
:root.dark-theme .nt-author {
  color: #e5e7eb;
}
:root.dark-theme .nt-item--admin .nt-text {
  background: rgba(59, 130, 246, 0.12);
  color: #bfdbfe;
}
:root.dark-theme .nt-item--reporter .nt-text {
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}
:root.dark-theme .nt-reaction-picker {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .nt-reaction-picker-btn:hover {
  background: #374151;
}
:root.dark-theme .nt-reaction-picker-btn.is-selected {
  background: #312e81;
  border-color: #6366f1;
}
:root.dark-theme .nt-reaction-chip {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .nt-reaction-chip:hover {
  border-color: #6366f1;
  background: #312e81;
}
:root.dark-theme .nt-reaction-chip.is-mine {
  border-color: #6366f1;
  background: #312e81;
}
:root.dark-theme .nt-img-thumb {
  border-color: #4b5563;
}
:root.dark-theme .nt-quote {
  background: rgba(99, 102, 241, 0.12);
  border-color: #818cf8;
}
:root.dark-theme .nt-quote-author {
  color: #a5b4fc;
}
:root.dark-theme .nt-reply-banner {
  background: rgba(99, 102, 241, 0.15);
  border-color: #818cf8;
}
:root.dark-theme .nt-action-btn:hover {
  background: #374151;
  border-color: #4b5563;
  color: #e5e7eb;
}
:root.dark-theme .nt-action-btn--del:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}
</style>
