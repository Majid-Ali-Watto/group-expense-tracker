<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
      <el-alert
        v-if="activeUserIsBlocked"
        :title="t('users.blockedAccountWarning')"
        type="warning"
        :closable="false"
        class="mb-4"
      />

      <UserPendingApprovals
        v-if="!activeUserIsBlocked"
        :approvals="myPendingApprovals"
        :display-mobile="displayMobile"
        @approve="approveRequest"
        @reject="rejectRequest"
      />

      <h3>{{ t('users.existingUsers') }}</h3>
      <GenericInputField
        v-model="searchQuery"
        :placeholder="t('users.searchPlaceholder')"
        :maxlength="50"
        :wrap-form-item="false"
        input-class="mb-2"
      >
        <template #prefix><span class="text-gray-400">🔍</span></template>
      </GenericInputField>

      <!-- Sort & Filter controls -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <el-button-group size="medium">
          <el-button
            :type="sortOrder === '' ? 'primary' : ''"
            @click="sortOrder = ''"
            >{{ t('users.default') }}</el-button
          >
          <el-button
            :type="sortOrder === 'asc' ? 'primary' : ''"
            @click="sortOrder = 'asc'"
            >{{ t('groups.sortAsc') }}</el-button
          >
          <el-button
            :type="sortOrder === 'desc' ? 'primary' : ''"
            @click="sortOrder = 'desc'"
            >{{ t('groups.sortDesc') }}</el-button
          >
        </el-button-group>
        <el-checkbox v-model="sharedGroupsOnly" size="small"
          >{{ t('users.sharedGroupsOnly') }}</el-checkbox
        >
      </div>
      <div class="mb-3">
        <el-checkbox v-model="hideBlockedUsers" size="small">
          {{ t('users.hideBlockedUsers') }}
        </el-checkbox>
      </div>

      <!-- Header row — visible only on larger screens -->
      <div
        class="hidden sm:flex sm:items-center gap-3 px-3 mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
      >
        <div class="flex-1 min-w-0">{{ t('users.nameMobile') }}</div>
        <div class="flex-1">{{ t('users.groups') }}</div>
        <div class="flex-shrink-0 w-48">{{ t('users.actions') }}</div>
      </div>

      <div v-if="filteredUsers.length > 0" class="space-y-3 mt-1">
        <UserCard
          v-for="row in filteredUsers"
          :key="row.uid"
          :user="row"
          :groups="getUserGroups(row.uid)"
          :mobile="displayMobile(row.uid)"
          :can-manage="canManage(row)"
          :active-user-blocked="activeUserIsBlocked"
          :is-member="isCurrentUserInGroup"
          :has-pending-join-request="hasCurrentUserPendingJoinRequest"
          @edit="openEditUser(row)"
          @delete="requestDeleteUser"
          @create-group="openCreateGroup"
          @select-group="requestJoinFromUserGroup"
          @open-groups="openGroupsDialog(row)"
        />
      </div>
      <div v-else class="user-empty">
        <div class="user-empty__icon">👥</div>
        <div class="user-empty__title">{{ t('users.noUsersMatch') }}</div>
        <div class="user-empty__copy">
          {{ t('users.clearSearchHint') }}
        </div>
      </div>

      <UserGroupsDialog
        v-model="groupsDialogVisible"
        :user-name="selectedUserName"
        :groups="selectedUserGroups"
        :is-member="isCurrentUserInGroup"
        :has-pending-join-request="hasCurrentUserPendingJoinRequest"
        @join-group="requestJoinFromUserGroup"
      />

      <UserCreateGroupDialog
        v-model="createGroupDialogVisible"
        :preselected-member="createGroupForMobile"
        @group-created="handleGroupCreated"
      />

      <UserEditDialog
        v-model="editDialogVisible"
        :form="editForm"
        :rules="editUserRules"
        @save="handleSave"
        @reset="resetEditUserForm"
      />
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { LoadingSkeleton } from '@/components/shared'
import { Users } from '@/scripts/users'
import { GenericInputField } from '@/components/generic-components'
import UserPendingApprovals from './UserPendingApprovals.vue'
import UserCard from './UserCard.vue'
import UserEditDialog from './UserEditDialog.vue'
import UserGroupsDialog from './UserGroupsDialog.vue'
import UserCreateGroupDialog from './UserCreateGroupDialog.vue'

const { t } = useI18n()

const {
  searchQuery,
  sortOrder,
  sharedGroupsOnly,
  hideBlockedUsers,
  filteredUsers,
  editDialogVisible,
  editForm,
  myPendingApprovals,
  displayMobile,
  getUserGroups,
  isCurrentUserInGroup,
  hasCurrentUserPendingJoinRequest,
  requestJoinFromUserGroup,
  canManage,
  openEditUser,
  requestDeleteUser,
  approveRequest,
  rejectRequest,
  editUserRules,
  createGroupDialogVisible,
  createGroupForMobile,
  openCreateGroup,
  groupsDialogVisible,
  selectedUserGroups,
  selectedUserName,
  isPageLoading,
  openGroupsDialog,
  submitUpdateUser,
  resetEditUserForm,
  activeUserIsBlocked,
  handleGroupCreated
} = Users()

function handleSave(formData) {
  editForm.value = formData
  submitUpdateUser()
}
</script>

<style scoped>
.user-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1.15rem 1rem;
  border-radius: 16px;
  border: 1px dashed rgba(59, 130, 246, 0.28);
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(34, 197, 94, 0.05)),
    var(--card-bg);
  text-align: center;
}

.user-empty__icon {
  font-size: 1.55rem;
}

.user-empty__title {
  font-size: 0.95rem;
  font-weight: 700;
}

.user-empty__copy {
  font-size: 0.82rem;
  color: var(--text-secondary);
}
</style>
