<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-4">
    <!-- Add Group Button -->

    <add-new-transaction-button
      v-if="!showCreateGroup"
      text="Want to create a new group?"
      @click="openCreateGroup"
    />

    <!-- Create Group Form -->
    <div v-else>
      <groups-create>
        <template #clear>
          <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
            <el-button type="info" plain @click="closeCreateGroup">
              Cancel
            </el-button>
          </div>
        </template>
      </groups-create>
    </div>

    <!-- Search Bar -->
    <div class="mb-4">
      <el-input
        v-model="searchQuery"
        placeholder="Search by group name, code, owner, or member..."
        clearable
        prefix-icon="el-icon-search"
        size="medium"
      >
        <template #prefix>
          <span class="text-gray-400">🔍</span>
        </template>
      </el-input>
    </div>

    <!-- Existing Groups -->
    <!-- Your Groups (joined) -->
    <h4>Your Groups</h4>

    <no-group-found
      v-if="joinedGroups.length === 0"
      :search-query="searchQuery"
    />

    <div v-else class="space-y-4 mb-6">
      <div
        v-for="group in joinedGroups"
        :key="group.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <!-- Group Header -->
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-lg">{{ group.name }}</h3>
            <el-button
              size="small"
              text
              :title="isPinned(group.id) ? 'Unpin group' : 'Pin group'"
              @click="togglePin(group.id)"
            >
              {{ isPinned(group.id) ? '📌' : '📍' }}
            </el-button>
          </div>

          <!-- Notifications for current user -->
          <group-notifications-for-current-user
            :group="group"
            :hide-notification="hideNotification"
          />

          <!-- Group Details Accordion -->

          <group-details-accordion
            :group="group"
            :group-type="'joined'"
            :load-group-balances="loadGroupBalances"
            :display-mobile-for-group="displayMobileForGroup"
          >
            <template #your-position>
              <!-- Your Position -->
              <your-position-in-group
                :group="group"
                :get-group-balances="getGroupBalances"
              />
            </template>
          </group-details-accordion>
          <!-- Action Buttons - Responsive Layout -->
          <group-action-buttons
            :group="group"
            :select-group="selectGroup"
            :request-leave-group="requestLeaveGroup"
            :show-add-member-dialog="showAddMemberDialog"
            :edit-group="editGroup"
            :show-transfer-ownership-dialog="showTransferOwnershipDialog"
            :cancel-join-request="cancelJoinRequest"
            :request-to-join="requestToJoinGroup"
            :request-group-deletion="requestGroupDeletion"
            :delete-group="deleteGroup"
          />
        </div>
        <group-request-buttons
          :group="group"
          :get-join-requests="getJoinRequests"
          :approve-member-join-request="approveMemberJoinRequest"
          :reject-join-request="rejectJoinRequest"
          :final-approve-join-request="finalApproveJoinRequest"
          :approve-group-deletion="approveGroupDeletion"
          :reject-group-deletion="rejectGroupDeletion"
          :approve-leave-request="approveLeaveRequest"
          :reject-leave-request="rejectLeaveRequest"
          :approve-edit-request="approveEditRequest"
          :reject-edit-request="rejectEditRequest"
          :approve-add-member-request="approveAddMemberRequest"
          :reject-add-member-request="rejectAddMemberRequest"
          :finalize-add-member="finalizeAddMember"
          :approve-ownership-transfer="approveOwnershipTransfer"
          :reject-ownership-transfer="rejectOwnershipTransfer"
        />
      </div>
    </div>

    <!-- Other Groups (not joined) -->
    <h4 class="mt-6">Other Groups</h4>

    <no-group-found
      v-if="otherGroups.length === 0"
      :search-query="searchQuery"
    />

    <div v-else class="space-y-4">
      <div
        v-for="group in otherGroups"
        :key="group.id"
        class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      >
        <!-- Group Header -->
        <div class="mb-3">
          <h3 class="font-semibold text-lg mb-2">{{ group.name }}</h3>

          <!-- Notifications for current user -->
          <group-notifications-for-current-user
            :group="group"
            :hide-notification="hideNotification"
          />

          <!-- Group Details Accordion -->
          <group-details-accordion
            :group="group"
            :group-type="'other'"
            :load-group-balances="loadGroupBalances"
            :display-mobile-for-group="displayMobileForGroup"
          />
          <!-- Action Buttons - Responsive Layout -->

          <group-action-buttons
            :group="group"
            :select-group="selectGroup"
            :request-leave-group="requestLeaveGroup"
            :show-add-member-dialog="showAddMemberDialog"
            :edit-group="editGroup"
            :show-transfer-ownership-dialog="showTransferOwnershipDialog"
            :cancel-join-request="cancelJoinRequest"
            :request-to-join="requestToJoinGroup"
            :request-group-deletion="requestGroupDeletion"
            :delete-group="deleteGroup"
          />
        </div>

        <group-request-buttons
          :group="group"
          :get-join-requests="getJoinRequests"
          :approve-member-join-request="approveMemberJoinRequest"
          :reject-join-request="rejectJoinRequest"
          :final-approve-join-request="finalApproveJoinRequest"
          :approve-group-deletion="approveGroupDeletion"
          :reject-group-deletion="rejectGroupDeletion"
          :approve-leave-request="approveLeaveRequest"
          :reject-leave-request="rejectLeaveRequest"
          :approve-edit-request="approveEditRequest"
          :reject-edit-request="rejectEditRequest"
          :approve-add-member-request="approveAddMemberRequest"
          :reject-add-member-request="rejectAddMemberRequest"
          :finalize-add-member="finalizeAddMember"
          :approve-ownership-transfer="approveOwnershipTransfer"
          :reject-ownership-transfer="rejectOwnershipTransfer"
        />
      </div>
    </div>
    <!-- </fieldset> -->

    <!-- Edit Group Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Edit Group"
      width="90%"
      style="max-width: 500px"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Group Name">
          <el-input v-model="editForm.name" placeholder="Enter group name" />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="Enter group description (optional)"
          />
        </el-form-item>

        <el-form-item label="Members">
          <el-select
            filterable
            v-model="editForm.members"
            multiple
            placeholder="Select members"
            class="w-full"
          >
            <el-option
              v-for="u in userStore.getUsers"
              :key="u.mobile"
              :label="`${u.name} (${displayMobileInEditDialog(u.mobile)})`"
              :value="u.mobile"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="updateGroup">Save</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Add Member Dialog (for non-admin members) -->
    <el-dialog
      v-model="addMemberDialogVisible"
      title="Request to Add Member"
      width="90%"
      style="max-width: 500px"
    >
      <el-form label-position="top">
        <el-form-item label="Select Member to Add">
          <el-select
            v-model="selectedMemberToAdd"
            filterable
            placeholder="Select member"
            class="w-full"
          >
            <el-option
              v-for="u in availableUsersToAdd"
              :key="u.mobile"
              :label="`${u.name} (${displayMasked(u.mobile)})`"
              :value="u.mobile"
            />
          </el-select>
        </el-form-item>
        <el-alert
          title="All current members must approve before this member can be added"
          type="info"
          :closable="false"
        />
      </el-form>

      <template #footer>
        <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <el-button @click="addMemberDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitAddMemberRequest"
            >Send Request</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- Transfer Ownership Dialog -->
    <el-dialog
      v-model="transferDialogVisible"
      title="Transfer Ownership"
      width="90%"
      style="max-width: 500px"
    >
      <el-form label-position="top">
        <el-form-item label="Select New Owner">
          <el-select
            v-model="newOwnerMobile"
            filterable
            placeholder="Select new owner"
            class="w-full"
          >
            <el-option
              v-for="member in transferOwnershipMembers"
              :key="member.mobile"
              :label="`${member.name} (${member.mobile})`"
              :value="member.mobile"
            />
          </el-select>
        </el-form-item>
        <el-alert
          title="All members must approve this transfer"
          type="warning"
          :closable="false"
        />
      </el-form>

      <template #footer>
        <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <el-button @click="transferDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="requestOwnershipTransfer"
            >Request Transfer</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { displayMasked } from '../helpers/users'
