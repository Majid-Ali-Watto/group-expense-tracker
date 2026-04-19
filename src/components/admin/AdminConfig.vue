<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <el-button size="small" @click="router.back()">← Back</el-button>
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Admin Config</h1>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <el-text class="text-gray-500">Loading configuration…</el-text>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">

        <!-- Storage -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Storage" path="configs/storage" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Allow receipt uploads" :value="flag('storage','upload_allowed')" @change="updateField('storage','upload_allowed',$event)" />
            <ToggleRow label="Enable Cloudinary provider" :value="flag('storage','cloudinary')" @change="updateField('storage','cloudinary',$event)" />
            <ToggleRow label="Enable Firebase Storage provider" :value="flag('storage','firebase')" @change="updateField('storage','firebase',$event)" />
          </div>
        </el-card>

        <!-- Cache -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Cache" path="configs/cache" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Enable query caching" :value="flag('cache','isCached')" @change="updateField('cache','isCached',$event)" />
          </div>
        </el-card>

        <!-- Downloads -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Downloads" path="configs/downloads" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Allow PDF downloads" :value="flag('downloads','pdf')" @change="updateField('downloads','pdf',$event)" />
            <ToggleRow label="Allow Excel downloads" :value="flag('downloads','excel')" @change="updateField('downloads','excel',$event)" />
          </div>
        </el-card>

        <!-- Manage Tabs -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Manage Tabs" path="configs/manage-tabs" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Show Manage Tabs option globally" :value="flag('manage-tabs','showManageTab')" @change="updateField('manage-tabs','showManageTab',$event)" />
          </div>
        </el-card>

        <!-- Bug Reports -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Bug Reports" path="configs/bugs" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Enable bug reporting" :value="flag('bugs','report')" @change="updateField('bugs','report',$event)" />
          </div>
        </el-card>

        <!-- Email -->
        <el-card shadow="never">
          <template #header>
            <ConfigCardHeader title="Email" path="configs/email" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Send email notifications" :value="flag('email','send')" @change="updateField('email','send',$event)" />
            <LimitRow label="Free tier — monthly email limit" :value="num('email','free_email_limit_per_month')" @change="updateField('email','free_email_limit_per_month',$event)" />
            <LimitRow label="Paid tier — monthly email limit" :value="num('email','paid_emails_limit_per_month')" @change="updateField('email','paid_emails_limit_per_month',$event)" />
          </div>
        </el-card>


        <!-- OCR -->
        <el-card shadow="never" class="sm:col-span-2">
          <template #header>
            <ConfigCardHeader title="OCR / Receipt Extraction" path="configs/ocr" />
          </template>
          <div class="space-y-3">
            <ToggleRow label="Allow receipt text extraction" :value="flag('ocr','extract_allowed')" @change="updateField('ocr','extract_allowed',$event)" />
            <div class="grid gap-3 sm:grid-cols-2 pt-1">
              <LimitRow label="Free tier — monthly extraction limit" :value="num('ocr','free_extraction_limit_per_month')" @change="updateField('ocr','free_extraction_limit_per_month',$event)" />
              <LimitRow label="Paid tier — monthly extraction limit" :value="num('ocr','paid_extraction_limit_per_month')" @change="updateField('ocr','paid_extraction_limit_per_month',$event)" />
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
import { defineComponent, h, resolveComponent } from 'vue'
import { useRouter } from 'vue-router'
import { AdminConfig } from '@/scripts/admin/admin-config'
import AdminUsers from './AdminUsers.vue'

const router = useRouter()
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
        h('span', { class: 'font-semibold text-gray-800 dark:text-gray-100' }, props.title),
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
        h('span', { class: 'text-sm text-gray-700 dark:text-gray-300' }, props.label),
        h(resolveComponent('el-switch'), {
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
        h('p', { class: 'text-xs text-gray-500 dark:text-gray-400' }, props.label),
        h(resolveComponent('el-input-number'), {
          modelValue: props.value,
          min: 1,
          placeholder: 'Unlimited',
          controlsPosition: 'right',
          style: 'width: 100%',
          'onUpdate:modelValue': (v) => emit('change', v ?? null)
        })
      ])
  }
})
</script>
