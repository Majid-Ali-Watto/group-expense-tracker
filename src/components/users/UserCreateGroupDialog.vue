<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('users.createGroup')"
    width="90%"
    append-to-body
    style="max-width: 500px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <GroupsCreate
      :preselectedMember="preselectedMember"
      @groupCreated="
        (group) => {
          $emit('group-created', group)
          $emit('update:modelValue', false)
        }
      "
    >
      <template #clear>
        <el-button size="default" @click="$emit('update:modelValue', false)">
          {{ t('common.cancel') }}
        </el-button>
      </template>
    </GroupsCreate>
  </el-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { loadAsyncComponent } from '@/utils'

const { t } = useI18n()

defineProps({
  modelValue: { type: Boolean, required: true },
  preselectedMember: { type: String, default: null }
})

defineEmits(['update:modelValue', 'group-created'])

const GroupsCreate = loadAsyncComponent(
  () => import('@/components/groups/GroupsCreate.vue')
)
</script>
