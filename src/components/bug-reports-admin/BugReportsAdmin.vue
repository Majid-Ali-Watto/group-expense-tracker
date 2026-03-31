<template>
  <div class="bra-page">
    <AdminHeader
      :total-count="totalCount"
      :open-count="openCount"
      :loading="loading"
      @refresh="refreshReports"
    />

    <AdminFiltersBar
      :active-status-filter="activeStatusFilter"
      :active-severity-filter="activeSeverityFilter"
      :search-query="searchQuery"
      :status-filters="statusFilters"
      :severity-options="severityOptions"
      @update:active-status-filter="activeStatusFilter = $event"
      @update:active-severity-filter="activeSeverityFilter = $event"
      @update:search-query="searchQuery = $event"
    />

    <!-- Loading -->
    <div v-if="loading" class="bra-loading">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredReports.length" class="bra-empty">
      <svg
        class="w-12 h-12 bra-empty-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>No bug reports match the current filter.</p>
    </div>

    <!-- Report list -->
    <div v-else class="bra-list">
      <AdminReportCard
        v-for="report in filteredReports"
        :key="report.id"
        :report="report"
        :expanded-ids="expandedIds"
        :deleting-id="deletingId"
        :status-options="statusOptions"
        :notes-open="notesOpen"
        :note-inputs="noteInputs"
        :note-errors="noteErrors"
        :note-saving-id="noteSavingId"
        :open-reaction-picker="openReactionPicker"
        :reaction-picker-align="reactionPickerAlign"
        :replying-to="replyingTo"
        :note-editing-id="noteEditingId"
        :note-edit-text="noteEditText"
        :note-edit-error="noteEditError"
        :note-edit-saving-id="noteEditSavingId"
        :reactions-of="reactionsOf"
        :notes-of="notesOf"
        :markdown-to-html="markdownToHtml"
        :format-date="formatDate"
        :copy-text="copyText"
        :download-image="downloadImage"
        @update-status="updateStatus"
        @delete="deleteReport"
        @toggle-expand="toggleExpand"
        @toggle-notes="toggleNotes"
        @toggle-picker="(noteId, event) => togglePickerOpen(noteId, event)"
        @toggle-reaction="(r, note, emoji) => toggleReaction(r, note, emoji)"
        @reply="
          (reportId, note) =>
            startReply(
              reportId,
              note,
              note.authorType === 'admin' ? 'Admin' : note.authorName
            )
        "
        @cancel-reply="cancelReply"
        @scroll-to="scrollToNote"
        @start-edit="startNoteEdit"
        @cancel-edit="cancelNoteEdit"
        @save-edit="(r, note, text) => saveNoteEdit(r, note, text)"
        @delete-note="(r, note) => deleteNote(r, note)"
        @update:compose-text="
          (reportId, val) => {
            noteInputs[reportId] = val
            noteErrors[reportId] = ''
          }
        "
        @send="addAdminNote"
        @editor-mounted="
          (reportId, el) => {
            if (el) noteEditorRefs[reportId] = el
          }
        "
      />
    </div>
  </div>
</template>

<script setup>
import AdminHeader from './AdminHeader.vue'
import AdminFiltersBar from './AdminFiltersBar.vue'
import AdminReportCard from './AdminReportCard.vue'
import {
  BugReportsAdmin,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
  markdownToHtml,
  formatDate,
  copyText,
  downloadImage,
  notesOf
} from '@/scripts/bug-reports'

const {
  loading,
  filteredReports,
  totalCount,
  openCount,
  activeStatusFilter,
  activeSeverityFilter,
  searchQuery,
  statusFilters,
  expandedIds,
  deletingId,
  noteInputs,
  noteErrors,
  noteSavingId,
  notesOpen,
  noteEditorRefs,
  openReactionPicker,
  reactionPickerAlign,
  replyingTo,
  noteEditingId,
  noteEditText,
  noteEditError,
  noteEditSavingId,
  fetchReports: refreshReports,
  toggleExpand,
  updateStatus,
  deleteReport,
  toggleNotes,
  addAdminNote,
  togglePickerOpen,
  startReply,
  cancelReply,
  scrollToNote,
  startNoteEdit,
  cancelNoteEdit,
  saveNoteEdit,
  deleteNote,
  toggleReaction,
  reactionsOf
} = BugReportsAdmin()

const statusOptions = STATUS_OPTIONS
const severityOptions = SEVERITY_OPTIONS
</script>

<style scoped>
.bra-page {
  /* max-width: 860px; */
  margin: 0 auto;
  /* padding: 20px 8px 48px; */
}

.bra-loading {
  padding: 16px;
}

.bra-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.bra-empty-icon {
  color: #22c55e;
  opacity: 0.6;
}

.bra-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
