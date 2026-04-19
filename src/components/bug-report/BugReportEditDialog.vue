<template>
  <el-dialog
    :model-value="visible"
    title="Edit Bug Report"
    :width="'min(95vw, 620px)'"
    append-to-body
    :close-on-click-modal="false"
    class="bug-edit-dialog"
    @close="$emit('close')"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      v-if="editForm"
      ref="localEditFormRef"
      :model="editForm"
      :rules="rules"
      label-position="top"
    >
      <el-form-item label="Bug category" prop="category">
        <el-select
          :model-value="editForm.category"
          class="w-full"
          @update:model-value="
            $emit('update:editForm', { ...editForm, category: $event })
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
          :model-value="editForm.title"
          maxlength="120"
          show-word-limit
          @update:model-value="
            $emit('update:editForm', { ...editForm, title: $event })
          "
        />
      </el-form-item>
      <el-form-item label="Description" prop="description">
        <MarkdownEditor
          :model-value="editForm.description"
          :rows="4"
          :maxlength="1000"
          :show-word-limit="true"
          @update:model-value="
            $emit('update:editForm', { ...editForm, description: $event })
          "
        />
      </el-form-item>
      <el-form-item label="Severity">
        <div class="bug-severity-group">
          <button
            v-for="s in severities"
            :key="s.value"
            type="button"
            class="bug-severity-btn"
            :class="{
              'is-active': editForm.severity === s.value,
              [`severity-${s.value}`]: true
            }"
            @click="
              $emit('update:editForm', { ...editForm, severity: s.value })
            "
          >
            <span class="severity-dot" />{{ s.label }}
          </button>
        </div>
      </el-form-item>

      <!-- Existing screenshots -->
      <el-form-item
        v-if="editForm.screenshots?.length"
        label="Current screenshots"
      >
        <div class="bug-edit-existing-screenshots">
          <div
            v-for="(ss, i) in editForm.screenshots"
            :key="ss.url"
            class="bug-edit-ss-item"
          >
            <AppImage
              :src="ss.url"
              class="bug-edit-ss-thumb"
              :alt="`Screenshot ${i + 1}`"
            />
            <button
              type="button"
              class="bug-edit-ss-remove"
              @click="$emit('remove-existing-screenshot', i)"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </el-form-item>

      <!-- Add more screenshots -->
      <el-form-item
        v-if="
          (editForm.screenshots?.length ?? 0) + editNewScreenshots.length <
          maxScreenshots
        "
        label="Add screenshots"
      >
        <label class="bug-upload-btn" :class="{ 'is-disabled': editSaving }">
          <PhotoIcon class="w-4 h-4" />
          Attach Screenshot
          <input
            ref="localEditFileInputRef"
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            :disabled="editSaving"
            @change="$emit('file-change', $event)"
          />
        </label>
        <div v-if="editNewScreenshots.length" class="bug-file-list mt-2">
          <div
            v-for="(item, i) in editNewScreenshots"
            :key="i"
            class="bug-file-item"
          >
            <AppImage
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
              @click="$emit('remove-new-screenshot', i)"
            >
              <XIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <GenericButton
        type="default"
        :disabled="editSaving"
        @click="$emit('reset')"
        >Reset</GenericButton
      >
      <GenericButton
        type="default"
        :disabled="editSaving"
        @click="$emit('close')"
        >Cancel</GenericButton
      >
      <GenericButton type="primary" :loading="editSaving" @click="$emit('save')"
        >Save changes</GenericButton
      >
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { PhotoIcon, XIcon } from '@/components/icons'
import {
  AppImage,
  MarkdownEditor,
  GenericButton
} from '@/components/generic-components'

const localEditFormRef = ref(null)
const localEditFileInputRef = ref(null)

defineExpose({
  validate: (...a) => localEditFormRef.value?.validate(...a),
  clearValidate: () => localEditFormRef.value?.clearValidate(),
  clearFileInput: () => {
    if (localEditFileInputRef.value) localEditFileInputRef.value.value = ''
  }
})

defineProps({
  visible: { type: Boolean, default: false },
  editForm: { type: Object, default: null },
  editNewScreenshots: { type: Array, default: () => [] },
  editSaving: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  rules: { type: Object, default: () => ({}) },
  severities: { type: Array, default: () => [] },
  maxScreenshots: { type: Number, default: 5 },
  formatSize: { type: Function, required: true }
})

defineEmits([
  'update:visible',
  'update:editForm',
  'save',
  'reset',
  'close',
  'remove-existing-screenshot',
  'file-change',
  'remove-new-screenshot'
])
</script>

<style scoped>
/* Severity picker (used in edit dialog) */
.bug-severity-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bug-severity-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid var(--el-border-color);
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
}

.bug-severity-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.severity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-border-color);
}

.bug-severity-btn.severity-low .severity-dot {
  background: #22c55e;
}
.bug-severity-btn.severity-medium .severity-dot {
  background: #f59e0b;
}
.bug-severity-btn.severity-high .severity-dot {
  background: #f97316;
}
.bug-severity-btn.severity-critical .severity-dot {
  background: #ef4444;
}

.bug-severity-btn.is-active.severity-low {
  border-color: #22c55e;
  color: #16a34a;
  background: #f0fdf4;
}
.bug-severity-btn.is-active.severity-medium {
  border-color: #f59e0b;
  color: #b45309;
  background: #fffbeb;
}
.bug-severity-btn.is-active.severity-high {
  border-color: #f97316;
  color: #c2410c;
  background: #fff7ed;
}
.bug-severity-btn.is-active.severity-critical {
  border-color: #ef4444;
  color: #b91c1c;
  background: #fef2f2;
}

/* Existing screenshots */
.bug-edit-existing-screenshots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bug-edit-ss-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: visible;
  flex-shrink: 0;
}

.bug-edit-ss-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
}

.bug-edit-ss-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

/* Shared upload UI (reused from form) */
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

.bug-file-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

.mt-2 {
  margin-top: 8px;
}

/* Dark theme */
:root.dark-theme .bug-severity-btn {
  color: #d1d5db;
  border-color: #4b5563;
}
:root.dark-theme .bug-severity-btn:hover {
  border-color: #93c5fd;
  color: #93c5fd;
}
:root.dark-theme .bug-severity-btn.is-active.severity-low {
  background: rgba(34, 197, 94, 0.1);
}
:root.dark-theme .bug-severity-btn.is-active.severity-medium {
  background: rgba(245, 158, 11, 0.1);
}
:root.dark-theme .bug-severity-btn.is-active.severity-high {
  background: rgba(249, 115, 22, 0.1);
}
:root.dark-theme .bug-severity-btn.is-active.severity-critical {
  background: rgba(239, 68, 68, 0.1);
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
</style>
