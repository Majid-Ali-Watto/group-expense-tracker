<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div>
      <div class="flex items-center gap-3 mb-6">
        <el-button size="default" @click="router.back()">{{
          t('admin.config.back')
        }}</el-button>
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">
          {{ t('headerActions.adminConfig') }}
        </h1>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <el-text class="text-gray-500">{{ t('admin.config.loading') }}</el-text>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <!-- Storage -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader
              :title="t('admin.config.storageTitle')"
              path="configs/storage"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.allowReceiptUploads')"
              :value="flag('storage', 'upload_allowed')"
              @change="updateField('storage', 'upload_allowed', $event)"
            />
            <ToggleRow
              :label="t('admin.config.enableCloudinary')"
              :value="flag('storage', 'cloudinary')"
              @change="updateField('storage', 'cloudinary', $event)"
            />
          </div>
        </el-card>

        <!-- Cache -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader
              :title="t('admin.config.cacheTitle')"
              path="configs/cache"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.enableQueryCaching')"
              :value="flag('cache', 'isCached')"
              @change="updateField('cache', 'isCached', $event)"
            />
          </div>
        </el-card>

        <!-- Downloads -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader
              :title="t('admin.config.downloadsTitle')"
              path="configs/downloads"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.allowPdfDownloads')"
              :value="flag('downloads', 'pdf')"
              @change="updateField('downloads', 'pdf', $event)"
            />
            <ToggleRow
              :label="t('admin.config.allowExcelDownloads')"
              :value="flag('downloads', 'excel')"
              @change="updateField('downloads', 'excel', $event)"
            />
          </div>
        </el-card>

        <!-- Manage Tabs -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader
              :title="t('settings.manageTabs')"
              path="configs/manage-tabs"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.showManageTabsGlobally')"
              :value="flag('manage-tabs', 'showManageTab')"
              @change="updateField('manage-tabs', 'showManageTab', $event)"
            />
          </div>
        </el-card>

        <!-- Bug Reports -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader
              :title="t('admin.config.bugReportingTitle')"
              path="configs/bugs"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.enableBugReporting')"
              :value="flag('bugs', 'report')"
              @change="updateField('bugs', 'report', $event)"
            />
          </div>
        </el-card>

        <!-- Email -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader :title="t('common.email')" path="configs/email" />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.sendEmailNotifications')"
              :value="flag('email', 'send')"
              @change="updateField('email', 'send', $event)"
            />
            <LimitRow
              :label="t('admin.config.freeTierEmailLimit')"
              :value="num('email', 'free_email_limit_per_month')"
              @change="
                updateField('email', 'free_email_limit_per_month', $event)
              "
            />
            <LimitRow
              :label="t('admin.config.paidTierEmailLimit')"
              :value="num('email', 'paid_emails_limit_per_month')"
              @change="
                updateField('email', 'paid_emails_limit_per_month', $event)
              "
            />
          </div>
        </el-card>

        <!-- OCR -->
        <el-card shadow="never" class="sm:col-span-2">
          <template #header>
            <ConfigCardHeader
              :title="t('admin.config.ocrTitle')"
              path="configs/ocr"
            />
          </template>
          <div class="space-y-3">
            <ToggleRow
              :label="t('admin.config.allowReceiptExtraction')"
              :value="flag('ocr', 'extract_allowed')"
              @change="updateField('ocr', 'extract_allowed', $event)"
            />
            <div class="grid gap-3 sm:grid-cols-2 pt-1">
              <LimitRow
                :label="t('admin.config.freeTierExtractionLimit')"
                :value="num('ocr', 'free_extraction_limit_per_month')"
                @change="
                  updateField('ocr', 'free_extraction_limit_per_month', $event)
                "
              />
              <LimitRow
                :label="t('admin.config.paidTierExtractionLimit')"
                :value="num('ocr', 'paid_extraction_limit_per_month')"
                @change="
                  updateField('ocr', 'paid_extraction_limit_per_month', $event)
                "
              />
            </div>
          </div>
        </el-card>

        <!-- Users -->
        <AdminUsers />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElSwitch, ElInputNumber } from 'element-plus'
import { AdminConfig } from '@/scripts/admin/admin-config'
import AdminUsers from './AdminUsers.vue'

const router = useRouter()
const { t } = useI18n()
const { configs, loading, updateField } = AdminConfig()

function flag(docId, field) {
  return configs[docId]?.[field] !== false
}

function num(docId, field) {
  return configs[docId]?.[field] ?? null
}

const ConfigCardHeader = defineComponent({
  props: { title: String, path: String },
  setup(props) {
    return () =>
      h('div', { class: 'flex items-baseline gap-2' }, [
        h(
          'span',
          { class: 'font-semibold text-gray-800 dark:text-gray-100' },
          props.title
        ),
        h('span', { class: 'text-xs text-gray-400' }, props.path)
      ])
  }
})

const ToggleRow = defineComponent({
  props: { label: String, value: Boolean },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'flex items-center justify-between gap-4' }, [
        h(
          'span',
          { class: 'text-sm text-gray-700 dark:text-gray-300' },
          props.label
        ),
        h(ElSwitch, {
          modelValue: props.value,
          disabled: false,
          'onUpdate:modelValue': (v) => emit('change', v)
        })
      ])
  }
})

const LimitRow = defineComponent({
  props: { label: String, value: { type: Number, default: null } },
  emits: ['change'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'space-y-1' }, [
        h(
          'p',
          { class: 'text-xs text-gray-500 dark:text-gray-400' },
          props.label
        ),
        h(ElInputNumber, {
          modelValue: props.value,
          min: 1,
          placeholder: t('admin.config.unlimitedPlaceholder'),
          controlsPosition: 'right',
          style: 'width: 100%',
          'onUpdate:modelValue': (v) => emit('change', v ?? null)
        })
      ])
  }
})
</script>
