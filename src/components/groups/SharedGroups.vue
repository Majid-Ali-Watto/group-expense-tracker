<template>
  <div class="space-y-4">
    <LoadingSkeleton v-if="loading" mode="page" />

    <template v-else>
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            Shared Groups
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Join a shared group or select one you already belong to.
          </p>
        </div>
        <el-button plain @click="$router.push('/groups')">
          Back to Groups
        </el-button>
      </div>

      <el-alert
        v-if="missingGroupIds.length > 0"
        type="warning"
        :closable="false"
        title="Some shared groups are no longer available."
      />

      <div
        v-if="sharedIds.length === 0"
        class="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        No shared groups were found in this link.
      </div>

      <div
        v-else-if="sharedGroups.length === 0"
        class="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        None of the shared groups could be loaded.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="group in sharedGroups"
          :key="group.id"
          class="rounded-xl border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700"
        >
          <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ group.name }}
              </h3>
              <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Owner:
                  {{
                    userStore.getUserByMobile(group.ownerMobile)?.name ||
                    group.ownerMobile
                  }}
                  ({{ displayMobileForGroup(group.ownerMobile, group) }})
                </p>
                <p
                  v-if="group.category"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  Category: {{ group.category }}
                </p>
              </div>
            </div>

            <el-button
              v-if="isMember(group)"
              type="primary"
              :loading="actioningGroupId === group.id"
              @click="selectSharedGroup(group)"
            >
              Select
            </el-button>
            <el-button
              v-else
              type="success"
              :loading="actioningGroupId === group.id"
              :disabled="hasPendingJoinRequest(group)"
              @click="joinSharedGroup(group)"
            >
              {{
                hasPendingJoinRequest(group) ? 'Join Request Pending' : 'Join'
              }}
            </el-button>
          </div>

          <GroupDetailsAccordion
            :group="group"
            group-type="other"
            :load-group-balances="loadBalances"
            :display-mobile-for-group="displayMobileForGroup"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { LoadingSkeleton } from '@/components/shared'
import { GroupDetailsAccordion } from '@/components/generic-components'
import { SharedGroups } from '@/scripts/groups'

const {
  loading,
  actioningGroupId,
  sharedIds,
  sharedGroups,
  missingGroupIds,
  userStore,
  displayMobileForGroup,
  isMember,
  hasPendingJoinRequest,
  joinSharedGroup,
  loadBalances,
  selectSharedGroup
} = SharedGroups()
</script>
