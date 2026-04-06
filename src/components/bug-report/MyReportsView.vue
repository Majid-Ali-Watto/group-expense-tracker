<template>
  <div class="bug-my-reports">
    <div v-if="myReportsLoading" class="bug-mr-loading">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="!myReports.length" class="bug-mr-empty">
      <ClipboardDocumentIcon class="w-10 h-10" />
      <p>You haven't submitted any bug reports yet.</p>
    </div>
    <div v-else class="bug-mr-list">
      <div
        v-for="r in myReports"
        :key="r.id"
        class="bug-mr-card"
        :class="`mr-sev-${r.severity}`"
      >
        <!-- Top row: badges + actions -->
        <div class="bug-mr-top">
          <div class="bug-mr-badges">
            <span class="bug-mr-badge" :class="`mr-badge-${r.status}`">
              {{ statusLabel[r.status] ?? r.status }}
            </span>
            <span
              class="bug-mr-sev-badge"
              :class="`mr-sev-badge-${r.severity}`"
            >
              {{ r.severity }}
            </span>
            <span class="bug-mr-cat">{{ r.category }}</span>
          </div>
          <div class="bug-mr-actions">
            <!-- Re-open — only for resolved -->
            <button
              v-if="r.status === 'resolved'"
              class="bug-mr-action-btn reopen"
              title="Re-open"
              :disabled="actionLoading === r.id"
              @click="$emit('reopen', r)"
            >
              <RefreshIcon class="w-4 h-4" />
            </button>
            <!-- Edit -->
            <button
              class="bug-mr-action-btn edit"
              title="Edit"
              :disabled="actionLoading === r.id"
              @click="$emit('edit', r)"
            >
              <EditIcon class="w-4 h-4" />
            </button>
            <!-- Delete -->
            <button
              class="bug-mr-action-btn delete"
              title="Delete"
              :disabled="actionLoading === r.id"
              @click="$emit('delete', r)"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
            <!-- Expand / Collapse -->
            <button
              class="bug-mr-action-btn expand"
              :title="expandedIds.has(r.id) ? 'Collapse' : 'View details'"
              @click="$emit('toggle-expand', r.id)"
            >
              <ChevronDownIcon
                class="w-4 h-4 expand-icon"
                :class="{ 'is-open': expandedIds.has(r.id) }"
              />
            </button>
          </div>
        </div>

        <!-- Title -->
        <p v-if="r.bugNumber" class="bug-mr-number">#{{ r.bugNumber }}</p>
        <div class="bug-mr-title-row">
          <p class="bug-mr-title">{{ r.title }}</p>
          <button
            class="bug-mr-copy-btn"
            title="Copy title"
            @click.stop="copyText(r.title)"
          >
            <CopyIcon class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Expanded details -->
        <template v-if="expandedIds.has(r.id)">
          <div class="bug-mr-desc-row">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div
              class="bug-mr-desc"
              v-html="markdownToHtml(r.description)"
            ></div>
            <button
              class="bug-mr-copy-btn bug-mr-copy-btn--desc"
              title="Copy description"
              @click.stop="copyText(r.description)"
            >
              <CopyIcon class="w-3.5 h-3.5" />
            </button>
          </div>
          <div v-if="r.screenshots?.length" class="bug-mr-screenshots">
            <div v-for="(ss, i) in r.screenshots" :key="i" class="bug-mr-thumb">
              <img :src="ss.url" :alt="`Screenshot ${i + 1}`" />
              <span class="bug-mr-thumb-overlay">
                <a
                  :href="ss.url"
                  target="_blank"
                  rel="noopener"
                  class="bug-mr-img-action-btn"
                  title="Open"
                >
                  <ExternalLinkIcon class="w-3.5 h-3.5" />
                </a>
                <button
                  class="bug-mr-img-action-btn"
                  title="Download"
                  @click.prevent="downloadImage(ss.url, `screenshot-${i + 1}`)"
                >
                  <DownloadIcon class="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          </div>

          <!-- Notes thread -->
          <div class="bug-mr-notes">
            <button
              class="bug-mr-notes-toggle"
              @click="$emit('toggle-notes', r.id)"
            >
              <span class="bug-mr-notes-toggle-left">
                <ChatBubbleIcon class="w-3.5 h-3.5" />
                Notes{{ notesOf(r).length ? ` (${notesOf(r).length})` : '' }}
              </span>
              <ChevronDownIcon
                class="bug-mr-notes-chevron"
                :class="{ 'is-open': notesOpen.has(r.id) }"
              />
            </button>

            <div v-if="notesOpen.has(r.id)" class="bug-mr-notes-body">
              <NoteThread
                :notes="notesOf(r)"
                id-prefix="bug-mr-note"
                :avatar-char-fn="
                  (note) =>
                    (note.authorType === 'admin' ? 'A' : note.authorName || '?')
                      .charAt(0)
                      .toUpperCase()
                "
                :author-label-fn="
                  (note) => (note.authorType === 'admin' ? 'Admin' : 'You')
                "
                :can-edit="(note) => note.authorType === 'reporter'"
                :can-delete="(note) => note.authorType === 'reporter'"
                :is-reacted-by-me="
                  (note, emoji) => !!note.reactions?.[emoji]?.[currentUserId]
                "
                :reactions-of="reactionsOf"
                :open-reaction-picker="openReactionPicker"
                :reaction-picker-align="reactionPickerAlign"
                :replying-to="replyingTo?.reportId === r.id ? replyingTo : null"
                :note-editing-id="noteEditingId"
                :note-edit-text="noteEditText"
                :note-edit-error="noteEditError"
                :note-edit-saving-id="noteEditSavingId"
                :compose-text="replyInputs[r.id] || ''"
                :compose-error="replyErrors[r.id] || ''"
                :compose-placeholder="
                  notesOf(r).length
                    ? 'Reply to admin… Ctrl+Enter to send'
                    : 'Add a comment for admin…'
                "
                :sending="replySavingId === r.id"
                @toggle-picker="
                  (noteId, event) => $emit('toggle-picker', noteId, event)
                "
                @toggle-reaction="
                  (note, emoji) => $emit('toggle-reaction', r, note, emoji)
                "
                @reply="(note) => $emit('reply', r.id, note)"
                @cancel-reply="$emit('cancel-reply')"
                @scroll-to="$emit('scroll-to', $event)"
                @start-edit="$emit('start-edit', $event)"
                @cancel-edit="$emit('cancel-edit')"
                @save-edit="(note, text) => $emit('save-edit', r, note, text)"
                @delete="(note) => $emit('delete-note', r, note)"
                @update:compose-text="
                  (val) => $emit('update:compose-text', r.id, val)
                "
                @send="$emit('send', r)"
                @editor-mounted="(el) => $emit('editor-mounted', r.id, el)"
              />
            </div>
          </div>
        </template>

        <!-- Footer -->
        <p class="bug-mr-date">Submitted {{ formatDate(r.submittedAt) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { NoteThread } from '@/components/bug-reports'
import {
  ChatBubbleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  CopyIcon,
  DownloadIcon,
  EditIcon,
  ExternalLinkIcon,
  RefreshIcon,
  TrashIcon
} from '@/components/icons'

defineProps({
  myReports: { type: Array, default: () => [] },
  myReportsLoading: { type: Boolean, default: false },
  expandedIds: { type: Object, required: true }, // Set
  actionLoading: { type: [String, null], default: null },
  statusLabel: { type: Object, default: () => ({}) },
  notesOpen: { type: Object, required: true }, // Set
  currentUserId: { type: String, default: '' },
  // NoteThread state
  replyInputs: { type: Object, default: () => ({}) },
  replyErrors: { type: Object, default: () => ({}) },
  replySavingId: { type: [String, null], default: null },
  replyEditorRefs: { type: Object, default: () => ({}) },
  openReactionPicker: { type: [String, null], default: null },
  reactionPickerAlign: { type: String, default: 'left' },
  replyingTo: { type: Object, default: null },
  noteEditingId: { type: [String, null], default: null },
  noteEditText: { type: String, default: '' },
  noteEditError: { type: String, default: '' },
  noteEditSavingId: { type: [String, null], default: null },
  reactionsOf: { type: Function, required: true },
  notesOf: { type: Function, required: true },
  // Utility functions
  markdownToHtml: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  copyText: { type: Function, required: true },
  downloadImage: { type: Function, required: true }
})

defineEmits([
  'reopen',
  'edit',
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
.bug-my-reports {
  margin-bottom: 24px;
}

.bug-mr-loading {
  padding: 8px 0;
}

.bug-mr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 24px;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13.5px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
}

.bug-mr-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bug-mr-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color);
  border-left: 4px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  transition: box-shadow 0.15s;
}
.bug-mr-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
}

