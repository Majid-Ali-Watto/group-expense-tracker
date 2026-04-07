<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-4">
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
      <!-- Add Group Button / Create Group Form -->
      <Transition name="form-slide" mode="out-in">
        <div v-if="!showCreateGroup" key="btn">
          <AddNewTransactionButton
            text="Want to create a new group?"
            @click="openCreateGroup"
          />
        </div>
        <div v-else key="form">
          <GroupsCreate @group-created="closeCreateGroup">
            <template #clear>
              <el-button
                type="info"
                plain
                size="small"
                @click="closeCreateGroup"
              >
                Cancel
              </el-button>
            </template>
          </GroupsCreate>
        </div>
      </Transition>

      <!-- Search Bar -->
      <div class="mb-2">
        <GenericInputField
          v-model="searchQuery"
          placeholder="Search by group name, code, owner, or member..."
          :maxlength="50"
          :wrap-form-item="false"
        >
          <template #prefix>
            <span class="text-gray-400">🔍</span>
          </template>
        </GenericInputField>
      </div>

      <!-- Sort & Filter controls -->
      <div class="flex items-center gap-2 mb-4 min-w-0">
        <el-button-group size="small" class="flex-shrink-0">
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
        <GenericDropDown
          v-model="filterByCategory"
          :options="allCategoryOptions"
          placeholder="Category"
          size="small"
          select-class="w-full"
          class="flex-1 min-w-0"
          :wrap-form-item="false"
        />
        <GenericDropDown
          v-model="filterByUser"
          :options="allGroupMemberOptions"
          placeholder="Member"
          size="small"
          select-class="w-full"
          class="flex-1 min-w-0"
          :wrap-form-item="false"
        />
      </div>

      <GroupPendingInvitations
        :invitations="pendingInvitations"
        :display-mobile-for-group="displayMobileForGroup"
        @accept="acceptInvitation"
        @reject="rejectInvitation"
      />

      <el-divider v-if="joinedGroups.length > 0" />

      <!-- Joined Groups -->
      <div class="flex items-center justify-between gap-1">
        <h4 class="mb-0">Joined Groups</h4>
        <div class="flex items-center gap-1">
          <GenericButton
            size="small"
            plain
            type="warning"
            :disabled="pinnedGroupsForShare.length === 0"
            custom-class="!w-fit !px-1"
            @click="sharePinnedGroups"
          >
            Share Pinned
          </GenericButton>
          <GenericButton
            size="small"
            plain
            type="primary"
            :disabled="joinedGroupsForShare.length === 0"
            custom-class="!w-fit !px-1"
            @click="shareJoinedGroups"
          >
            Share Joined
          </GenericButton>
        </div>
      </div>

      <NoGroupFound
        v-if="joinedGroups.length === 0"
        :search-query="searchQuery"
        variant="joined"
      />
      <div v-else class="space-y-4 mb-6">
        <GroupJoinedCard
          v-for="group in joinedGroups"
          :key="group.id"
          :group="group"
          :pinned="isPinned(group.id)"
          :actions="getGroupActions(group)"
          :display-mobile-for-group="displayMobileForGroup"
          :hide-notification="hideNotification"
          :load-group-balances="loadGroupBalances"
          :get-group-balances="getGroupBalances"
          :get-join-requests="getJoinRequests"
          :approve-member-join-request="approveMemberJoinRequest"
          :reject-join-request="rejectJoinRequest"
          :approve-group-deletion="approveGroupDeletion"
          :reject-group-deletion="rejectGroupDeletion"
          :approve-edit-request="approveEditRequest"
          :reject-edit-request="rejectEditRequest"
          :approve-add-member-request="approveAddMemberRequest"
          :reject-add-member-request="rejectAddMemberRequest"
          :finalize-add-member="finalizeAddMember"
          :approve-ownership-transfer="approveOwnershipTransfer"
          :reject-ownership-transfer="rejectOwnershipTransfer"
          @toggle-pin="togglePin"
        />
      </div>

      <!-- Available Groups -->
      <h4 class="mt-6">Available Groups</h4>
      <NoGroupFound
        v-if="otherGroups.length === 0"
        :search-query="searchQuery"
        variant="available"
      />
      <div v-else class="space-y-4">
        <GroupAvailableCard
          v-for="group in otherGroups"
          :key="group.id"
          :group="group"
          :actions="getGroupActions(group)"
          :display-mobile-for-group="displayMobileForGroup"
          :load-group-balances="loadGroupBalances"
        />
      </div>
      <div v-if="hasMoreAvailableGroups" class="mt-4 flex justify-center">
        <GenericButton
          type="default"
          :loading="availableGroupsLoading"
          @click="loadMoreAvailableGroups()"
        >
          Load More Groups
        </GenericButton>
      </div>

      <GroupEditDialog
        v-model="editDialogVisible"
        :form="editForm"
        :member-options="editMemberOptions"
        @save="handleEditSave"
      />

      <GroupAddMemberDialog
        v-model="addMemberDialogVisible"
        :selected-member="selectedMemberToAdd"
        :member-options="availableUsersToAddOptions"
        @update:selectedMember="selectedMemberToAdd = $event"
        @submit="submitAddMemberRequest"
        @reset="resetAddMemberForm"
      />

      <GroupTransferOwnershipDialog
        v-model="transferDialogVisible"
        :new-owner="newOwnerMobile"
        :owner-options="transferOwnershipOptions"
        @update:newOwner="newOwnerMobile = $event"
        @submit="requestOwnershipTransfer"
      />
    </template>
  </div>
