<template>
  <div class="bug-page">
    <BugReportHeader
      :active-view="activeView"
      :report-count="myReports.length"
      @update:active-view="activeView = $event"
    />

    <BugReportSuccess
      v-if="activeView === 'form' && submitted"
      :bug-number="lastSubmittedBugNumber"
      @reset="resetForm"
    />

    <BugReportTips v-if="activeView === 'form' && !submitted" />

    <BugReportForm
      v-if="activeView === 'form' && !submitted"
      ref="formRef"
      :form="form"
      :categories="categories"
      :rules="rules"
      :severities="severities"
      :screenshots="screenshots"
      :upload-progress="uploadProgress"
      :is-clean="isClean"
      :submitting="submitting"
      :uploading-screenshots="uploadingScreenshots"
      :max-screenshots="MAX_SCREENSHOTS"
      :max-size-mb="MAX_SIZE_MB"
      :format-size="formatSize"
      @update:form="form = $event"
      @submit="submitReport"
      @reset="resetForm"
      @apply-template="applyTemplate"
      @file-change="handleFileChange"
      @remove-screenshot="removeScreenshot"
    />

    <MyReportsView
      v-if="activeView === 'my-reports'"
      :my-reports="myReports"
      :my-reports-loading="myReportsLoading"
      :expanded-ids="expandedIds"
      :action-loading="actionLoading"
      :status-label="statusLabel"
      :notes-open="notesOpen"
      :current-user-id="authStore.getActiveUserUid"
      :reply-inputs="replyInputs"
      :reply-errors="replyErrors"
      :reply-saving-id="replySavingId"
      :reply-editor-refs="replyEditorRefs"
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
      @reopen="reopenReport"
      @edit="openEdit"
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
            note.authorType === 'admin' ? 'Admin' : 'You'
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
          replyInputs[reportId] = val
          replyErrors[reportId] = ''
        }
      "
      @send="addReporterReply"
      @editor-mounted="
        (reportId, el) => {
          if (el) replyEditorRefs[reportId] = el
        }
      "
    />

    <BugReportEditDialog
      ref="editFormRef"
      :visible="editDialogVisible"
      :edit-form="editForm"
      :edit-new-screenshots="editNewScreenshots"
      :edit-saving="editSaving"
      :categories="categories"
      :rules="rules"
      :severities="severities"
      :max-screenshots="MAX_SCREENSHOTS"
      :format-size="formatSize"
      @update:visible="editDialogVisible = $event"
      @update:edit-form="editForm = $event"
      @save="saveEdit"
      @reset="resetEdit"
      @close="closeEdit"
      @remove-existing-screenshot="removeExistingScreenshot"
      @file-change="handleEditFileChange"
      @remove-new-screenshot="removeEditNewScreenshot"
    />
  </div>
</template>

<script setup>
import BugReportHeader from './BugReportHeader.vue'
import BugReportSuccess from './BugReportSuccess.vue'
import BugReportTips from './BugReportTips.vue'
import BugReportForm from './BugReportForm.vue'
import MyReportsView from './MyReportsView.vue'
import BugReportEditDialog from './BugReportEditDialog.vue'
import {
  BugReport,
  markdownToHtml,
  formatDate,
  copyText,
  downloadImage,
  notesOf
} from '@/scripts/bug-reports'

const props = defineProps({
  view: { type: String, default: 'form' },
  openBugId: { type: String, default: null }
})

const {
  authStore,
  activeView,
  form,
  formRef,
  submitting,
  uploadingScreenshots,
  submitted,
  lastSubmittedBugNumber,
  screenshots,
  uploadProgress,
  isClean,
  categories,
  rules,
  applyTemplate,
  formatSize,
  handleFileChange,
  removeScreenshot,
  resetForm,
  submitReport,
  myReports,
  myReportsLoading,
  expandedIds,
  actionLoading,
  toggleExpand,
  deleteReport,
  reopenReport,
  editDialogVisible,
  editFormRef,
  editForm,
  editNewScreenshots,
  editSaving,
  openEdit,
  closeEdit,
  removeExistingScreenshot,
  handleEditFileChange,
  removeEditNewScreenshot,
  saveEdit,
  resetEdit,
  replyInputs,
  replyErrors,
  replySavingId,
  notesOpen,
  replyEditorRefs,
  toggleNotes,
  addReporterReply,
  openReactionPicker,
  reactionPickerAlign,
  replyingTo,
  noteEditingId,
  noteEditText,
  noteEditError,
  noteEditSavingId,
  togglePickerOpen,
  startReply,
  cancelReply,
  scrollToNote,
  startNoteEdit,
  cancelNoteEdit,
  saveNoteEdit,
  deleteNote,
  toggleReaction,
  reactionsOf,
  MAX_SCREENSHOTS,
  SEVERITIES,
  STATUS_LABEL
} = BugReport(props)

const statusLabel = STATUS_LABEL
const severities = SEVERITIES
const MAX_SIZE_MB = 2
</script>

<style scoped>
.bug-page {
  max-width: 720px;
  margin: 0 auto;
  /* padding: 8px; */
}
</style>
