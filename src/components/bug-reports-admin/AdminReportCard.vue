<template>
  <div class="bra-card" :class="`card-sev-${report.severity}`">
    <!-- Card header row -->
    <div class="bra-card-top">
      <div class="bra-card-badges">
        <span v-if="report.bugNumber" class="bra-bug-number-badge"
          >#{{ report.bugNumber }}</span
        >
        <span class="bra-sev-badge" :class="`badge-${report.severity}`">
          <span class="sev-dot" />{{ report.severity }}
        </span>
        <span class="bra-cat-badge">{{ report.category }}</span>
      </div>

      <!-- Status selector + delete -->
      <div class="bra-card-top-right">
        <el-select
          :model-value="report.status"
          size="small"
          class="bra-status-select"
          :class="`status-${report.status}`"
          @change="(val) => $emit('update-status', report.id, val)"
        >
          <el-option
            v-for="opt in statusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <button
          class="bra-delete-btn"
          title="Delete report"
          :disabled="deletingId === report.id"
          @click="$emit('delete', report)"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Title + description -->
    <div class="bra-card-title-row">
      <p class="bra-card-title">{{ report.title }}</p>
      <button
        class="bra-copy-btn"
        title="Copy title"
        @click.stop="copyText(report.title)"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
    <div class="bra-card-desc-row">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        class="bra-card-desc"
        :class="{ 'is-expanded': expandedIds.has(report.id) }"
        v-html="markdownToHtml(report.description)"
      ></div>
      <button
        class="bra-copy-btn bra-copy-btn--desc"
        title="Copy description"
        @click.stop="copyText(report.description)"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </button>
    </div>
    <GenericButton
      v-if="report.description.length > 160"
      type="default"
      size="small"
      class="bra-expand-btn"
      @click="$emit('toggle-expand', report.id)"
    >
      {{ expandedIds.has(report.id) ? 'Show less' : 'Show more' }}
    </GenericButton>

    <!-- Screenshots -->
    <div v-if="report.screenshots?.length" class="bra-screenshots">
      <div
        v-for="(ss, i) in report.screenshots"
        :key="i"
        class="bra-screenshot-thumb"
      >
        <img :src="ss.url" :alt="`Screenshot ${i + 1}`" />
        <span class="bra-screenshot-overlay">
          <a
            :href="ss.url"
            target="_blank"
            rel="noopener"
            class="bra-img-action-btn"
            title="Open"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <button
            class="bra-img-action-btn"
            title="Download"
            @click.prevent="downloadImage(ss.url, `screenshot-${i + 1}`)"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div class="bra-card-footer">
      <span class="bra-reporter">
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        {{ report.reporter?.name || 'Anonymous' }}
        <template v-if="report.reporter?.email">
          ·
          <a
            :href="`mailto:${report.reporter.email}`"
            class="bra-reporter-email"
            >{{ report.reporter.email }}</a
          >
        </template>
        <span v-if="report.reporter?.isGuest" class="bra-guest-badge"
          >guest</span
        >
      </span>
      <span class="bra-date">{{ formatDate(report.submittedAt) }}</span>
    </div>

    <!-- Notes thread (only for registered users) -->
    <div v-if="!report.reporter?.isGuest" class="bra-notes-section">
      <button
        class="bra-notes-toggle"
        @click="$emit('toggle-notes', report.id)"
      >
        <span class="bra-notes-toggle-left">
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Notes{{
            notesOf(report).length ? ` (${notesOf(report).length})` : ''
          }}
          <span v-if="report.hasReporterReply" class="bra-notes-new-badge"
            >&#128276; New reply</span
          >
        </span>
        <svg
          class="bra-notes-chevron"
          :class="{ 'is-open': notesOpen.has(report.id) }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div v-if="notesOpen.has(report.id)" class="bra-notes-body">
        <NoteThread
          :notes="notesOf(report)"
          id-prefix="bra-note"
          :avatar-char-fn="
            (note) => (note.authorName || '?').charAt(0).toUpperCase()
          "
          :author-label-fn="
            (note) => (note.authorType === 'admin' ? 'Admin' : note.authorName)
          "
          :can-edit="(note) => note.authorType === 'admin'"
          :can-delete="(note) => note.authorType === 'admin'"
          :is-reacted-by-me="
            (note, emoji) => !!note.reactions?.[emoji]?.['admin']
          "
          :reactions-of="reactionsOf"
          :open-reaction-picker="openReactionPicker"
          :reaction-picker-align="reactionPickerAlign"
          :replying-to="replyingTo?.reportId === report.id ? replyingTo : null"
          :note-editing-id="noteEditingId"
          :note-edit-text="noteEditText"
          :note-edit-error="noteEditError"
          :note-edit-saving-id="noteEditSavingId"
          :compose-text="noteInputs[report.id] || ''"
          :compose-error="noteErrors[report.id] || ''"
          compose-placeholder="Write a note… Ctrl+Enter to send"
          :sending="noteSavingId === report.id"
          @toggle-picker="
            (noteId, event) => $emit('toggle-picker', noteId, event)
          "
          @toggle-reaction="
            (note, emoji) => $emit('toggle-reaction', report, note, emoji)
          "
          @reply="(note) => $emit('reply', report.id, note)"
          @cancel-reply="$emit('cancel-reply')"
          @scroll-to="$emit('scroll-to', $event)"
          @start-edit="$emit('start-edit', $event)"
          @cancel-edit="$emit('cancel-edit')"
          @save-edit="(note, text) => $emit('save-edit', report, note, text)"
          @delete="(note) => $emit('delete-note', report, note)"
          @update:compose-text="
            (val) => $emit('update:compose-text', report.id, val)
          "
          @send="$emit('send', report)"
          @editor-mounted="(el) => $emit('editor-mounted', report.id, el)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { NoteThread } from '@/components/bug-reports'
