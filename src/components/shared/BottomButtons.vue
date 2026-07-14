<template>
  <div
    class="flex justify-between flex-wrap gap-y-2 space-x-4 min-[410px]:flex-nowrap"
  >
    <el-button
      @click="confirmUpdate"
      type="warning"
      size="medium"
      class="text-white py-2 px-4 rounded-lg"
    >
      {{ t('common.update') }}
    </el-button>
    <el-button
      @click="confirmDelete"
      type="danger"
      size="medium"
      class="text-white py-2 px-4 rounded-lg"
    >
      {{ t('common.delete') }}
    </el-button>
    <el-button
      @click="confirmDuplicate"
      type="primary"
      size="medium"
      class="py-2 px-4 rounded-lg"
    >
      {{ t('common.duplicate') }}
    </el-button>
    <el-button
      @click="$emit('cancel')"
      type="success"
      size="medium"
      class="py-2 px-4 rounded-lg"
    >
      {{ t('common.cancel') }}
    </el-button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { BottomButtons } from '@/scripts/shared'

const { t } = useI18n()

const emit = defineEmits(['update', 'delete', 'duplicate', 'cancel'])

const { confirmUpdate, confirmDelete, confirmDuplicate } = BottomButtons(emit)
</script>

<style scoped>
div :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
