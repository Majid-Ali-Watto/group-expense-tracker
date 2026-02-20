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
        size="large"
      >
        <template #prefix>
          <span class="text-gray-400">🔍</span>
        </template>
      </el-input>
    </div>

    <!-- Existing Groups -->
    <!-- Your Groups (joined) -->
    <h4>Your Groups</h4>

    <div
      v-if="joinedGroups.length === 0"
      class="text-center text-gray-500 py-4"
    >
      <span v-if="searchQuery">No joined groups match your search.</span>
      <span v-else>You haven't joined any group yet.</span>
    </div>

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
          <div
            v-if="getUserNotifications(group).length > 0"
            class="mb-3 space-y-1"
          >
            <div
              v-for="notif in getUserNotifications(group)"
              :key="notif.id"
              class="bg-blue-50 border border-blue-200 p-2 rounded flex justify-between items-center"
            >
              <div class="text-xs text-blue-800">
                <span class="font-medium">{{ notif.message }}</span>
                <span class="text-gray-600 ml-2"
                  >(by {{ notif.updatedByName || notif.rejectedByName }})</span
                >
              </div>
              <el-button
                size="small"
                text
                @click="hideNotification(group.id, notif.id)"
              >
                ✕
              </el-button>
            </div>
          </div>

          <!-- Group Details Accordion -->
          <el-collapse class="mb-3">
            <el-collapse-item>
              <template #title>
                <span class="text-sm font-medium text-gray-600">
                  <svg
                    class="inline-block w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Details
                </span>
              </template>

              <div class="space-y-3 pt-2">
                <!-- Description -->
                <div v-if="group.description">
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Description
                  </div>
                  <div class="text-sm text-gray-700 italic">
                    {{ group.description }}
                  </div>
                </div>

                <!-- Group Code -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Group Code
                  </div>
                  <div
                    class="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block"
                  >
                    {{ group.id }}
                  </div>
                </div>

                <!-- Owner -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Owner
                  </div>
                  <div class="text-sm text-gray-700">
                    {{
                      userStore.getUserByMobile(group.ownerMobile)?.name +
                        ` (${displayMobileForGroup(group.ownerMobile, group)})` || group.ownerMobile
                    }}
                  </div>
                </div>

                <!-- Members List -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-2">
                    Members ({{ group.members.length }})
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="(member, i) in group.members"
                      :key="i"
                      size="small"
                      type="info"
                    >
                      {{ member.name }} ({{ displayMobileForGroup(member.mobile, group) }})
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <!-- Action Buttons - Responsive Layout -->
          <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <!-- Member Actions -->
            <template v-if="isMemberOfGroup(group)">
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="primary"
                @click="selectGroup(group.id)"
              >
                Select
              </el-button>

              <!-- Leave Pending -->
              <el-button
                v-if="
                  hasLeaveRequest(group, userStore.getActiveUser) &&
                  !allMembersApprovedLeave(group, userStore.getActiveUser)
                "
                class="w-full sm:w-fit"
                size="small"
                disabled
              >
                Leave Pending ({{
                  getLeaveApprovals(group, userStore.getActiveUser).length
                }}/{{ group.members.length }})
              </el-button>

              <!-- Leave Button -->
              <el-button
                v-else-if="!hasLeaveRequest(group, userStore.getActiveUser)"
                class="w-full sm:w-fit"
                size="small"
                type="warning"
                @click="requestLeaveGroup(group.id)"
              >
                Leave
              </el-button>

              <!-- Add Member (for non-admin members) -->
              <el-button
                v-if="
                  group.ownerMobile !== userStore.getActiveUser &&
                  !hasAddMemberRequest(group)
                "
                class="w-full sm:w-fit"
                size="small"
                type="success"
                @click="showAddMemberDialog(group.id)"
              >
                Add Member
              </el-button>

              <!-- Edit -->
              <el-button
                class="w-full sm:w-fit"
                size="small"
                @click="editGroup(group.id)"
                :disabled="group.ownerMobile !== userStore.getActiveUser"
              >
                Edit
              </el-button>

              <!-- Transfer Ownership -->
              <el-button
                v-if="
                  group.ownerMobile === userStore.getActiveUser &&
                  group.members.length > 1
                "
                class="w-full sm:w-fit"
                size="small"
                @click="showTransferOwnershipDialog(group.id)"
              >
                Transfer Ownership
              </el-button>
            </template>

            <!-- Pending Join Request -->
            <template v-else-if="hasPendingRequest(group)">
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="warning"
                @click="cancelJoinRequest(group.id)"
              >
                Cancel Request
              </el-button>
            </template>

            <!-- Request to Join -->
            <template v-else>
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="success"
                @click="requestToJoinGroup(group.id)"
              >
                Request to Join
              </el-button>
            </template>

            <!-- Owner Delete Controls -->
            <template v-if="group.ownerMobile === userStore.getActiveUser">
              <!-- Delete Now -->
              <el-button
                v-if="hasDeleteRequest(group) && allMembersApproved(group)"
                class="w-full sm:w-fit"
                size="small"
                type="danger"
                @click="deleteGroup(group.id)"
              >
                Delete Now ({{ getDeleteApprovals(group).length }}/{{
                  group.members.length
                }})
              </el-button>

              <!-- Delete Pending -->
              <el-button
                v-else-if="hasDeleteRequest(group)"
                class="w-full sm:w-fit"
                size="small"
                disabled
              >
                Delete Pending ({{ getDeleteApprovals(group).length }}/{{
                  group.members.length
                }})
              </el-button>

              <!-- Request Delete -->
              <el-button
                v-else
                class="w-full sm:w-fit"
                size="small"
                type="danger"
                @click="requestGroupDeletion(group.id)"
              >
                Request Delete
              </el-button>
            </template>
          </div>
        </div>

        <!-- Join Requests (visible to all members) -->
        <div
          v-if="getJoinRequests(group.id).length > 0 && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-gray-200"
        >
          <div class="text-sm font-medium text-gray-700 mb-2">
            Join Requests ({{ getJoinRequests(group.id).length }}):
          </div>
          <div class="space-y-2">
            <div
              v-for="request in getJoinRequests(group.id)"
              :key="request.mobile"
              class="bg-yellow-50 p-2 rounded"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">
                  {{ request.name }} ({{ displayMasked(request.mobile) }})
                </span>
              </div>
              <!-- Show approval progress -->
              <div class="text-xs text-gray-600 mb-1">
                Approvals:
                {{ getJoinRequestApprovals(group, request.mobile).length }} /
                {{ group.members.length }}
              </div>
              <div class="flex flex-wrap gap-1 mb-2">
                <el-tag
                  v-for="approval in getJoinRequestApprovals(
                    group,
                    request.mobile
                  )"
                  :key="approval.mobile"
                  size="small"
                  type="success"
                >
                  ✓ {{ approval.name }}
                </el-tag>
                <el-tag
                  v-for="member in getPendingJoinApprovals(
                    group,
                    request.mobile
                  )"
                  :key="member.mobile"
                  size="small"
                  type="info"
                >
                  ⏳ {{ member.name }}
                </el-tag>
              </div>
              <!-- Member actions -->
              <div
                v-if="!hasUserApprovedJoinRequest(group, request.mobile)"
                class="flex gap-1"
              >
                <el-button
                  size="small"
                  type="success"
                  @click="approveMemberJoinRequest(group.id, request.mobile)"
                >
                  Approve
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="rejectJoinRequest(group.id, request.mobile)"
                >
                  Reject
                </el-button>
              </div>
              <!-- Final action when all approved - owner or any member if no owner -->
              <div
                v-else-if="
                  allMembersApprovedJoinRequest(group, request.mobile) &&
                  (group.ownerMobile === userStore.getActiveUser ||
                    !group.members.some((m) => m.mobile === group.ownerMobile))
                "
                class="flex gap-1"
              >
                <el-button
                  size="small"
                  type="primary"
                  @click="finalApproveJoinRequest(group.id, request)"
                >
                  Add to Group
                </el-button>
              </div>
              <div v-else class="text-xs text-green-700">
                ✓ You have approved this request
                <span
                  v-if="
                    group.ownerMobile === userStore.getActiveUser &&
                    !allMembersApprovedJoinRequest(group, request.mobile)
                  "
                >
                  - Waiting for all members to approve
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Request (visible to all members) -->
        <div
          v-if="hasDeleteRequest(group) && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-red-200 bg-red-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-red-800 mb-2">
            ⚠️ Group Deletion Request
          </div>
          <div class="text-xs text-red-700 mb-2">
            Owner has requested to delete this group. All members must approve
            before deletion.
          </div>
          <div class="text-sm text-red-700 mb-2">
            Approvals: {{ getDeleteApprovals(group).length }} /
            {{ group.members.length }}
          </div>
          <!-- Show who has approved -->
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getDeleteApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
            <el-tag
              v-for="member in getPendingApprovals(group)"
              :key="member.mobile"
              size="small"
              type="info"
            >
              ⏳ {{ member.name }}
            </el-tag>
          </div>
          <!-- Approve/Reject buttons for current user -->
          <div v-if="!hasUserApprovedDeletion(group)" class="flex gap-2">
            <el-button
              size="small"
              type="success"
              @click="approveGroupDeletion(group.id)"
            >
              Approve Deletion
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="rejectGroupDeletion(group.id)"
            >
              Reject Deletion
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this deletion request
          </div>
        </div>

        <!-- Leave Requests (visible to all members) -->
        <div
          v-if="getLeaveRequests(group).length > 0 && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-orange-200 bg-orange-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-orange-800 mb-2">
            🚪 Leave Group Requests
          </div>
          <div class="space-y-2">
            <div
              v-for="leaveReq in getLeaveRequests(group)"
              :key="leaveReq.mobile"
              class="bg-white p-2 rounded border border-orange-200"
            >
              <div class="text-sm font-medium mb-1">
                {{ leaveReq.name }} wants to leave
              </div>
              <div class="text-xs text-gray-600 mb-1">
                Approvals: {{ leaveReq.approvals?.length || 0 }} /
                {{ group.members.length }}
              </div>
              <div class="flex flex-wrap gap-1 mb-2">
                <el-tag
                  v-for="approval in leaveReq.approvals || []"
                  :key="approval.mobile"
                  size="small"
                  type="success"
                >
                  ✓ {{ approval.name }}
                </el-tag>
              </div>
              <div
                v-if="
                  leaveReq.mobile !== userStore.getActiveUser &&
                  !hasUserApprovedLeaveRequest(group, leaveReq.mobile)
                "
                class="flex gap-2"
              >
                <el-button
                  size="small"
                  type="success"
                  @click="approveLeaveRequest(group.id, leaveReq.mobile)"
                >
                  Approve
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="rejectLeaveRequest(group.id, leaveReq.mobile)"
                >
                  Reject
                </el-button>
              </div>
              <div
                v-else-if="leaveReq.mobile === userStore.getActiveUser"
                class="text-xs text-blue-700"
              >
                Waiting for members approval...
              </div>
              <div v-else class="text-xs text-green-700">
                ✓ You have approved
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Requests (visible to all affected members) -->
        <div
          v-if="hasEditRequest(group) && isUserAffectedByEdit(group)"
          class="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-blue-800 mb-2">
            📝 Group Edit Request
          </div>
          <div class="text-xs text-blue-700 mb-2">
            Requested by: {{ group.editRequest.requestedByName }}
          </div>

          <!-- Show what's changing -->
          <div class="text-xs text-gray-700 mb-2">
            <div v-if="group.name !== group.editRequest.name" class="mb-1">
              <strong>Name:</strong> {{ group.name }} →
              {{ group.editRequest.name }}
            </div>
            <div v-if="group.editRequest.addedMembers?.length > 0" class="mb-1">
              <strong>Adding:</strong>
              <span
                v-for="(member, i) in group.editRequest.addedMembers"
                :key="member.mobile"
              >
                {{ member.name
                }}{{
                  i < group.editRequest.addedMembers.length - 1 ? ', ' : ''
                }}
              </span>
            </div>
            <div
              v-if="group.editRequest.removedMembers?.length > 0"
              class="mb-1"
            >
              <strong>Removing:</strong>
              <span
                v-for="(member, i) in group.editRequest.removedMembers"
                :key="member.mobile"
              >
                {{ member.name
                }}{{
                  i < group.editRequest.removedMembers.length - 1 ? ', ' : ''
                }}
              </span>
            </div>
          </div>

          <div class="text-sm text-blue-700 mb-2">
            Approvals: {{ getEditApprovals(group).length }} /
            {{ getAllAffectedMembers(group).length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getEditApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>
          <div v-if="!hasUserApprovedEditRequest(group)" class="flex gap-2">
            <el-button
              size="small"
              type="success"
              @click="approveEditRequest(group.id)"
            >
              Approve
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="rejectEditRequest(group.id)"
            >
              Reject
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this edit
          </div>
        </div>

        <!-- Add Member Requests (visible to all members) -->
        <div
          v-if="hasAddMemberRequest(group) && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-green-800 mb-2">
            ➕ Add Member Request
          </div>
          <div class="text-xs text-green-700 mb-2">
            Requested by: {{ group.addMemberRequest.requestedByName }}
          </div>
          <div class="text-xs text-gray-700 mb-2">
            <strong>New Member:</strong>
            {{ group.addMemberRequest.newMember.name }} ({{
              displayMasked(group.addMemberRequest.newMember.mobile)
            }})
          </div>
          <div class="text-sm text-green-700 mb-2">
            Approvals: {{ getAddMemberRequestApprovals(group).length }} /
            {{ group.members.length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getAddMemberRequestApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>

          <!-- Non-admin approval/reject -->
          <div
            v-if="!hasUserApprovedAddMemberRequest(group)"
            class="flex gap-2"
          >
            <el-button
              size="small"
              type="success"
              @click="approveAddMemberRequest(group.id)"
            >
              Approve
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="rejectAddMemberRequest(group.id)"
            >
              Reject
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700 mb-2">
            ✓ You have approved this request
          </div>

          <!-- Admin finalize button when all approved -->
          <div
            v-if="
              group.ownerMobile === userStore.getActiveUser &&
              allMembersApprovedAddMember(group)
            "
            class="mt-2"
          >
            <el-button type="primary" @click="finalizeAddMember(group.id)">
              Add Member Now
            </el-button>
          </div>
        </div>

        <!-- Ownership Transfer Requests (visible to all members) -->
        <div
          v-if="group.transferOwnershipRequest && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-purple-200 bg-purple-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-purple-800 mb-2">
            👑 Ownership Transfer Request
          </div>
          <div class="text-xs text-purple-700 mb-2">
            Transfer ownership to:
            {{
              userStore.getUserByMobile(group.transferOwnershipRequest.newOwner)
                ?.name || group.transferOwnershipRequest.newOwner
            }}
          </div>
          <div class="text-sm text-purple-700 mb-2">
            Approvals:
            {{ group.transferOwnershipRequest.approvals?.length || 0 }} /
            {{ group.members.length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in group.transferOwnershipRequest.approvals || []"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>
          <div
            v-if="!hasUserApprovedOwnershipTransfer(group)"
            class="flex gap-2"
          >
            <el-button
              size="small"
              type="success"
              @click="approveOwnershipTransfer(group.id)"
            >
              Approve Transfer
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="rejectOwnershipTransfer(group.id)"
            >
              Reject Transfer
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this transfer
          </div>
        </div>
      </div>
    </div>

    <!-- Other Groups (not joined) -->
    <h4 class="mt-6">Other Groups</h4>

    <div
      v-if="otherGroups.length === 0"
      class="text-center text-gray-500 py-4"
    >
      <span v-if="searchQuery">No other groups match your search.</span>
      <span v-else>No other groups available.</span>
    </div>

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
          <div
            v-if="getUserNotifications(group).length > 0"
            class="mb-3 space-y-1"
          >
            <div
              v-for="notif in getUserNotifications(group)"
              :key="notif.id"
              class="bg-blue-50 border border-blue-200 p-2 rounded flex justify-between items-center"
            >
              <div class="text-xs text-blue-800">
                <span class="font-medium">{{ notif.message }}</span>
                <span class="text-gray-600 ml-2"
                  >(by {{ notif.updatedByName || notif.rejectedByName }})</span
                >
              </div>
              <el-button
                size="small"
                text
                @click="hideNotification(group.id, notif.id)"
              >
                ✕
              </el-button>
            </div>
          </div>

          <!-- Group Details Accordion -->
          <el-collapse class="mb-3">
            <el-collapse-item>
              <template #title>
                <span class="text-sm font-medium text-gray-600">
                  <svg
                    class="inline-block w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Details
                </span>
              </template>

              <div class="space-y-3 pt-2">
                <!-- Description -->
                <div v-if="group.description">
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Description
                  </div>
                  <div class="text-sm text-gray-700 italic">
                    {{ group.description }}
                  </div>
                </div>

                <!-- Group Code -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Group Code
                  </div>
                  <div
                    class="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block"
                  >
                    {{ group.id }}
                  </div>
                </div>

                <!-- Owner -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-1">
                    Owner
                  </div>
                  <div class="text-sm text-gray-700">
                    {{
                      userStore.getUserByMobile(group.ownerMobile)?.name +
                        ` (${displayMobileForGroup(group.ownerMobile, group)})` || group.ownerMobile
                    }}
                  </div>
                </div>

                <!-- Members List -->
                <div>
                  <div class="text-xs font-medium text-gray-500 mb-2">
                    Members ({{ group.members.length }})
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="(member, i) in group.members"
                      :key="i"
                      size="small"
                      type="info"
                    >
                      {{ member.name }} ({{ displayMobileForGroup(member.mobile, group) }})
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>

          <!-- Action Buttons - Responsive Layout -->
          <div class="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <!-- Member Actions -->
            <template v-if="isMemberOfGroup(group)">
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="primary"
                @click="selectGroup(group.id)"
              >
                Select
              </el-button>

              <!-- Leave Pending -->
              <el-button
                v-if="
                  hasLeaveRequest(group, userStore.getActiveUser) &&
                  !allMembersApprovedLeave(group, userStore.getActiveUser)
                "
                class="w-full sm:w-fit"
                size="small"
                disabled
              >
                Leave Pending ({{
                  getLeaveApprovals(group, userStore.getActiveUser).length
                }}/{{ group.members.length }})
              </el-button>

              <!-- Leave Button -->
              <el-button
                v-else-if="!hasLeaveRequest(group, userStore.getActiveUser)"
                class="w-full sm:w-fit"
                size="small"
                type="warning"
                @click="requestLeaveGroup(group.id)"
              >
                Leave
              </el-button>

              <!-- Add Member (for non-admin members) -->
              <el-button
                v-if="
                  group.ownerMobile !== userStore.getActiveUser &&
                  !hasAddMemberRequest(group)
                "
                class="w-full sm:w-fit"
                size="small"
                type="success"
                @click="showAddMemberDialog(group.id)"
              >
                Add Member
              </el-button>

              <!-- Edit -->
              <el-button
                class="w-full sm:w-fit"
                size="small"
                @click="editGroup(group.id)"
                :disabled="group.ownerMobile !== userStore.getActiveUser"
              >
                Edit
              </el-button>

              <!-- Transfer Ownership -->
              <el-button
                v-if="
                  group.ownerMobile === userStore.getActiveUser &&
                  group.members.length > 1
                "
                class="w-full sm:w-fit"
                size="small"
                @click="showTransferOwnershipDialog(group.id)"
              >
                Transfer Ownership
              </el-button>
            </template>

            <!-- Pending Join Request -->
            <template v-else-if="hasPendingRequest(group)">
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="warning"
                @click="cancelJoinRequest(group.id)"
              >
                Cancel Request
              </el-button>
            </template>

            <!-- Request to Join -->
            <template v-else>
              <el-button
                class="w-full sm:w-fit"
                size="small"
                type="success"
                @click="requestToJoinGroup(group.id)"
              >
                Request to Join
              </el-button>
            </template>

            <!-- Owner Delete Controls -->
            <template v-if="group.ownerMobile === userStore.getActiveUser">
              <!-- Delete Now -->
              <el-button
                v-if="hasDeleteRequest(group) && allMembersApproved(group)"
                class="w-full sm:w-fit"
                size="small"
                type="danger"
                @click="deleteGroup(group.id)"
              >
                Delete Now ({{ getDeleteApprovals(group).length }}/{{
                  group.members.length
                }})
              </el-button>

              <!-- Delete Pending -->
              <el-button
                v-else-if="hasDeleteRequest(group)"
                class="w-full sm:w-fit"
                size="small"
                disabled
              >
                Delete Pending ({{ getDeleteApprovals(group).length }}/{{
                  group.members.length
                }})
              </el-button>

              <!-- Request Delete -->
              <el-button
                v-else
                class="w-full sm:w-fit"
                size="small"
                type="danger"
                @click="requestGroupDeletion(group.id)"
              >
                Request Delete
              </el-button>
            </template>
          </div>
        </div>

        <!-- Join Requests (visible to all members) -->
        <div
          v-if="getJoinRequests(group.id).length > 0 && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-gray-200"
        >
          <div class="text-sm font-medium text-gray-700 mb-2">
            Join Requests ({{ getJoinRequests(group.id).length }}):
          </div>
          <div class="space-y-2">
            <div
              v-for="request in getJoinRequests(group.id)"
              :key="request.mobile"
              class="bg-yellow-50 p-2 rounded"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">
                  {{ request.name }} ({{ displayMasked(request.mobile) }})
                </span>
              </div>
              <div class="text-xs text-gray-600 mb-1">
                Approvals:
                {{ getJoinRequestApprovals(group, request.mobile).length }} /
                {{ group.members.length }}
              </div>
              <div class="flex flex-wrap gap-1 mb-2">
                <el-tag
                  v-for="approval in getJoinRequestApprovals(group, request.mobile)"
                  :key="approval.mobile"
                  size="small"
                  type="success"
                >
                  ✓ {{ approval.name }}
                </el-tag>
                <el-tag
                  v-for="member in getPendingJoinApprovals(group, request.mobile)"
                  :key="member.mobile"
                  size="small"
                  type="info"
                >
                  ⏳ {{ member.name }}
                </el-tag>
              </div>
              <div
                v-if="!hasUserApprovedJoinRequest(group, request.mobile)"
                class="flex gap-1"
              >
                <el-button
                  size="small"
                  type="success"
                  @click="approveMemberJoinRequest(group.id, request.mobile)"
                >
                  Approve
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="rejectJoinRequest(group.id, request.mobile)"
                >
                  Reject
                </el-button>
              </div>
              <div
                v-else-if="
                  allMembersApprovedJoinRequest(group, request.mobile) &&
                  (group.ownerMobile === userStore.getActiveUser ||
                    !group.members.some((m) => m.mobile === group.ownerMobile))
                "
                class="flex gap-1"
              >
                <el-button
                  size="small"
                  type="primary"
                  @click="finalApproveJoinRequest(group.id, request)"
                >
                  Add to Group
                </el-button>
              </div>
              <div v-else class="text-xs text-green-700">
                ✓ You have approved this request
                <span
                  v-if="
                    group.ownerMobile === userStore.getActiveUser &&
                    !allMembersApprovedJoinRequest(group, request.mobile)
                  "
                >
                  - Waiting for all members to approve
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Request (visible to all members) -->
        <div
          v-if="hasDeleteRequest(group) && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-red-200 bg-red-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-red-800 mb-2">
            ⚠️ Group Deletion Request
          </div>
          <div class="text-xs text-red-700 mb-2">
            Owner has requested to delete this group. All members must approve
            before deletion.
          </div>
          <div class="text-sm text-red-700 mb-2">
            Approvals: {{ getDeleteApprovals(group).length }} /
            {{ group.members.length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getDeleteApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
            <el-tag
              v-for="member in getPendingApprovals(group)"
              :key="member.mobile"
              size="small"
              type="info"
            >
              ⏳ {{ member.name }}
            </el-tag>
          </div>
          <div v-if="!hasUserApprovedDeletion(group)" class="flex gap-2">
            <el-button
              size="small"
              type="success"
              @click="approveGroupDeletion(group.id)"
            >
              Approve Deletion
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="rejectGroupDeletion(group.id)"
            >
              Reject Deletion
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this deletion request
          </div>
        </div>

        <!-- Leave Requests (visible to all members) -->
        <div
          v-if="getLeaveRequests(group).length > 0 && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-orange-200 bg-orange-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-orange-800 mb-2">
            🚪 Leave Group Requests
          </div>
          <div class="space-y-2">
            <div
              v-for="leaveReq in getLeaveRequests(group)"
              :key="leaveReq.mobile"
              class="bg-white p-2 rounded border border-orange-200"
            >
              <div class="text-sm font-medium mb-1">
                {{ leaveReq.name }} wants to leave
              </div>
              <div class="text-xs text-gray-600 mb-1">
                Approvals: {{ leaveReq.approvals?.length || 0 }} /
                {{ group.members.length }}
              </div>
              <div class="flex flex-wrap gap-1 mb-2">
                <el-tag
                  v-for="approval in leaveReq.approvals || []"
                  :key="approval.mobile"
                  size="small"
                  type="success"
                >
                  ✓ {{ approval.name }}
                </el-tag>
              </div>
              <div
                v-if="
                  leaveReq.mobile !== userStore.getActiveUser &&
                  !hasUserApprovedLeaveRequest(group, leaveReq.mobile)
                "
                class="flex gap-2"
              >
                <el-button
                  size="small"
                  type="success"
                  @click="approveLeaveRequest(group.id, leaveReq.mobile)"
                >
                  Approve
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="rejectLeaveRequest(group.id, leaveReq.mobile)"
                >
                  Reject
                </el-button>
              </div>
              <div
                v-else-if="leaveReq.mobile === userStore.getActiveUser"
                class="text-xs text-blue-700"
              >
                Waiting for members approval...
              </div>
              <div v-else class="text-xs text-green-700">
                ✓ You have approved
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Requests (visible to all affected members) -->
        <div
          v-if="hasEditRequest(group) && isUserAffectedByEdit(group)"
          class="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-blue-800 mb-2">
            📝 Group Edit Request
          </div>
          <div class="text-xs text-blue-700 mb-2">
            Requested by: {{ group.editRequest.requestedByName }}
          </div>
          <div class="text-xs text-gray-700 mb-2">
            <div v-if="group.name !== group.editRequest.name" class="mb-1">
              <strong>Name:</strong> {{ group.name }} →
              {{ group.editRequest.name }}
            </div>
            <div v-if="group.editRequest.addedMembers?.length > 0" class="mb-1">
              <strong>Adding:</strong>
              <span
                v-for="(member, i) in group.editRequest.addedMembers"
                :key="member.mobile"
              >
                {{ member.name }}{{ i < group.editRequest.addedMembers.length - 1 ? ', ' : '' }}
              </span>
            </div>
            <div v-if="group.editRequest.removedMembers?.length > 0" class="mb-1">
              <strong>Removing:</strong>
              <span
                v-for="(member, i) in group.editRequest.removedMembers"
                :key="member.mobile"
              >
                {{ member.name }}{{ i < group.editRequest.removedMembers.length - 1 ? ', ' : '' }}
              </span>
            </div>
          </div>
          <div class="text-sm text-blue-700 mb-2">
            Approvals: {{ getEditApprovals(group).length }} /
            {{ getAllAffectedMembers(group).length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getEditApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>
          <div v-if="!hasUserApprovedEditRequest(group)" class="flex gap-2">
            <el-button size="small" type="success" @click="approveEditRequest(group.id)">
              Approve
            </el-button>
            <el-button size="small" type="danger" @click="rejectEditRequest(group.id)">
              Reject
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this edit
          </div>
        </div>

        <!-- Add Member Requests (visible to all members) -->
        <div
          v-if="hasAddMemberRequest(group) && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-green-800 mb-2">
            ➕ Add Member Request
          </div>
          <div class="text-xs text-green-700 mb-2">
            Requested by: {{ group.addMemberRequest.requestedByName }}
          </div>
          <div class="text-xs text-gray-700 mb-2">
            <strong>New Member:</strong>
            {{ group.addMemberRequest.newMember.name }} ({{
              displayMasked(group.addMemberRequest.newMember.mobile)
            }})
          </div>
          <div class="text-sm text-green-700 mb-2">
            Approvals: {{ getAddMemberRequestApprovals(group).length }} /
            {{ group.members.length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in getAddMemberRequestApprovals(group)"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>
          <div v-if="!hasUserApprovedAddMemberRequest(group)" class="flex gap-2">
            <el-button size="small" type="success" @click="approveAddMemberRequest(group.id)">
              Approve
            </el-button>
            <el-button size="small" type="danger" @click="rejectAddMemberRequest(group.id)">
              Reject
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700 mb-2">
            ✓ You have approved this request
          </div>
          <div
            v-if="group.ownerMobile === userStore.getActiveUser && allMembersApprovedAddMember(group)"
            class="mt-2"
          >
            <el-button type="primary" @click="finalizeAddMember(group.id)">
              Add Member Now
            </el-button>
          </div>
        </div>

        <!-- Ownership Transfer Requests (visible to all members) -->
        <div
          v-if="group.transferOwnershipRequest && isMemberOfGroup(group)"
          class="mt-3 pt-3 border-t border-purple-200 bg-purple-50 p-3 rounded"
        >
          <div class="text-sm font-medium text-purple-800 mb-2">
            👑 Ownership Transfer Request
          </div>
          <div class="text-xs text-purple-700 mb-2">
            Transfer ownership to:
            {{
              userStore.getUserByMobile(group.transferOwnershipRequest.newOwner)
                ?.name || group.transferOwnershipRequest.newOwner
            }}
          </div>
          <div class="text-sm text-purple-700 mb-2">
            Approvals:
            {{ group.transferOwnershipRequest.approvals?.length || 0 }} /
            {{ group.members.length }}
          </div>
          <div class="flex flex-wrap gap-1 mb-2">
            <el-tag
              v-for="approval in group.transferOwnershipRequest.approvals || []"
              :key="approval.mobile"
              size="small"
              type="success"
            >
              ✓ {{ approval.name }}
            </el-tag>
          </div>
          <div v-if="!hasUserApprovedOwnershipTransfer(group)" class="flex gap-2">
            <el-button size="small" type="success" @click="approveOwnershipTransfer(group.id)">
              Approve Transfer
            </el-button>
            <el-button size="small" type="danger" @click="rejectOwnershipTransfer(group.id)">
              Reject Transfer
            </el-button>
          </div>
          <div v-else class="text-xs text-green-700">
            ✓ You have approved this transfer
          </div>
        </div>
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
import GroupsCreate from './GroupsCreate.vue'
import { Groups } from '../scripts/groups.js'
import AddNewTransactionButton from './generic-components/AddNewTransactionButton.vue'

const {
  // Refs / reactive
  showCreateGroup,
  searchQuery,
  joinedGroups,
  otherGroups,
  isPinned,
  togglePin,
  editDialogVisible,
  editForm,
  transferDialogVisible,
  newOwnerMobile,
  transferOwnershipMembers,
  addMemberDialogVisible,
  selectedMemberToAdd,
  availableUsersToAdd,
  userStore,

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
  getJoinRequestApprovals,
  getPendingJoinApprovals,
  hasUserApprovedJoinRequest,
  allMembersApprovedJoinRequest,

  // Membership checks
  isMemberOfGroup,
  hasPendingRequest,

  // Delete request helpers
  hasDeleteRequest,
  getDeleteApprovals,
  allMembersApproved,
  getPendingApprovals,
  hasUserApprovedDeletion,

  // Leave group
  getLeaveRequests,
  hasLeaveRequest,
  getLeaveApprovals,
  allMembersApprovedLeave,
  hasUserApprovedLeaveRequest,
  requestLeaveGroup,
  approveLeaveRequest,
  rejectLeaveRequest,

  // Edit request
  hasEditRequest,
  getEditApprovals,
  getAllAffectedMembers,
  hasUserApprovedEditRequest,
  isUserAffectedByEdit,
  approveEditRequest,
  rejectEditRequest,

  // Add member request
  hasAddMemberRequest,
  getAddMemberRequestApprovals,
  hasUserApprovedAddMemberRequest,
  allMembersApprovedAddMember,
  approveAddMemberRequest,
  finalizeAddMember,
  rejectAddMemberRequest,
  showAddMemberDialog,
  submitAddMemberRequest,

  // Notifications
  getUserNotifications,
  hideNotification,

  // Mobile display helpers
  displayMobileForGroup,
  displayMasked,
  displayMobileInEditDialog,

  // Ownership transfer
  hasUserApprovedOwnershipTransfer,
  showTransferOwnershipDialog,
  requestOwnershipTransfer,
  approveOwnershipTransfer,
  rejectOwnershipTransfer
} = Groups()
</script>

<style scoped>
/* Smooth transitions for hover effects */
.hover\:shadow-md {
  transition: box-shadow 0.2s ease-in-out;
}

/* Override Element Plus default button sibling margin in flex column */
.flex.flex-col .el-button + .el-button {
  margin-left: 0 !important;
}
</style>
