<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
    <!-- Pending Approvals -->
    <div v-if="myPendingApprovals.length > 0" class="mb-4">
      <h4 class="pending-title mb-2">Pending Approvals</h4>
      <div
        v-for="item in myPendingApprovals"
        :key="`${item.user.mobile}-${item.type}`"
        class="pending-card rounded-lg p-3 mb-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">
              {{ item.user.name }} ({{ displayMobile(item.user.mobile) }})
            </div>
            <div class="text-xs text-gray-600 mt-1">
              <span>
                Delete request by
                <strong>
                  {{ userStore.getUserByMobile(item.request.requestedBy)?.name || item.request.requestedBy }} ({{
                    displayMobile(item.request.requestedBy)
                  }})
                </strong>
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1">
              Approvals: {{ item.request.approvals?.length || 0 }} /
              {{ item.request.requiredApprovals?.length || 0 }}
            </div>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <el-button
              size="small"
              type="success"
              @click="approveRequest(item.user.mobile, item.type)"
            >
              Approve
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="
                rejectRequest(item.user.mobile, item.type, item.user.name)
              "
            >
              Reject
            </el-button>
          </div>
        </div>
      </div>
    </div>

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

    <div class="space-y-3 mt-1">
      <div
        v-for="row in filteredUsers"
        :key="row.mobile"
        class="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
      >
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <!-- Name & Mobile -->
          <div class="flex-1 min-w-0">
            <div
              class="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
            >
              Name / Mobile
            </div>
            <div class="font-semibold text-gray-800">{{ row.name }}</div>
            <div class="text-sm text-gray-500">
              {{ displayMobile(row.mobile) }}
            </div>
          </div>

          <!-- Groups -->
          <div class="flex flex-wrap gap-1 sm:flex-1">
            <div
              class="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
            >
              Groups
            </div>
            <template v-if="getUserGroups(row.mobile).length > 0">
              <el-tag
                v-for="group in getUserGroups(row.mobile).slice(0, 3)"
                :key="group"
                size="small"
                type="success"
              >
                {{ group }}
              </el-tag>
              <el-tag
                v-if="getUserGroups(row.mobile).length > 3"
                size="small"
                type="success"
                class="cursor-pointer"
                @click="openGroupsDialog(row)"
              >
                +{{ getUserGroups(row.mobile).length - 3 }} more
              </el-tag>
            </template>
            <span v-else class="text-gray-400 text-xs">No groups</span>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-1 flex-shrink-0 sm:w-48">
            <div
              class="w-full text-xs font-semibold text-gray-400 uppercase tracking-wide sm:hidden mb-1"
            >
              Actions
            </div>

            <el-button
              v-if="row.mobile !== activeUser"
              size="small"
              type="success"
              plain
              @click="openCreateGroup(row.mobile)"
            >
              Create Group
            </el-button>

            <template v-if="canManage(row)">
              <!-- No pending request: show edit & delete -->
              <template v-if="!row.deleteRequest">
                <el-button
                  size="small"
                  type="primary"
                  @click="openEditUser(row)"
                >
                  Edit
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="requestDeleteUser(row.mobile, row.name)"
                >
                  Delete
                </el-button>
              </template>

              <!-- Delete pending -->
              <el-button v-else size="small" disabled>
                Delete Pending ({{
                  row.deleteRequest.approvals?.length || 0
                }}/{{ row.deleteRequest.requiredApprovals?.length || 0 }})
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- All Groups Dialog -->
    <el-dialog
      v-model="groupsDialogVisible"
      :title="`${selectedUserName}'s Groups (${selectedUserGroups.length})`"
      width="300px"
      align-center
    >
      <div class="overflow-y-auto max-h-64 pr-1">
        <div
          v-for="(group, i) in selectedUserGroups"
          :key="i"
          class="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
        >
          <div
            class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold shrink-0"
          >
            {{ group.charAt(0).toUpperCase() }}
          </div>
          <div class="text-sm text-gray-700">{{ group }}</div>
        </div>
      </div>
    </el-dialog>

    <!-- Create Group Dialog -->
    <el-dialog
      v-model="createGroupDialogVisible"
      title="Create Group"
      width="90%"
      style="max-width: 500px"
      destroy-on-close
    >
      <GroupsCreate
        :preselectedMember="createGroupForMobile"
        @groupCreated="createGroupDialogVisible = false"
      >
        <template #clear>
          <el-button size="small" @click="createGroupDialogVisible = false"
            >Cancel</el-button
          >
        </template>
      </GroupsCreate>
    </el-dialog>

    <!-- Edit User Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Edit User"
      width="90%"
      style="max-width: 400px"
    >
      <el-form
        :model="editForm"
        :rules="rules"
        ref="editUserFormRef"
        label-position="top"
      >
        <el-form-item label="Mobile Number">
          <GenericInputField
            :modelValue="editForm.mobile"
            :wrap-form-item="false"
            :disabled="true"
          />
        </el-form-item>
        <el-form-item label="Full Name" prop="name">
          <GenericInputField
            v-model="editForm.name"
            :wrap-form-item="false"
            placeholder="Full name"
            :maxlength="50"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <el-button size="small" @click="editDialogVisible = false"
            >Cancel</el-button
          >
          <el-button type="primary" size="small" @click="handleEditUserSave"
            >Save</el-button
          >
        </div>
      </template>
    </el-dialog>
    </template>
  </div>
</template>

<script setup>
import LoadingSkeleton from '../shared/LoadingSkeleton.vue'
import { loginRules as rules } from '../../assets/validation-rules'
import { Users } from '../../scripts/users/users'
import GenericInputField from '../generic-components/GenericInputField.vue'
import { useUserStore } from '../../stores/userStore'
import { loadAsyncComponent } from '../../utils/async-component'
const GroupsCreate = loadAsyncComponent(
  () => import('../groups/GroupsCreate.vue')
)
const userStore = useUserStore()

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
  editUserFormRef,
  createGroupDialogVisible,
  createGroupForMobile,
  openCreateGroup,
  groupsDialogVisible,
  selectedUserGroups,
  selectedUserName,
  isPageLoading,
  openGroupsDialog,
  handleEditUserSave
} = Users()
</script>