import { Groups } from '../scripts/groups.js'
import GroupDetailsAccordion from './generic-components/GroupDetailsAccordion.vue'
import YourPositionInGroup from './generic-components/YourPositionInGroup.vue'
import GroupActionButtons from './generic-components/GroupActionButtons.vue'
import GroupRequestButtons from './generic-components/GroupRequestButtons.vue'
const GroupsCreate = defineAsyncComponent(() => import('./GroupsCreate.vue'))
const AddNewTransactionButton = defineAsyncComponent(
  () => import('./generic-components/AddNewTransactionButton.vue')
)
const NoGroupFound = defineAsyncComponent(
  () => import('./generic-components/NoGroupFound.vue')
)

const {
  // Refs / reactive
  showCreateGroup,
  searchQuery,
  joinedGroups,
  otherGroups,
  editDialogVisible,
  editForm,
  transferDialogVisible,
  newOwnerMobile,
  transferOwnershipMembers,
  addMemberDialogVisible,
  selectedMemberToAdd,
  availableUsersToAdd,
  userStore,

  isPinned,
  togglePin,

  // Group actions
  openCreateGroup,
  closeCreateGroup,
  selectGroup,
  editGroup,
  updateGroup,
  deleteGroup,
  requestGroupDeletion,
  approveGroupDeletion,
  rejectGroupDeletion,

  // Join request
  getJoinRequests,
  requestToJoinGroup,
  cancelJoinRequest,
  approveMemberJoinRequest,
  finalApproveJoinRequest,
  rejectJoinRequest,

  // Leave group actions
  requestLeaveGroup,
  approveLeaveRequest,
  rejectLeaveRequest,

  // Edit request actions
  approveEditRequest,
  rejectEditRequest,

  // Add member request actions
  approveAddMemberRequest,
  finalizeAddMember,
  rejectAddMemberRequest,
  showAddMemberDialog,
  submitAddMemberRequest,

  // Notifications
  hideNotification,

  // Mobile display helpers
  displayMobileForGroup,
  displayMobileInEditDialog,

  // Ownership transfer
  showTransferOwnershipDialog,
  requestOwnershipTransfer,
  approveOwnershipTransfer,
  rejectOwnershipTransfer,

  // Financial snapshot
  loadGroupBalances,
  getGroupBalances
} = Groups()
</script>

<style scoped>
/* Smooth transitions for hover effects */
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}

/* Override Element Plus default button sibling margin in flex column */
/* .flex.flex-col .el-button + .el-button {
  margin-left: 0 !important;
  flex-direction: row !important;
} */
</style>
