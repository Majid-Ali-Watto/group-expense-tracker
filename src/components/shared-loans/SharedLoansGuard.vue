<template>
  <GroupAccessGuard :group-id="$route.params.groupId">
    <div>
      <el-alert
        v-if="memberCount > 2"
        :title="t('sharedLoans.guardTitle')"
        :description="t('sharedLoans.guardDescription')"
        type="warning"
        show-icon
        :closable="false"
      />
      <Loans v-else />
    </div>
  </GroupAccessGuard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { GroupAccessGuard } from '@/components/shared'
import { useGroupStore } from '@/stores'
import { loadAsyncComponent } from '@/utils'

const Loans = loadAsyncComponent(() => import('./Loans.vue'))

const { t } = useI18n()
const userStore = useGroupStore()

const activeGroup = computed(() => userStore.getActiveGroup)
const groupObj = computed(() =>
  activeGroup.value ? userStore.getGroupById(activeGroup.value) : null
)
const memberCount = computed(() => groupObj.value?.members?.length || 0)
</script>
