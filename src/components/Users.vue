<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="p-4">
    <add-new-transaction-button
      v-if="!showForm"
      text="Want to add a new user?"
      @click="setShowForm"
    />
    <fieldset
      v-else-if="showForm"
      class="border border-gray-300 p-4 rounded-md"
    >
      <legend class="mb-4 px-2 font-semibold text-gray-700">
        Add New User
      </legend>

      <el-form :model="form" :rules="rules" ref="userForm" label-position="top">
        <el-form-item label="Full Name" prop="name">
          <el-input v-model="form.name" placeholder="Full name" />
        </el-form-item>
        <el-form-item label="Mobile Number" prop="mobile">
          <el-input v-model="form.mobile" placeholder="Mobile number" />
        </el-form-item>
        <div class="flex justify-end">
          <el-button type="default" @click="setShowForm">Cancel</el-button>

          <el-button type="primary" @click="saveUser">Save User</el-button>
        </div>
      </el-form>
    </fieldset>

    <el-divider />

    <!-- Pending Approvals -->
    <div v-if="myPendingApprovals.length > 0" class="mb-4">
      <h4 class="mb-2">Pending Approvals</h4>
      <div
        v-for="item in myPendingApprovals"
        :key="`${item.user.mobile}-${item.type}`"
        class="border border-yellow-300 bg-yellow-50 rounded-lg p-3 mb-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ item.user.name }}</div>
            <div class="text-xs text-gray-600 mt-1">
              <span v-if="item.type === 'delete'">
                Delete request by
                <strong>{{ item.request.requestedByName }}</strong>
              </span>
              <span v-else>
                Rename to "<strong>{{ item.request.newName }}</strong
                >" — by
                {{ item.request.requestedByName }}
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

    <h3>Existing Users</h3>
    <el-input
      v-model="searchQuery"
      placeholder="Search by name, mobile, or group..."
      clearable
      class="mb-3"
    >
      <template #prefix><span class="text-gray-400">🔍</span></template>
    </el-input>
    <el-table :data="filteredUsers">
      <el-table-column prop="name" label="Name" />
      <el-table-column label="Mobile">
        <template #default="{ row }">{{ displayMobile(row.mobile) }}</template>
      </el-table-column>
      <el-table-column label="Login Code" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.loginCode" type="success" size="small">Set</el-tag>
          <el-tag v-else type="info" size="small">Not Set</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Groups">
        <template #default="{ row }">
          <div
            v-if="getUserGroups(row.mobile).length > 0"
            class="flex flex-wrap gap-1"
          >
            <el-tag
              v-for="group in getUserGroups(row.mobile)"
              :key="group"
              size="small"
              type="success"
            >
              {{ group }}
            </el-tag>
          </div>
          <span v-else class="text-gray-400 text-xs">None</span>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <!-- Reset login code (any row with loginCode set) -->
            <el-button
              v-if="row.loginCode && canManage(row)"
              type="warning"
              size="small"
              @click="resetLoginCode(row.mobile, row.name)"
            >
              Reset Code
            </el-button>

            <template v-if="canManage(row)">
              <!-- No pending request: show edit & delete -->
              <template v-if="!row.deleteRequest && !row.updateRequest">
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
              <el-button v-else-if="row.deleteRequest" size="small" disabled>
                Delete Pending ({{
                  row.deleteRequest.approvals?.length || 0
                }}/{{ row.deleteRequest.requiredApprovals?.length || 0 }})
              </el-button>

              <!-- Update pending -->
              <el-button v-else-if="row.updateRequest" size="small" disabled>
                Update Pending ({{
                  row.updateRequest.approvals?.length || 0
                }}/{{ row.updateRequest.requiredApprovals?.length || 0 }})
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- Edit User Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="Edit User"
      width="90%"
      style="max-width: 400px"
    >
      <el-form label-position="top">
        <el-form-item label="Mobile Number">
          <el-input :value="editForm.mobile" disabled />
        </el-form-item>
        <el-form-item label="Full Name">
          <el-input v-model="editForm.name" placeholder="Full name" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex gap-2 justify-end">
          <el-button @click="editDialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="submitUpdateUser">Save</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { loginRules as rules } from '../assets/validation-rules'
import { Users } from '../scripts/users'
import AddNewTransactionButton from './generic-components/AddNewTransactionButton.vue'

const {
  form,
  userForm,
  showForm,
  searchQuery,
  filteredUsers,
  editDialogVisible,
  editForm,
  myPendingApprovals,
  saveUser,
  resetLoginCode,
  displayMobile,
  getUserGroups,
  canManage,
  openEditUser,
  submitUpdateUser,
  requestDeleteUser,
  approveRequest,
  rejectRequest,
  setShowForm
} = Users()
</script>

<style scoped>
.el-table {
  margin-top: 12px;
}
</style>
