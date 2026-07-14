<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-4">
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
      <el-alert
        v-if="activeUserIsBlocked"
        :title="t('groups.blockedNotice')"
        type="warning"
        :closable="false"
      />

      <!-- Add Group Button / Create Group Form -->
      <Transition name="form-slide" mode="out-in">
        <div v-if="!showCreateGroup" key="btn">
          <div
            :class="{ 'pointer-events-none opacity-60': activeUserIsBlocked }"
          >
            <AddNewTransactionButton
              :text="t('groups.createPrompt')"
              @click="openCreateGroup"
            />
          </div>
        </div>
        <div v-else key="form">
          <GroupsCreate @group-created="onGroupCreated">
            <template #clear>
              <el-button
                type="info"
                plain
                size="medium"
                @click="closeCreateGroup"
              >
                {{ t('common.cancel') }}
              </el-button>
            </template>
          </GroupsCreate>
        </div>
      </Transition>

      <!-- Search Bar -->
      <div class="mb-2">
        <GenericInputField
          v-model="searchQuery"
          :placeholder="t('groups.searchPlaceholder')"
          :maxlength="50"
          :wrap-form-item="false"
        >
          <template #prefix>
            <span class="text-gray-400">🔍</span>
          </template>
        </GenericInputField>
      </div>

      <!-- Sort & Filter controls -->
      <div class="flex items-center gap-2 mb-2 min-w-0">
        <el-button-group size="medium" class="flex-shrink-0">
          <el-button
            :type="sortOrder === '' ? 'primary' : ''"
            @click="sortOrder = ''"
            >{{ t('groups.sortDefault') }}</el-button
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
        <GenericDropDown
          v-model="filterByCategory"
          :options="allCategoryOptions"
          :placeholder="t('groups.categoryPlaceholder')"
          size="medium"
          select-class="w-full"
          class="flex-1 min-w-0"
          :wrap-form-item="false"
        />
        <GenericDropDown
          v-model="filterByUser"
          :options="allGroupMemberOptions"
          :placeholder="t('groups.memberPlaceholder')"
          size="medium"
          select-class="w-full"
          class="flex-1 min-w-0"
          :wrap-form-item="false"
        />
      </div>
      <div class="mb-4">
        <el-checkbox v-model="hideBlockedEntities" size="small">
          {{ t('groups.hideBlockedGroups') }}
        </el-checkbox>
      </div>

      <GroupPendingInvitations
        :invitations="pendingInvitations"
        :display-mobile-for-group="displayMobileForGroup"
        :active-user-blocked="activeUserIsBlocked"
        @accept="acceptInvitation"
        @reject="rejectInvitation"
      />

      <el-divider v-if="joinedGroups.length > 0" />

      <!-- Joined Groups -->
      <div class="flex items-center justify-between gap-1">
        <h4 class="mb-0">{{ t('groups.joinedGroupsHeading') }}</h4>
        <div class="flex items-center gap-1">
          <GenericButton
            size="medium"
            plain
            type="warning"
            :disabled="pinnedGroupsForShare.length === 0"
            custom-class="!w-fit !px-1"
            @click="sharePinnedGroups"
          >
            {{ t('groups.sharePinned') }}
          </GenericButton>
          <GenericButton
            size="medium"
            plain
            type="primary"
            :disabled="joinedGroupsForShare.length === 0"
            custom-class="!w-fit !px-1"
            @click="shareJoinedGroups"
          >
            {{ t('groups.shareJoined') }}
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
          :active-user-blocked="activeUserIsBlocked"
          @toggle-pin="togglePin"
        />
      </div>

      <!-- Available Groups -->
      <h4 class="mt-6">{{ t('groups.availableGroupsHeading') }}</h4>
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
          :active-user-blocked="activeUserIsBlocked"
        />
      </div>
      <div v-if="hasMoreAvailableGroups" class="mt-4 flex justify-center">
        <GenericButton
          type="default"
          :loading="availableGroupsLoading"
          @click="loadMoreAvailableGroups()"
        >
          {{ t('groups.loadMoreGroups') }}
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
        :new-owner="newOwnerUid"
        :owner-options="transferOwnershipOptions"
        @update:newOwner="newOwnerUid = $event"
        @submit="requestOwnershipTransfer"
      />
    </template>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

const {
  showCreateGroup,
  searchQuery,
  sortOrder,
  filterByUser,
  filterByCategory,
  hideBlockedEntities,
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
  newOwnerUid,
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
  onGroupCreated,
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
  updateGroup,
  activeUserIsBlocked
} = Groups()

function handleEditSave(formData) {
  editForm.value = formData
  updateGroup()
}
</script>
