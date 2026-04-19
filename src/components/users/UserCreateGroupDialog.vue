<template>
  <el-dialog
    :model-value="modelValue"
    title="Create Group"
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
        <el-button size="small" @click="$emit('update:modelValue', false)">
          Cancel
        </el-button>
      </template>
    </GroupsCreate>
  </el-dialog>
</template>

<script setup>
import { loadAsyncComponent } from '@/utils'

defineProps({
  modelValue: { type: Boolean, required: true },
  preselectedMember: { type: String, default: null }
})

defineEmits(['update:modelValue', 'group-created'])

const GroupsCreate = loadAsyncComponent(
  () => import('@/components/groups/GroupsCreate.vue')
)
</script>
