<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="space-y-4">
    <LoadingSkeleton v-if="isPageLoading" mode="page" />
    <template v-else>
      <!-- Add Group Button / Create Group Form -->
      <Transition name="form-slide" mode="out-in">
        <div v-if="!showCreateGroup" key="btn">
          <add-new-transaction-button
            text="Want to create a new group?"
            @click="openCreateGroup"
          />
        </div>

        <!-- Create Group Form -->
        <div v-else key="form">
          <groups-create @group-created="closeCreateGroup">
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
          </groups-create>
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

      <!-- Sort & Filter controls — always one row -->
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
      <!-- Pending Invitations -->
      <div v-if="pendingInvitations.length > 0" class="mb-4">
        <h4 class="mb-2">
          Pending Invitations
          <el-badge
            :value="pendingInvitations.length"
            type="warning"
            class="ml-1"
          />
        </h4>
        <div
          v-for="group in pendingInvitations"
          :key="group.id"
          class="border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-3 bg-orange-50 dark:bg-orange-900/10"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <div class="font-semibold text-gray-800 dark:text-gray-100">
                {{ group.name }}
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Invited by
                  <span class="font-medium">
                    {{
                      userStore.getUserByMobile(group.ownerMobile)?.name ||
                      group.ownerMobile
                    }}
                    ({{ displayMobileForGroup(group.ownerMobile, group) }})
                  </span>
                </div>
                <div
                  v-if="group.category"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  Category:
                  <span class="font-medium">{{ group.category }}</span>
                </div>
              </div>
              <div
                v-if="group.description"
                class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic"
              >
                {{ group.description }}
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <el-button
                size="small"
                type="success"
                @click="acceptInvitation(group.id)"
              >
                Accept
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                @click="rejectInvitation(group.id)"
              >
                Decline
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-divider v-if="joinedGroups.length > 0" />
      <!-- Existing Groups -->
      <!-- Your Groups (joined) -->
      <h4>Joined Groups</h4>

      <no-group-found
        v-if="joinedGroups.length === 0"
        :search-query="searchQuery"
        variant="joined"
      />

      <div v-else class="space-y-4 mb-6">
        <div
          v-for="group in joinedGroups"
          :key="group.id"
          :id="`group-card-${group.id}`"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <!-- Group Header -->
          <div class="mb-3">
            <div class="flex flex-col mb-2">
              <div class="flex items-center justify-between flex-wrap">
                <h3 class="font-semibold text-lg">{{ group.name }}</h3>
                <!-- Pin button - visible on desktop only -->
                <el-button
                  size="small"
                  text
                  class="hidden sm:inline-flex"
                  :title="isPinned(group.id) ? 'Unpin group' : 'Pin to top'"
                  :type="isPinned(group.id) ? 'warning' : 'info'"
                  @click="togglePin(group.id)"
                >
                  {{ isPinned(group.id) ? '⭐ Pinned' : '☆ Pin' }}
                </el-button>
                <!-- Dropdown menu for small screens -->
                <el-dropdown trigger="click" class="sm:hidden">
                  <el-icon :size="20" class="vertical-dots">
                    <MoreFilled />
                  </el-icon>

                  <template #dropdown>
                    <!-- Pin option in dropdown for mobile -->
                    <el-dropdown-item @click="togglePin(group.id)">
                      <span
                        :class="isPinned(group.id) ? 'text-orange-500' : ''"
                      >
                        {{ isPinned(group.id) ? '⭐ Unpin' : '☆ Pin' }}
                      </span>
                    </el-dropdown-item>
                    <el-dropdown-item divided disabled>
                      <span class="text-xs text-gray-400">Actions</span>
                    </el-dropdown-item>
                    <!-- Group actions -->
                    <el-dropdown-item
                      v-for="action in getGroupActions(group)"
                      :key="action.label"
                      :disabled="action.disabled"
                      @click="action.onClick"
                    >
                      <span
                        :class="{ 'text-red-500': action.type === 'danger' }"
                      >
                        {{ action.label }}
                      </span>
                    </el-dropdown-item>
                  </template>
                </el-dropdown>
              </div>
              <div
                class="flex flex-wrap items-center justify-between gap-y-0.5 mt-0.5"
              >
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
            <!-- Action Buttons - Responsive Layout (visible on sm screens and above) -->
            <group-action-buttons
              class="hidden sm:flex"
              :actions="getGroupActions(group)"
            />
          </div>
          <group-request-buttons
            :group="group"
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
          />
        </div>
      </div>

      <!-- Other Groups (not joined) -->
      <h4 class="mt-6">Available Groups</h4>

      <no-group-found
        v-if="otherGroups.length === 0"
        :search-query="searchQuery"
        variant="available"
      />

      <div v-else class="space-y-4">
        <div
          v-for="group in otherGroups"
          :key="group.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <!-- Group Header -->
          <div class="mb-3">
            <h3 class="font-semibold text-lg mb-0.5">{{ group.name }}</h3>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-0.5 mb-2">
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
            <!-- Action Buttons - Responsive Layout (visible on sm screens and above) -->

            <group-action-buttons
              class="hidden sm:flex"
              :actions="getGroupActions(group)"
            />
          </div>

          <group-request-buttons
            :group="group"
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
        <el-form
          :model="editForm"
          :rules="groupRules"
          ref="editFormRef"
          label-position="top"
        >
          <GenericInputField
            v-model="editForm.name"
            label="Group Name"
            prop="name"
            placeholder="Enter group name"
            :maxlength="50"
          />

          <GenericInputField
            v-model="editForm.description"
            label="Description"
            type="textarea"
            :rows="3"
            placeholder="Enter group description (optional)"
            :maxlength="100"
          />

          <GenericDropDown
            v-model="editForm.members"
            label="Members"
            prop="members"
            :options="editMemberOptions"
            placeholder="Select members"
            size="small"
            multiple
          />
        </el-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button
              size="small"
              @click="editDialogVisible = false"
              style="min-width: 80px"
            >
              Cancel
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleEditSave"
              style="min-width: 80px"
            >
              Save
            </el-button>
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
          <GenericDropDown
            v-model="selectedMemberToAdd"
            label="Select Member to Add"
            :options="availableUsersToAddOptions"
            placeholder="Select member"
            size="small"
          />
          <el-alert
            title="All current members must approve before this member can be added"
            type="info"
            :closable="false"
          />
        </el-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button
              size="small"
              @click="addMemberDialogVisible = false"
              style="min-width: 100px"
            >
              Cancel
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="submitAddMemberRequest"
              style="min-width: 100px"
            >
              Send Request
            </el-button>
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
          <GenericDropDown
            v-model="newOwnerMobile"
            label="Select New Owner"
            :options="transferOwnershipOptions"
            placeholder="Select new owner"
            size="small"
          />
          <el-alert
            title="The selected member must accept this transfer before it takes effect."
            type="info"
            :closable="false"
          />
        </el-form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <el-button
              size="small"
              @click="transferDialogVisible = false"
              style="min-width: 120px"
            >
              Cancel
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="requestOwnershipTransfer"
              style="min-width: 120px"
            >
              Request Transfer
            </el-button>
          </div>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<script setup>