import { GenericButton } from '@/components/generic-components'

defineProps({
  report: { type: Object, required: true },
  expandedIds: { type: Object, required: true }, // Set
  deletingId: { type: [String, null], default: null },
  statusOptions: { type: Array, default: () => [] },
  notesOpen: { type: Object, required: true }, // Set
  noteInputs: { type: Object, default: () => ({}) },
  noteErrors: { type: Object, default: () => ({}) },
  noteSavingId: { type: [String, null], default: null },
  openReactionPicker: { type: [String, null], default: null },
  reactionPickerAlign: { type: String, default: 'left' },
  replyingTo: { type: Object, default: null },
  noteEditingId: { type: [String, null], default: null },
  noteEditText: { type: String, default: '' },
  noteEditError: { type: String, default: '' },
  noteEditSavingId: { type: [String, null], default: null },
  reactionsOf: { type: Function, required: true },
  notesOf: { type: Function, required: true },
  markdownToHtml: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  copyText: { type: Function, required: true },
  downloadImage: { type: Function, required: true }
})

defineEmits([
  'update-status',
  'delete',
  'toggle-expand',
  'toggle-notes',
  'toggle-picker',
  'toggle-reaction',
  'reply',
  'cancel-reply',
  'scroll-to',
  'start-edit',
  'cancel-edit',
  'save-edit',
  'delete-note',
  'update:compose-text',
  'send',
  'editor-mounted'
])
</script>

<style scoped>
/* ── Card ────────────────────────────────────────────────────── */
.bra-card {
  padding: 16px 18px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
  border-left-width: 4px;
  transition: box-shadow 0.15s;
}

.bra-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}

.card-sev-critical {
  border-left-color: #ef4444;
}
.card-sev-high {
  border-left-color: #f97316;
}
.card-sev-medium {
  border-left-color: #f59e0b;
}
.card-sev-low {
  border-left-color: #22c55e;
}

.bra-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.bra-card-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.bra-bug-number-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  background: #e0e7ff;
  color: #3730a3;
  letter-spacing: 0.02em;
  user-select: all;
}

.bra-sev-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-critical {
  background: #fee2e2;
  color: #b91c1c;
}
.badge-high {
  background: #ffedd5;
  color: #c2410c;
}
.badge-medium {
  background: #fef9c3;
  color: #92400e;
}
.badge-low {
  background: #dcfce7;
  color: #166534;
}

.bra-cat-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
  text-transform: capitalize;
}

.sev-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
}

.bra-card-top-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Status select */
.bra-status-select {
  width: 145px;
}

