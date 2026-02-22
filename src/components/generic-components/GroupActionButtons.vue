<template>
  <div class="flex flex-row justify-between flex-wrap gap-2">
    <!-- Member Actions -->
    <template v-if="isMemberOfGroup(group)">
      <el-button
        class="w-fit"
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
        class="w-fit"
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
        class="w-fit"
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
        class="w-fit"
        size="small"
        type="success"
        @click="showAddMemberDialog(group.id)"
      >
        Add Member
      </el-button>

      <!-- Edit -->
      <el-button
        class="w-fit"
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
        class="w-fit"
        size="small"
        @click="showTransferOwnershipDialog(group.id)"
      >
        Transfer Ownership
      </el-button>
    </template>

    <!-- Pending Join Request -->
    <template v-else-if="hasPendingRequest(group)">
      <el-button
        class="w-fit"
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
        class="w-fit"
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
        class="w-fit"
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
        class="w-fit"
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
        class="w-fit"
        size="small"
        type="danger"
        @click="requestGroupDeletion(group.id)"
      >
        Request Delete
      </el-button>
    </template>
  </div>
</template>
<script setup>
import {
  isMemberOfGroup,
  hasPendingRequest,
  hasLeaveRequest,
  allMembersApprovedLeave,
  getLeaveApprovals,
  hasDeleteRequest,
  getDeleteApprovals,
  allMembersApproved,
  hasAddMemberRequest
} from '../../helpers/users'
import { store } from '../../stores/store'

const userStore = store()

defineProps({
  group: {
    type: Object,
    required: true
  },
  requestToJoinGroup: {
    type: Function,
    required: true
  },
  cancelJoinRequest: {
    type: Function,
    required: true
  },
  requestLeaveGroup: {
    type: Function,
    required: true
  },
  showAddMemberDialog: {
    type: Function,
    required: true
  },
  editGroup: {
    type: Function,
    required: true
  },
  showTransferOwnershipDialog: {
    type: Function,
    required: true
  },
  requestGroupDeletion: {
    type: Function,
    required: true
  },
  deleteGroup: {
    type: Function,
    required: true
  },
  selectGroup: {
    type: Function,
    required: true
  }
})
</script>
