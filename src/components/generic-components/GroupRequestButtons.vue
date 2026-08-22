<template>
  <!-- Join Requests (visible to all members) -->
  <div
    v-if="getJoinRequests(group.id).length > 0 && isMemberOfGroup(group)"
    class="mt-3 pt-3 border-t border-gray-200"
  >
    <div class="text-sm font-medium text-gray-700 mb-2">
      {{
        t('groups.joinRequestsCount', {
          count: getJoinRequests(group.id).length
        })
      }}
    </div>
    <div class="space-y-2">
      <div
        v-for="request in getJoinRequests(group.id)"
        :key="request.uid"
        class="bg-yellow-50 p-2 rounded"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">
            {{ formatMember(request, { preferMasked: true }) }}
          </span>
        </div>
        <!-- Show approval progress -->
        <div class="text-xs text-gray-600 mb-1">
          {{
            t('groups.approvalsCount', {
              approved: getJoinRequestApprovals(group, request.uid).length,
              total: group.members.length
            })
          }}
        </div>
        <div class="flex flex-wrap gap-1 mb-2">
          <el-tag
            v-for="approval in getJoinRequestApprovals(group, request.uid)"
            :key="approval.uid"
            size="small"
            type="success"
          >
            ✓ {{ formatMember(approval) }}
          </el-tag>
          <el-tag
            v-for="member in getPendingJoinApprovals(group, request.uid)"
            :key="member.uid"
            size="small"
            type="info"
          >
            ⏳ {{ formatMember(member) }}
          </el-tag>
        </div>
        <!-- Member actions -->
        <div
          v-if="!hasUserApprovedJoinRequest(group, request.uid)"
          class="flex gap-1"
        >
          <el-button
            size="default"
            type="success"
            @click="approveMemberJoinRequest(group.id, request.uid)"
          >
            {{ t('common.approve') }}
          </el-button>
          <el-button
            size="default"
            type="danger"
            @click="rejectJoinRequest(group.id, request.uid)"
          >
            {{ t('common.reject') }}
          </el-button>
        </div>
        <div v-else class="text-xs text-green-700">
          {{ t('groups.approvedThisRequest') }}
          <span
            v-if="
              group.ownerUid === authStore.getActiveUserUid &&
              !allMembersApprovedJoinRequest(group, request.uid)
            "
          >
            {{ t('groups.waitingForAllApprove') }}
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
      {{ t('groups.groupDeletionRequestTitle') }}
    </div>
    <div class="text-xs text-red-700 mb-2">
      {{ t('groups.deletionRequestNotice') }}
    </div>
    <div class="text-sm text-red-700 mb-2">
      {{
        t('groups.approvalsCount', {
          approved: getDeleteApprovals(group).length,
          total: group.members.length
        })
      }}
    </div>
    <!-- Show who has approved -->
    <div class="flex flex-wrap gap-1 mb-2">
      <el-tag
        v-for="approval in getDeleteApprovals(group)"
        :key="approval.uid"
        size="small"
        type="success"
      >
        ✓ {{ formatMember(approval) }}
      </el-tag>
      <el-tag
        v-for="member in getPendingApprovals(group)"
        :key="member.uid"
        size="small"
        type="info"
      >
        ⏳ {{ formatMember(member) }}
      </el-tag>
    </div>
    <!-- Approve/Reject buttons for current user -->
    <div v-if="!hasUserApprovedDeletion(group)" class="flex gap-2">
      <el-button
        size="default"
        type="success"
        @click="approveGroupDeletion(group.id)"
      >
        {{ t('groups.approveDeletion') }}
      </el-button>
      <el-button
        size="default"
        type="danger"
        @click="rejectGroupDeletion(group.id)"
      >
        {{ t('groups.rejectDeletion') }}
      </el-button>
    </div>
    <div v-else class="text-xs text-green-700">
      {{ t('groups.approvedThisDeletion') }}
    </div>
  </div>

  <!-- Edit Requests (visible to all affected members) -->
  <div
    v-if="hasEditRequest(group) && isUserAffectedByEdit(group)"
    class="mt-3 pt-3 border-t border-blue-200 bg-blue-50 p-3 rounded"
  >
    <div class="text-sm font-medium text-blue-800 mb-2">
      {{ t('groups.groupEditRequestTitle') }}
    </div>
    <div class="text-xs text-blue-700 mb-2">
      {{
        t('groups.requestedByLabel', {
          name: formatUser(group.editRequest.requestedBy)
        })
      }}
    </div>

    <!-- Show what's changing -->
    <div class="text-xs text-gray-700 mb-2">
      <div v-if="group.name !== group.editRequest.name" class="mb-1">
        <strong>{{ t('groups.nameChangeLabel') }}</strong> {{ group.name }} →
        {{ group.editRequest.name }}
      </div>
      <div v-if="group.editRequest.addedMembers?.length > 0" class="mb-1">
        <strong>{{ t('groups.addingLabel') }}</strong>
        <span
          v-for="(member, i) in group.editRequest.addedMembers"
          :key="member.uid"
        >
          {{ formatMember(member)
          }}{{ i < group.editRequest.addedMembers.length - 1 ? ', ' : '' }}
        </span>
      </div>
      <div v-if="group.editRequest.removedMembers?.length > 0" class="mb-1">
        <strong>{{ t('groups.removingLabel') }}</strong>
        <span
          v-for="(member, i) in group.editRequest.removedMembers"
          :key="member.uid"
        >
          {{ formatMember(member)
          }}{{ i < group.editRequest.removedMembers.length - 1 ? ', ' : '' }}
        </span>
      </div>
    </div>

    <div class="text-sm text-blue-700 mb-2">
      {{
        t('groups.approvalsCount', {
          approved: getEditApprovals(group).length,
          total: getAllAffectedMembers(group).length
        })
      }}
    </div>
    <div class="flex flex-wrap gap-1 mb-2">
      <el-tag
        v-for="approval in getEditApprovals(group)"
        :key="approval.uid"
        size="small"
        type="success"
      >
        ✓ {{ formatMember(approval) }}
      </el-tag>
    </div>
    <div v-if="!hasUserApprovedEditRequest(group)" class="flex gap-2">
      <el-button
        size="default"
        type="success"
        @click="approveEditRequest(group.id)"
      >
        {{ t('common.approve') }}
      </el-button>
      <el-button
        size="default"
        type="danger"
        @click="rejectEditRequest(group.id)"
      >
        {{ t('common.reject') }}
      </el-button>
    </div>
    <div v-else class="text-xs text-green-700">
      {{ t('groups.approvedThisEdit') }}
    </div>
  </div>

  <!-- Add Member Requests (visible to all members) -->
  <div
    v-if="hasAddMemberRequest(group) && isMemberOfGroup(group)"
    class="mt-3 pt-3 border-t border-green-200 bg-green-50 p-3 rounded"
  >
    <div class="text-sm font-medium text-green-800 mb-2">
      {{ t('groups.addMemberRequestTitle') }}
    </div>
    <div class="text-xs text-green-700 mb-2">
      {{
        t('groups.requestedByLabel', {
          name: formatUser(group.addMemberRequest.requestedBy)
        })
      }}
    </div>
    <div class="text-xs text-gray-700 mb-2">
      <strong>{{ t('groups.newMemberLabel') }}</strong>
      {{
        formatMember(group.addMemberRequest.newMember, { preferMasked: true })
      }}
    </div>
    <div class="text-sm text-green-700 mb-2">
      {{
        t('groups.approvalsCount', {
          approved: getAddMemberRequestApprovals(group).length,
          total: group.members.length
        })
      }}
    </div>
    <div class="flex flex-wrap gap-1 mb-2">
      <el-tag
        v-for="approval in getAddMemberRequestApprovals(group)"
        :key="approval.uid"
        size="small"
        type="success"
      >
        ✓ {{ formatMember(approval) }}
      </el-tag>
    </div>

    <!-- Non-admin approval/reject -->
    <div v-if="!hasUserApprovedAddMemberRequest(group)" class="flex gap-2">
      <el-button
        size="default"
        type="success"
        @click="approveAddMemberRequest(group.id)"
      >
        {{ t('common.approve') }}
      </el-button>
      <el-button
        size="default"
        type="danger"
        @click="rejectAddMemberRequest(group.id)"
      >
        {{ t('common.reject') }}
      </el-button>
    </div>
    <div v-else class="text-xs text-green-700 mb-2">
      {{ t('groups.approvedThisAddRequest') }}
    </div>

    <!-- Admin finalize button when all approved -->
    <div
      v-if="
        group.ownerUid === authStore.getActiveUserUid &&
        allMembersApprovedAddMember(group)
      "
      class="mt-2"
    >
      <el-button
        type="primary"
        size="default"
        @click="finalizeAddMember(group.id)"
      >
        {{ t('groups.addMemberNow') }}
      </el-button>
    </div>
  </div>

  <!-- Ownership Transfer Requests (visible to all members; action only for the new owner) -->
  <div
    v-if="group.transferOwnershipRequest && isMemberOfGroup(group)"
    class="mt-3 pt-3 border-t border-purple-200 bg-purple-50 p-3 rounded"
  >
    <div class="text-sm font-medium text-purple-800 mb-2">
      {{ t('groups.ownershipTransferRequestTitle') }}
    </div>
    <div class="text-xs text-purple-700 mb-2">
      {{ t('groups.currentOwnershipLabel') }}
      {{ formatUser(group.transferOwnershipRequest.requestedBy) }}
    </div>
    <div class="text-xs text-purple-700 mb-2">
      {{ t('groups.transferOwnershipToLabel') }}
      {{ formatUser(group.transferOwnershipRequest.newOwner) }}
    </div>
    <div class="text-xs text-purple-600 mb-2">
      {{ t('groups.awaitingNewOwnerAcceptance') }}
    </div>
    <div v-if="isCurrentUserPendingOwner(group)" class="flex gap-2">
      <el-button
        size="default"
        type="success"
        @click="approveOwnershipTransfer(group.id)"
      >
        {{ t('groups.acceptOwnership') }}
      </el-button>
      <el-button
        size="default"
        type="danger"
        @click="rejectOwnershipTransfer(group.id)"
      >
        {{ t('groups.declineOwnership') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
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
} from '@/helpers'
import { formatMemberDisplay, formatUserDisplay } from '@/utils'
import { useStoreProxy } from '@/composables'
import { useAuthStore } from '@/stores'

const { t } = useI18n()
const storeProxy = useStoreProxy()
const authStore = useAuthStore()

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
