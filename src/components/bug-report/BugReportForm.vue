<template>
  <el-form
    ref="localFormRef"
    :model="form"
    :rules="rules"
    label-position="top"
    class="bug-form"
  >
    <el-form-item label="Bug category" prop="category">
      <el-select
        :model-value="form.category"
        placeholder="Select a category"
        class="w-full"
        @update:model-value="
          $emit('update:form', { ...form, category: $event })
        "
      >
        <el-option
          v-for="cat in categories"
          :key="cat.value"
          :label="cat.label"
          :value="cat.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="Title" prop="title">
      <el-input
        :model-value="form.title"
        placeholder="Brief summary of the issue"
        maxlength="120"
        show-word-limit
        @update:model-value="$emit('update:form', { ...form, title: $event })"
      />
    </el-form-item>

    <el-form-item label="Description" prop="description">
      <MarkdownEditor
        :model-value="form.description"
        :rows="8"
        placeholder="Describe what happened, what you expected, and the steps to reproduce."
        :maxlength="1000"
        :show-word-limit="true"
        :show-template="true"
        @update:model-value="
          $emit('update:form', { ...form, description: $event })
        "
        @template="$emit('apply-template')"
      />
    </el-form-item>

    <GenericDropDown
      :model-value="form.severity"
      label="Severity"
      :options="severities"
      placeholder="Select severity"
      :filterable="false"
      :clearable="false"
      select-class="w-full"
      @update:model-value="$emit('update:form', { ...form, severity: $event })"
    />

    <!-- Screenshots upload -->
    <el-form-item label="Screenshots">
      <div class="bug-upload-area">
        <p class="bug-upload-hint">
          Up to {{ maxScreenshots }} images &nbsp;·&nbsp; JPG, PNG, WebP, GIF
          &nbsp;·&nbsp; Max {{ maxSizeMb }}MB each
        </p>

        <label
          class="bug-upload-btn"
          :class="{
            'is-disabled': screenshots.length >= maxScreenshots || submitting
          }"
        >
          <PhotoIcon class="w-4 h-4" />
          Attach Screenshot
          <input
            ref="localFileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            :disabled="screenshots.length >= maxScreenshots || submitting"
            @change="$emit('file-change', $event)"
          />
        </label>

        <!-- File list -->
        <div v-if="screenshots.length" class="bug-file-list">
          <div v-for="(item, i) in screenshots" :key="i" class="bug-file-item">
            <img
              :src="item.preview"
              class="bug-file-thumb"
              :alt="item.file.name"
            />
            <div class="bug-file-info">
              <span class="bug-file-name">{{ item.file.name }}</span>
              <span class="bug-file-size">{{
                formatSize(item.file.size)
              }}</span>
            </div>
            <button
              type="button"
              class="bug-file-remove"
              :disabled="submitting"
              @click="$emit('remove-screenshot', i)"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Upload progress -->
        <div v-if="uploadProgress.length" class="bug-upload-progress">
          <div
            v-for="(p, i) in uploadProgress"
            :key="i"
            class="bug-progress-row"
          >
            <span class="bug-progress-name">{{ p.name }}</span>
            <el-progress
              :percentage="p.percent"
              :status="p.status"
              size="small"
              class="flex-1"
            />
          </div>
        </div>
      </div>
    </el-form-item>

    <div class="bug-form-actions">
      <GenericButton
        size="small"
        type="default"
        :disabled="isClean || submitting"
        @click="$emit('reset')"
        >Reset</GenericButton
      >
      <GenericButton
        size="small"
        type="warning"
        :loading="submitting"
        @click="$emit('submit')"
      >
        {{
          submitting
            ? uploadingScreenshots
              ? 'Uploading screenshots…'
              : 'Submitting…'
            : 'Submit Report'
        }}
      </GenericButton>
    </div>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'
import { PhotoIcon, XIcon } from '@/components/icons'
import {
  GenericDropDown,
  GenericButton,
  MarkdownEditor
} from '@/components/generic-components'

const localFormRef = ref(null)
const localFileInputRef = ref(null)

defineExpose({
  validate: (...a) => localFormRef.value?.validate(...a),
  clearValidate: () => localFormRef.value?.clearValidate(),
  clearFileInput: () => {
    if (localFileInputRef.value) localFileInputRef.value.value = ''
  }
})

defineProps({
  form: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  rules: { type: Object, default: () => ({}) },
  severities: { type: Array, default: () => [] },
  screenshots: { type: Array, default: () => [] },
  uploadProgress: { type: Array, default: () => [] },
  isClean: { type: Boolean, default: true },
  submitting: { type: Boolean, default: false },
  uploadingScreenshots: { type: Boolean, default: false },
  maxScreenshots: { type: Number, default: 5 },
  maxSizeMb: { type: Number, default: 2 },
  formatSize: { type: Function, required: true }
})

defineEmits([
  'update:form',
  'submit',
  'reset',
  'apply-template',
  'file-change',
  'remove-screenshot'
])
</script>

<style scoped>
/* Form */
.bug-form {
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-top: none;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  background: var(--el-fill-color-blank);
  margin-bottom: 24px;
}

/* Screenshot upload */
.bug-upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bug-upload-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}

.bug-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
  align-self: flex-start;
}

.bug-upload-btn:hover:not(.is-disabled) {
  border-color: #f97316;
  color: #f97316;
}

.bug-upload-btn.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hidden {
  display: none;
}

.bug-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bug-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.bug-file-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color);
}

.bug-file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bug-file-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bug-file-size {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.bug-file-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.bug-file-remove:hover:not(:disabled) {
  background: #fee2e2;
  color: #ef4444;
}

.bug-file-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bug-upload-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bug-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bug-progress-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

/* Form actions */
.bug-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

/* Dark theme */
:root.dark-theme .bug-form {
  background: #1f2937;
  border-color: #374151;
}

:root.dark-theme .bug-reporter-notice {
  background: rgba(29, 78, 216, 0.1);
  border-color: #1e40af;
  color: #93c5fd;
}

:root.dark-theme .bug-upload-btn {
  border-color: #4b5563;
  color: #d1d5db;
}
:root.dark-theme .bug-upload-btn:hover:not(.is-disabled) {
  border-color: #f97316;
  color: #f97316;
}

:root.dark-theme .bug-file-item {
  background: #374151;
  border-color: #4b5563;
}
:root.dark-theme .bug-file-name {
  color: #e5e7eb;
}
:root.dark-theme .bug-file-size {
  color: #9ca3af;
}
:root.dark-theme .bug-file-remove:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
}
</style>