</template>

<script setup>
import { LoadingSkeleton } from '@/components/shared'
import { Groups } from '@/scripts/groups'
import {
  GenericInputField,
  GenericButton,
  GenericDropDown
} from '@/components/generic-components'
import { loadAsyncComponent } from '@/utils'
import GroupPendingInvitations from './GroupPendingInvitations.vue'
import GroupJoinedCard from './GroupJoinedCard.vue'
import GroupAvailableCard from './GroupAvailableCard.vue'
import GroupEditDialog from './GroupEditDialog.vue'
import GroupAddMemberDialog from './GroupAddMemberDialog.vue'
import GroupTransferOwnershipDialog from './GroupTransferOwnershipDialog.vue'

const GroupsCreate = loadAsyncComponent(() => import('./GroupsCreate.vue'))
const AddNewTransactionButton = loadAsyncComponent(
  () => import('../generic-components/AddNewTransactionButton.vue')
)
const NoGroupFound = loadAsyncComponent(
  () => import('../generic-components/NoGroupFound.vue')
)

const {
  showCreateGroup,
  searchQuery,
  sortOrder,
  filterByUser,
  filterByCategory,
  allGroupMemberOptions,
  allCategoryOptions,
  joinedGroups,
  otherGroups,
  availableGroupsLoading,
  hasMoreAvailableGroups,
  pendingInvitations,
  loadMoreAvailableGroups,
  acceptInvitation,
  rejectInvitation,
  editDialogVisible,
  editForm,
  editMemberOptions,
  transferDialogVisible,
  newOwnerMobile,
  transferOwnershipOptions,
  addMemberDialogVisible,
  selectedMemberToAdd,
  availableUsersToAddOptions,

  isPinned,
  togglePin,
  joinedGroupsForShare,
  pinnedGroupsForShare,
  shareJoinedGroups,
  sharePinnedGroups,

  openCreateGroup,
  closeCreateGroup,
  approveGroupDeletion,
  rejectGroupDeletion,

  getJoinRequests,
  approveMemberJoinRequest,
  rejectJoinRequest,

  approveEditRequest,
  rejectEditRequest,

  approveAddMemberRequest,
  finalizeAddMember,
  rejectAddMemberRequest,
  submitAddMemberRequest,
  resetAddMemberForm,

  hideNotification,
  displayMobileForGroup,

  requestOwnershipTransfer,
  approveOwnershipTransfer,
  rejectOwnershipTransfer,

  loadGroupBalances,
  getGroupBalances,
  getGroupActions,

  isPageLoading,
  updateGroup
} = Groups()

function handleEditSave(formData) {
  editForm.value = formData
  updateGroup()
}
</script>
