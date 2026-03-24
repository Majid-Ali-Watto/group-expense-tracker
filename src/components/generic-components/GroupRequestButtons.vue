<template>
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
            {{ formatMember(request, { preferMasked: true }) }}
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
            v-for="approval in getJoinRequestApprovals(group, request.mobile)"
            :key="approval.mobile"
            size="small"
            type="success"
          >
            ✓ {{ formatMember(approval) }}
          </el-tag>
          <el-tag
            v-for="member in getPendingJoinApprovals(group, request.mobile)"
            :key="member.mobile"
            size="small"
            type="info"
          >
            ⏳ {{ formatMember(member) }}
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
        <div v-else class="text-xs text-green-700">
          ✓ You have approved this request
          <span
            v-if="
              group.ownerMobile === authStore.getActiveUser &&
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
      Owner has requested to delete this group. All members must approve before
      deletion.
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
        ✓ {{ formatMember(approval) }}
      </el-tag>
      <el-tag
        v-for="member in getPendingApprovals(group)"
        :key="member.mobile"
        size="small"
        type="info"
      >
        ⏳ {{ formatMember(member) }}
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

  <!-- Edit Requests (visible to all affected members) -->
  <div
    v-if="hasEditRequest(group) && isUserAffectedByEdit(group)"
    class="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded"
  >
    <div class="text-sm font-medium text-blue-800 mb-2">
      📝 Group Edit Request
    </div>
    <div class="text-xs text-blue-700 mb-2">
      Requested by: {{ formatUser(group.editRequest.requestedBy) }}
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
          {{ formatMember(member)
          }}{{ i < group.editRequest.addedMembers.length - 1 ? ', ' : '' }}
        </span>
      </div>
      <div v-if="group.editRequest.removedMembers?.length > 0" class="mb-1">
        <strong>Removing:</strong>
        <span
          v-for="(member, i) in group.editRequest.removedMembers"
          :key="member.mobile"
        >
          {{ formatMember(member)
          }}{{ i < group.editRequest.removedMembers.length - 1 ? ', ' : '' }}
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
        ✓ {{ formatMember(approval) }}
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
      Requested by: {{ formatUser(group.addMemberRequest.requestedBy) }}
    </div>
    <div class="text-xs text-gray-700 mb-2">
      <strong>New Member:</strong>
      {{
        formatMember(group.addMemberRequest.newMember, { preferMasked: true })
      }}
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
        ✓ {{ formatMember(approval) }}
      </el-tag>
    </div>

    <!-- Non-admin approval/reject -->
    <div v-if="!hasUserApprovedAddMemberRequest(group)" class="flex gap-2">
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
        group.ownerMobile === authStore.getActiveUser &&
        allMembersApprovedAddMember(group)
      "
      class="mt-2"
    >
      <el-button
        type="primary"
        size="small"
        @click="finalizeAddMember(group.id)"
      >
        Add Member Now
      </el-button>
    </div>
  </div>

  <!-- Ownership Transfer Requests (visible to all members; action only for the new owner) -->
  <div
    v-if="group.transferOwnershipRequest && isMemberOfGroup(group)"
    class="mt-3 pt-3 border-t border-purple-200 bg-purple-50 p-3 rounded"
  >
    <div class="text-sm font-medium text-purple-800 mb-2">
      👑 Ownership Transfer Request
    </div>
    <div class="text-xs text-purple-700 mb-2">
      Transfer ownership to:
      {{ formatUser(group.transferOwnershipRequest.newOwner) }}
    </div>
    <div class="text-xs text-purple-600 mb-2">
      Awaiting acceptance from the designated new owner.
    </div>
    <div v-if="isCurrentUserPendingOwner(group)" class="flex gap-2">
      <el-button
        size="small"
        type="success"
        @click="approveOwnershipTransfer(group.id)"
      >
        Accept Ownership
      </el-button>
      <el-button
        size="small"
        type="danger"
        @click="rejectOwnershipTransfer(group.id)"
      >
        Decline
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {
  isMemberOfGroup,
  getJoinRequestApprovals,
  getPendingJoinApprovals,
  hasUserApprovedJoinRequest,
  allMembersApprovedJoinRequest,
  hasDeleteRequest,
  getDeleteApprovals,
  getPendingApprovals,
  hasUserApprovedDeletion,
  hasEditRequest,
  getEditApprovals,
  getAllAffectedMembers,
  hasUserApprovedEditRequest,
  isUserAffectedByEdit,
  hasAddMemberRequest,
  getAddMemberRequestApprovals,
  allMembersApprovedAddMember,
  hasUserApprovedAddMemberRequest,
  isCurrentUserPendingOwner
} from '../../helpers/users'
import { useAuthStore } from '../../stores/authStore'
import { useUserStore } from '../../stores/userStore'
import {
  formatMemberDisplay,
  formatUserDisplay
} from '../../utils/user-display'

const authStore = useAuthStore()
const userStore = useUserStore()
const storeProxy = {
  get getActiveUser() {
    return authStore.getActiveUser
  },
  getUserByMobile: (m) => userStore.getUserByMobile(m)
}

const props = defineProps({
  group: {
    type: Object,
    required: true
  },
  getJoinRequests: {
    type: Function,
    required: true
  },
  approveMemberJoinRequest: {
    type: Function,
    required: true
  },
  rejectJoinRequest: {
    type: Function,
    required: true
  },
  approveGroupDeletion: {
    type: Function,
    required: true
  },
  rejectGroupDeletion: {
    type: Function,
    required: true
  },
  approveEditRequest: {
    type: Function,
    required: true
  },
  rejectEditRequest: {
    type: Function,
    required: true
  },
  approveAddMemberRequest: {
    type: Function,
    required: true
  },
  rejectAddMemberRequest: {
    type: Function,
    required: true
  },
  finalizeAddMember: {
    type: Function,
    required: true
  },
  approveOwnershipTransfer: {
    type: Function,
    required: true
  },
  rejectOwnershipTransfer: {
    type: Function,
    required: true
  }
})

const formatUser = (mobile) =>
  formatUserDisplay(storeProxy, mobile, { group: props.group })

const formatMember = (member, options = {}) =>
  formatMemberDisplay(storeProxy, member, {
    group: props.group,
    ...options
  })
</script>
