<template>
  <div>
    <BugReportHeader
      :active-view="activeView"
      :report-count="myReports.length"
      @update:active-view="activeView = $event"
    />

    <BugReportSuccess
      v-if="activeView === 'form' && submitted"
      :bug-number="lastSubmittedIssueKey"
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
      :markdown-to-html="markdownToHtml"
      :format-date="formatDate"
      :copy-text="copyText"
      :download-image="downloadImage"
      @reopen="reopenReport"
      @edit="openEdit"
      @delete="deleteReport"
      @toggle-expand="toggleExpand"
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
import { BugReport, markdownToHtml, formatDate, copyText, downloadImage } from '@/scripts/bug-reports'

const props = defineProps({
  view: { type: String, default: 'form' },
  openBugId: { type: String, default: null }
})

const {
  activeView,
  form,
  formRef,
  submitting,
  uploadingScreenshots,
  submitted,
  lastSubmittedIssueKey,
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
  resetEdit,
  removeExistingScreenshot,
  handleEditFileChange,
  removeEditNewScreenshot,
  saveEdit,
  MAX_SCREENSHOTS,
  SEVERITIES
} = BugReport(props)

const severities = SEVERITIES
const MAX_SIZE_MB = 2
</script>