.mr-sev-critical {
  border-left-color: #ef4444;
}
.mr-sev-high {
  border-left-color: #f97316;
}
.mr-sev-medium {
  border-left-color: #f59e0b;
}
.mr-sev-low {
  border-left-color: #22c55e;
}

.bug-mr-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.bug-mr-badges {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.bug-mr-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  text-transform: capitalize;
}
.mr-badge-open {
  background: #fee2e2;
  color: #b91c1c;
}
.mr-badge-in-progress {
  background: #fef9c3;
  color: #92400e;
}
.mr-badge-needs-info {
  background: #dbeafe;
  color: #1e40af;
}
.mr-badge-duplicate {
  background: #f3e8ff;
  color: #6b21a8;
}
.mr-badge-wont-fix {
  background: #f1f5f9;
  color: #475569;
}
.mr-badge-resolved {
  background: #dcfce7;
  color: #166534;
}
.mr-badge-closed {
  background: #e2e8f0;
  color: #334155;
}

.bug-mr-sev-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.mr-sev-badge-critical {
  background: #fee2e2;
  color: #b91c1c;
}
.mr-sev-badge-high {
  background: #ffedd5;
  color: #c2410c;
}
.mr-sev-badge-medium {
  background: #fef9c3;
  color: #92400e;
}
.mr-sev-badge-low {
  background: #dcfce7;
  color: #166534;
}

