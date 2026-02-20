<template>
  <div>
    <el-alert
      v-if="memberCount > 2"
      title="Shared loans are designed for managing loans between two people."
      description="This group has more than 2 members. Loan tracking works best between two members only."
      type="warning"
      show-icon
      :closable="false"
    />
    <Loans v-else />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { store } from '../stores/store'

const Loans = defineAsyncComponent(() => import('./Loans.vue'))

const userStore = store()

const activeGroup = computed(() => userStore.getActiveGroup)
const groupObj = computed(() =>
  activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
)
const memberCount = computed(() => groupObj.value?.members?.length || 0)
</script>
