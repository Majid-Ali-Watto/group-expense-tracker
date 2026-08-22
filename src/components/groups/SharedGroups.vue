<template>
  <div class="space-y-4">
    <LoadingSkeleton v-if="loading" mode="page" />

    <template v-else>
      <el-alert
        v-if="activeUserIsBlocked"
        :title="t('groups.sharedGroupsBlockedNotice')"
        type="warning"
        :closable="false"
      />

      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            {{ t('groups.sharedGroupsTitle') }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('groups.sharedGroupsSubtitle') }}
          </p>
        </div>
        <el-button plain @click="$router.push('/groups')">
          {{ t('groups.backToGroups') }}
        </el-button>
      </div>

      <el-alert
        v-if="missingGroupIds.length > 0"
        type="warning"
        :closable="false"
        :title="t('groups.someGroupsUnavailable')"
      />

      <div
        v-if="sharedIds.length === 0"
        class="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        {{ t('groups.noSharedGroupsInLink') }}
      </div>

      <div
        v-else-if="sharedGroups.length === 0"
        class="rounded-xl border border-dashed border-gray-300 px-6 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400"
      >
        {{ t('groups.noSharedGroupsLoaded') }}
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="group in sharedGroups"
          :key="group.id"
          class="rounded-xl border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700"
        >
          <el-alert
            v-if="activeUserIsBlocked || group.blocked"
            :title="
              group.blocked
                ? t('groups.groupBlockedByAdmin')
                : t('groups.accountBlockedActionsDisabled')
            "
            type="warning"
            :closable="false"
            class="mb-3"
          />

          <div
            class="shared-group-card__body"
            :class="{
              'pointer-events-none opacity-60 select-none':
                activeUserIsBlocked || group.blocked
            }"
          >
            <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ group.name }}
                </h3>
                <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      t('groups.ownerLabel', {
                        name: userStore.getUserByUid(group.ownerUid)?.name,
                        mobile: displayMobileForGroup(group.ownerUid, group)
                      })
                    }}
                  </p>
                  <p
                    v-if="group.category"
                    class="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {{
                      t('groups.categoryInline', { category: group.category })
                    }}
                  </p>
                </div>
              </div>

              <el-button
                v-if="isMember(group)"
                type="primary"
                :loading="actioningGroupId === group.id"
                :disabled="activeUserIsBlocked || group.blocked"
                @click="selectSharedGroup(group)"
              >
                {{ t('groups.select') }}
              </el-button>
              <el-button
                v-else
                type="success"
                :loading="actioningGroupId === group.id"
                :disabled="
                  hasPendingJoinRequest(group) ||
                  activeUserIsBlocked ||
                  group.blocked
                "
                @click="joinSharedGroup(group)"
              >
                {{
                  hasPendingJoinRequest(group)
                    ? t('groups.joinRequestPending')
                    : t('groups.join')
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
      </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { LoadingSkeleton } from '@/components/shared'
import { GroupDetailsAccordion } from '@/components/generic-components'
import { SharedGroups } from '@/scripts/groups'

const { t } = useI18n()

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
  selectSharedGroup,
  activeUserIsBlocked
} = SharedGroups()
</script>

<style scoped>
.shared-group-card__body {
  display: block;
}
</style>
