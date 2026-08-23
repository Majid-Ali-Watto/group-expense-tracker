<template>
  <el-dialog
    :model-value="visible"
    :title="resolvedTitle"
    width="min(92vw, 560px)"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="showClose"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <UserTabConfigForm
      :selection="selection"
      @update:selection="$emit('update:selection', $event)"
    />

    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button size="default" @click="$emit('cancel')">{{
          resolvedCancelText
        }}</el-button>
        <el-button
          type="primary"
          size="default"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ resolvedConfirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UserTabConfigForm from './UserTabConfigForm.vue'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  selection: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  title: { type: String, default: '' },
  confirmText: { type: String, default: '' },
  cancelText: { type: String, default: '' },
  showClose: { type: Boolean, default: false }
})

defineEmits(['update:visible', 'update:selection', 'confirm', 'cancel'])

const resolvedTitle = computed(() => props.title || t('auth.tabConfig.title'))
const resolvedConfirmText = computed(
  () => props.confirmText || t('auth.googleMobileDialog.continue')
)
const resolvedCancelText = computed(
  () => props.cancelText || t('common.cancel')
)
</script>