:deep(.status-open .el-input__wrapper) {
  border-color: #ef4444 !important;
}
:deep(.status-in-progress .el-input__wrapper) {
  border-color: #f59e0b !important;
}
:deep(.status-needs-info .el-input__wrapper) {
  border-color: #3b82f6 !important;
}
:deep(.status-duplicate .el-input__wrapper) {
  border-color: #a855f7 !important;
}
:deep(.status-wont-fix .el-input__wrapper) {
  border-color: #94a3b8 !important;
}
:deep(.status-resolved .el-input__wrapper) {
  border-color: #22c55e !important;
}
:deep(.status-closed .el-input__wrapper) {
  border-color: #64748b !important;
}

.bra-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.bra-delete-btn:hover:not(:disabled) {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}
.bra-delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Title / desc copy rows */
.bra-card-title-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.bra-card-desc-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.bra-copy-btn {
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
.bra-copy-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}
.bra-copy-btn--desc {
  margin-top: 3px;
}

.bra-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 6px;
}

.bra-card-desc {
  font-size: 13.5px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bra-card-desc :deep(p) {
  margin: 0 0 4px;
}
.bra-card-desc :deep(strong) {
  font-weight: 600;
}
.bra-card-desc :deep(em) {
  font-style: italic;
}
.bra-card-desc :deep(code) {
  font-family: monospace;
  font-size: 12px;
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
}
.bra-card-desc :deep(pre) {
  margin: 4px 0 6px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--el-fill-color);
  padding: 10px 12px;
  white-space: pre-wrap;
}
.bra-card-desc :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 12px;
}
.bra-card-desc :deep(ul) {
  margin: 2px 0 4px 0;
  padding-left: 18px;
  list-style-type: disc;
}
.bra-card-desc :deep(ol) {
  margin: 2px 0 4px 0;
  padding-left: 22px;
  list-style-type: decimal;
}
.bra-card-desc :deep(li) {
  margin: 1px 0;
}

.bra-card-desc.is-expanded {
  display: block;
  -webkit-line-clamp: unset;
  line-clamp: unset;
  overflow: visible;
}

.bra-expand-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 12.5px;
  color: #6366f1;
  cursor: pointer;
  margin-bottom: 8px;
}
.bra-expand-btn:hover {
  text-decoration: underline;
}

/* Screenshots */
.bra-screenshots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.bra-screenshot-thumb {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  flex-shrink: 0;
  display: block;
}

.bra-screenshot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bra-screenshot-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}
.bra-screenshot-thumb:hover .bra-screenshot-overlay {
  opacity: 1;
}

.bra-img-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s;
  text-decoration: none;
}
.bra-img-action-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

/* Footer */
.bra-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}

.bra-reporter {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

.bra-reporter-email {
  color: #6366f1;
  text-decoration: none;
}
.bra-reporter-email:hover {
  text-decoration: underline;
}

.bra-guest-badge {
  display: inline-flex;
  padding: 1px 6px;
  border-radius: 8px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 10px;
  font-weight: 600;
}

.bra-date {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

/* Notes section */
.bra-notes-section {
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
}

.bra-notes-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  gap: 6px;
}

.bra-notes-toggle-left {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bra-notes-chevron {
  width: 14px;
  height: 14px;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.bra-notes-chevron.is-open {
  transform: rotate(180deg);
}

.bra-notes-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bra-notes-new-badge {
  font-size: 10px;
  font-weight: 600;
  background: #ef4444;
  color: #fff;
  border-radius: 999px;
  padding: 1px 7px;
  animation: bra-pulse 1.5s ease-in-out infinite;
}

@keyframes bra-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

/* Dark theme */
:root.dark-theme .bra-card {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .bra-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
:root.dark-theme .bra-card-title {
  color: #f3f4f6;
}
:root.dark-theme .bra-card-desc {
  color: #d1d5db;
}
:root.dark-theme .bra-bug-number-badge {
  background: #312e81;
  color: #a5b4fc;
}
:root.dark-theme .bra-cat-badge {
  background: #374151;
  color: #d1d5db;
}
:root.dark-theme .bra-delete-btn {
  border-color: #4b5563;
  color: #6b7280;
}
:root.dark-theme .bra-delete-btn:hover:not(:disabled) {
  border-color: #ef4444;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.15);
}
</style>
