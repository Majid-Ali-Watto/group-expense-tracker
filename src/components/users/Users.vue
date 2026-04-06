<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
      <UserPendingApprovals
        :approvals="myPendingApprovals"
        :display-mobile="displayMobile"
        @approve="approveRequest"
        @reject="rejectRequest"
      />

      <h3>Existing Users (only verified)</h3>
      <GenericInputField
        v-model="searchQuery"
        placeholder="Search by name, mobile, or group..."
        :maxlength="50"
        :wrap-form-item="false"
        input-class="mb-2"
      >
        <template #prefix><span class="text-gray-400">🔍</span></template>
      </GenericInputField>

      <!-- Sort & Filter controls -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <el-button-group size="small">
          <el-button
            :type="sortOrder === '' ? 'primary' : ''"
            @click="sortOrder = ''"
            >Default</el-button
          >
          <el-button
            :type="sortOrder === 'asc' ? 'primary' : ''"
            @click="sortOrder = 'asc'"
            >A→Z</el-button
          >
          <el-button
            :type="sortOrder === 'desc' ? 'primary' : ''"
            @click="sortOrder = 'desc'"
            >Z→A</el-button
          >
        </el-button-group>
        <el-checkbox v-model="sharedGroupsOnly" size="small"
          >Shared groups only</el-checkbox
        >
      </div>

      <!-- Header row — visible only on larger screens -->
      <div
        class="hidden sm:flex sm:items-center gap-3 px-3 mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
      >
        <div class="flex-1 min-w-0">Name / Mobile</div>
        <div class="flex-1">Groups</div>
        <div class="flex-shrink-0 w-48">Actions</div>
      </div>

      <div v-if="filteredUsers.length > 0" class="space-y-3 mt-1">
        <UserCard
          v-for="row in filteredUsers"
          :key="row.uid"
          :user="row"
          :active-user="activeUser"
          :groups="getUserGroups(row.uid)"
          :mobile="displayMobile(row.uid)"
          :can-manage="canManage(row)"
          @edit="openEditUser(row)"
          @delete="requestDeleteUser"
          @create-group="openCreateGroup"
          @open-groups="openGroupsDialog(row)"
        />
      </div>
      <div v-else class="user-empty">
        <div class="user-empty__icon">👥</div>
        <div class="user-empty__title">No users match the current filters</div>
        <div class="user-empty__copy">
          Try clearing the search or removing the shared-group filter.
        </div>
      </div>

      <UserGroupsDialog
        v-model="groupsDialogVisible"
        :user-name="selectedUserName"
        :groups="selectedUserGroups"
      />

      <UserCreateGroupDialog
        v-model="createGroupDialogVisible"
        :preselected-member="createGroupForMobile"
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
import { LoadingSkeleton } from '@/components/shared'
import { Users } from '@/scripts/users'
import { GenericInputField } from '@/components/generic-components'
import UserPendingApprovals from './UserPendingApprovals.vue'
import UserCard from './UserCard.vue'
import UserEditDialog from './UserEditDialog.vue'
import UserGroupsDialog from './UserGroupsDialog.vue'
import UserCreateGroupDialog from './UserCreateGroupDialog.vue'

const {
  searchQuery,
  sortOrder,
  sharedGroupsOnly,
  filteredUsers,
  editDialogVisible,
  editForm,
  myPendingApprovals,
  displayMobile,
  getUserGroups,
  canManage,
  activeUser,
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
  resetEditUserForm
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