.bug-mr-cat {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--el-fill-color);
  text-transform: capitalize;
}

.bug-mr-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bug-mr-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--el-text-color-regular);
}
.bug-mr-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.bug-mr-action-btn.reopen:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #eef2ff;
}
.bug-mr-action-btn.edit:hover {
  border-color: #f59e0b;
  color: #b45309;
  background: #fffbeb;
}
.bug-mr-action-btn.delete:hover {
  border-color: #ef4444;
  color: #b91c1c;
  background: #fee2e2;
}
.bug-mr-action-btn.expand:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.expand-icon {
  transition: transform 0.2s;
}
.expand-icon.is-open {
  transform: rotate(180deg);
}

/* ── Title / desc copy rows ─────────────────────────────────── */
.bug-mr-title-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}

.bug-mr-desc-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.bug-mr-copy-btn {
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
.bug-mr-copy-btn:hover {
  background: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}
.bug-mr-copy-btn--desc {
  margin-top: 3px;
}

/* Image action buttons on screenshots */
.bug-mr-img-action-btn {
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
.bug-mr-img-action-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.bug-mr-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.bug-mr-number {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #2563eb;
  margin: 0;
}

.bug-mr-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.bug-mr-desc :deep(p) {
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.bug-mr-desc :deep(strong) {
  font-weight: 600;
}
.bug-mr-desc :deep(em) {
  font-style: italic;
}
.bug-mr-desc :deep(code) {
  font-family: monospace;
  font-size: 12px;
  background: var(--el-fill-color);
  padding: 1px 4px;
  border-radius: 3px;
}
.bug-mr-desc :deep(pre) {
  margin: 4px 0 6px;
  border-radius: 6px;
  overflow-x: auto;
  background: var(--el-fill-color);
  padding: 10px 12px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
}
.bug-mr-desc :deep(ul) {
  margin: 4px 0 6px 0;
  padding-left: 18px;
  list-style-type: disc;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.bug-mr-desc :deep(ol) {
  margin: 4px 0 6px 0;
  padding-left: 22px;
  list-style-type: decimal;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.bug-mr-desc :deep(li) {
  margin: 2px 0;
}
.bug-mr-desc :deep(br) {
  display: block;
  content: '';
  margin-top: 4px;
}

.bug-mr-screenshots {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bug-mr-thumb {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  display: block;
  flex-shrink: 0;
}
.bug-mr-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bug-mr-thumb-overlay {
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
.bug-mr-thumb:hover .bug-mr-thumb-overlay {
  opacity: 1;
}

.bug-mr-date {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}

/* Notes thread */
.bug-mr-notes {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color);
}

.bug-mr-notes-toggle {
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

.bug-mr-notes-toggle-left {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bug-mr-notes-chevron {
  width: 14px;
  height: 14px;
  color: var(--el-text-color-placeholder);
  transition: transform 0.2s;
  flex-shrink: 0;
}
.bug-mr-notes-chevron.is-open {
  transform: rotate(180deg);
}

.bug-mr-notes-body {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Dark theme */
:root.dark-theme .bug-mr-card {
  background: #1f2937;
  border-color: #374151;
}
:root.dark-theme .bug-mr-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
:root.dark-theme .bug-mr-number {
  color: #93c5fd;
}
:root.dark-theme .bug-mr-title {
  color: #f3f4f6;
}
:root.dark-theme .bug-mr-desc {
  color: #d1d5db;
}
:root.dark-theme .bug-mr-cat {
  background: #374151;
  color: #9ca3af;
}

:root.dark-theme .bug-mr-action-btn {
  border-color: #4b5563;
  color: #9ca3af;
}
:root.dark-theme .bug-mr-action-btn.reopen:hover {
  background: rgba(99, 102, 241, 0.15);
}
:root.dark-theme .bug-mr-action-btn.edit:hover {
  background: rgba(245, 158, 11, 0.15);
}
:root.dark-theme .bug-mr-action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.15);
}

:root.dark-theme .bug-mr-badge.mr-badge-open {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}
:root.dark-theme .bug-mr-badge.mr-badge-in-progress {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}
:root.dark-theme .bug-mr-badge.mr-badge-needs-info {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}
:root.dark-theme .bug-mr-badge.mr-badge-duplicate {
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
}
:root.dark-theme .bug-mr-badge.mr-badge-wont-fix {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}
:root.dark-theme .bug-mr-badge.mr-badge-resolved {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}
:root.dark-theme .bug-mr-badge.mr-badge-closed {
  background: rgba(100, 116, 139, 0.2);
  color: #94a3b8;
}

:root.dark-theme .bug-mr-sev-badge {
  background: #374151;
  color: #9ca3af;
}
:root.dark-theme .bug-mr-sev-badge.mr-sev-badge-critical {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}
:root.dark-theme .bug-mr-sev-badge.mr-sev-badge-high {
  background: rgba(249, 115, 22, 0.2);
  color: #fdba74;
}
:root.dark-theme .bug-mr-sev-badge.mr-sev-badge-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}
:root.dark-theme .bug-mr-sev-badge.mr-sev-badge-low {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}
</style>
