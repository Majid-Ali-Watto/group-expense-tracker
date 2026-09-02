<template>
  <el-dialog
    :model-value="visible"
    :title="t('bugReports.editBugReport')"
    :width="'min(95vw, 640px)'"
    append-to-body
    :close-on-click-modal="false"
    class="bug-edit-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @closed="$emit('close')"
  >
    <el-form
      v-if="editForm"
      ref="localFormRef"
      :model="editForm"
      :rules="rules"
      label-position="top"
      class="bug-edit-form"
    >
      <el-form-item :label="t('bugReports.category')" prop="category">
        <el-select
          :model-value="editForm.category"
          :placeholder="t('bugReports.selectCategory')"
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

      <el-form-item :label="t('bugReports.title')" prop="title">
        <el-input
          :model-value="editForm.title"
          :placeholder="t('bugReports.titlePlaceholder')"
          maxlength="120"
          show-word-limit
          @update:model-value="
            $emit('update:editForm', { ...editForm, title: $event })
          "
        />
      </el-form-item>

      <el-form-item :label="t('common.description')" prop="description">
        <RichTextEditor
          :model-value="editForm.description"
          :placeholder="t('bugReports.descriptionPlaceholder')"
          :maxlength="1000"
          :show-word-limit="true"
          @update:model-value="
            $emit('update:editForm', { ...editForm, description: $event })
          "
        />
      </el-form-item>

      <GenericDropDown
        :model-value="editForm.severity"
        :label="t('bugReports.severity')"
        :options="severities"
        :placeholder="t('bugReports.selectSeverity')"
        :filterable="false"
        :clearable="false"
        select-class="w-full"
        @update:model-value="
          $emit('update:editForm', { ...editForm, severity: $event })
        "
      />

      <!-- Existing screenshots -->
      <el-form-item
        v-if="editForm.existingScreenshots?.length"
        :label="t('bugReports.currentScreenshots')"
      >
        <div class="bug-edit-thumbs">
          <div
            v-for="(ss, i) in editForm.existingScreenshots"
            :key="ss.id || i"
            class="bug-edit-thumb"
          >
            <AppImage
              :src="ss.url"
              :alt="ss.filename || `screenshot-${i + 1}`"
            />
            <button
              type="button"
              class="bug-edit-thumb-remove"
              :disabled="editSaving"
              @click="$emit('remove-existing-screenshot', i)"
            >
              <XIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </el-form-item>

      <!-- New screenshots -->
      <el-form-item :label="t('bugReports.addScreenshots')">
        <div class="bug-upload-area">
          <label
            class="bug-upload-btn"
            :class="{
              'is-disabled':
                totalScreenshotCount >= maxScreenshots || editSaving
            }"
          >
            <PhotoIcon class="w-4 h-4" />
            {{ t('bugReports.attachScreenshot') }}
            <input
              ref="localFileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              :disabled="totalScreenshotCount >= maxScreenshots || editSaving"
              @change="$emit('file-change', $event)"
            />
          </label>

          <div v-if="editNewScreenshots.length" class="bug-file-list">
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
                :disabled="editSaving"
                @click="$emit('remove-new-screenshot', i)"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <GenericButton
        size="default"
        type="default"
        :disabled="editSaving"
        @click="$emit('reset')"
      >
        {{ t('common.reset') }}
      </GenericButton>
      <GenericButton
        size="default"
        type="warning"
        :loading="editSaving"
        @click="$emit('save')"
      >
        {{ editSaving ? t('bugReports.saving') : t('common.save') }}
      </GenericButton>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { PhotoIcon, XIcon } from '@/components/icons'
import {
  AppImage,
  GenericDropDown,
  GenericButton,
  RichTextEditor
} from '@/components/generic-components'

const localFormRef = ref(null)
const localFileInputRef = ref(null)
const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  editForm: { type: Object, default: null },
  editNewScreenshots: { type: Array, default: () => [] },
  editSaving: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  rules: { type: Object, default: () => ({}) },
  severities: { type: Array, default: () => [] },
  maxScreenshots: { type: Number, default: 3 },
  formatSize: { type: Function, required: true }
})

const totalScreenshotCount = computed(
  () =>
    (props.editForm?.existingScreenshots?.length ?? 0) +
    props.editNewScreenshots.length
)

defineExpose({
  validate: (...a) => localFormRef.value?.validate(...a),
  clearValidate: () => localFormRef.value?.clearValidate(),
  clearFileInput: () => {
    if (localFileInputRef.value) localFileInputRef.value.value = ''
  }
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
.bug-edit-form {
  padding: 4px 0;
}

.bug-edit-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bug-edit-thumb {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  flex-shrink: 0;
}
.bug-edit-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bug-edit-thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  cursor: pointer;
  padding: 0;
}
.bug-edit-thumb-remove:hover:not(:disabled) {
  background: #ef4444;
}
.bug-edit-thumb-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Screenshot upload (mirrors BugReportForm.vue) */
.bug-upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

/* Dark theme */
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