import LoadingSkeleton from '../shared/LoadingSkeleton.vue'
import { groupRules } from '../../assets/validation-rules'
import { Groups } from '../../scripts/groups/groups'
import GenericInputField from '../generic-components/GenericInputField.vue'
import GroupDetailsAccordion from '../generic-components/GroupDetailsAccordion.vue'
import YourPositionInGroup from '../generic-components/YourPositionInGroup.vue'
import GroupActionButtons from '../generic-components/GroupActionButtons.vue'
import GroupRequestButtons from '../generic-components/GroupRequestButtons.vue'
import GroupNotificationsForCurrentUser from '../generic-components/GroupNotificationsForCurrentUser.vue'
import { GenericDropDown } from '../generic-components'
import { loadAsyncComponent } from '../../utils/async-component'
const GroupsCreate = loadAsyncComponent(() => import('./GroupsCreate.vue'))
const AddNewTransactionButton = loadAsyncComponent(
  () => import('../generic-components/AddNewTransactionButton.vue')
)
const NoGroupFound = loadAsyncComponent(
  () => import('../generic-components/NoGroupFound.vue')
)
import { MoreFilled } from '@element-plus/icons-vue'

const {
  // Refs / reactive
  showCreateGroup,
  searchQuery,
  sortOrder,
  filterByUser,
  filterByCategory,
  allGroupMemberOptions,
  allCategoryOptions,
  joinedGroups,
  otherGroups,
  pendingInvitations,
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
  userStore,

  isPinned,
  togglePin,

  // Group actions
  openCreateGroup,
  closeCreateGroup,
  approveGroupDeletion,
  rejectGroupDeletion,

  // Join request
  getJoinRequests,
  approveMemberJoinRequest,
  rejectJoinRequest,

  // Leave group actions (invoked internally via getGroupActions)

  // Edit request actions
  approveEditRequest,
  rejectEditRequest,

  // Add member request actions
  approveAddMemberRequest,
  finalizeAddMember,
  rejectAddMemberRequest,
  submitAddMemberRequest,

  // Notifications
  hideNotification,

  // Mobile display helpers
  displayMobileForGroup,

  // Ownership transfer
  requestOwnershipTransfer,
  approveOwnershipTransfer,
  rejectOwnershipTransfer,

  // Financial snapshot
  loadGroupBalances,
  getGroupBalances,

  // Group actions helper
  getGroupActions,

  // Edit form
  isPageLoading,
  editFormRef,
  handleEditSave
} = Groups()
</script>

<style scoped>
/* Smooth transitions for hover effects */
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}
.vertical-dots {
  /* Rotate 90 degrees to make it vertical */
  transform: rotate(90deg);
  cursor: pointer;
}
</style>
