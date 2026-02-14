<template>
  <div class="max-w-5xl mx-auto p-3 sm:p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Add Group Button -->
      <div class="lg:col-span-1">
        <div
          v-if="!showCreateGroup"
          class="flex justify-between items-center gap-4"
        >
          <span> Want to create a new group? </span>
          <el-button
            type="primary"
            circle
            size="medium"
            @click="openCreateGroup"
          >
            <span class="text-lg">+</span>
          </el-button>
        </div>

        <!-- Create Group Form -->
        <div v-else>
          <groups-create>
            <template #clear>
              <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
                <el-button @click="closeCreateGroup">Cancel</el-button>
              </div>
            </template>
          </groups-create>
        </div>
      </div>

      <!-- Existing Groups -->
      <fieldset
        class="border rounded bg-white shadow-sm p-4 lg:col-span-2 min-w-full"
      >
        <legend class="font-medium text-sm sm:text-base">
          Existing Groups
        </legend>

        <div class="table-wrapper">
          <el-table :data="groups" style="width: 100%">
            <el-table-column label="Name" min-width="200">
              <template #default="{ row }">
                <div class="flex flex-col gap-2">
                  <span class="font-medium">{{ row.name }}</span>

                  <div class="flex flex-wrap gap-2">
                    <el-button size="small" @click="joinGroup(row.inviteCode)">
                      Join by Code
                    </el-button>

                    <el-button
                      size="small"
                      type="primary"
                      @click="selectGroup(row.id)"
                    >
                      Select
                    </el-button>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="Members" min-width="250">
              <template #default="{ row }">
                <ol
                  class="list-decimal list-inside max-h-28 overflow-y-auto text-sm"
                >
                  <li v-for="(m, i) in row.members" :key="i">
                    {{ m.name }} ({{ m.mobile }})
                  </li>
                </ol>
              </template>
            </el-table-column>

            <el-table-column
              label="Invite Code"
              prop="inviteCode"
              min-width="150"
            />

            <el-table-column
              label="Created By"
              prop="ownerMobile"
              min-width="150"
            />

            <el-table-column label="Actions" min-width="120">
              <template #default="{ row }">
                <el-button
                  type="warning"
                  size="small"
                  plain
                  @click="editGroup(row.id)"
                >
                  ✍️
                </el-button>

                <el-button
                  v-if="row.ownerMobile === userStore.getActiveUser"
                  type="danger"
                  size="small"
                  plain
                  @click="deleteGroup(row.id)"
                >
                  ✗
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </fieldset>
    </div>

    <el-dialog v-model="editDialogVisible" title="Edit Group" width="400px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Group Name">
          <el-input v-model="editForm.name" />
        </el-form-item>

        <el-form-item label="Members">
          <el-select
            v-model="editForm.members"
            multiple
            filterable
            class="w-full"
          >
            <el-option
              v-for="u in userStore.getUsers"
              :key="u.mobile"
              :label="`${u.name} (${u.mobile})`"
              :value="u.mobile"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="updateGroup"> Save </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { store } from "../stores/store";
import useFireBase from "../api/firebase-apis";
import { showError, showSuccess } from "../utils/showAlerts";
import GroupsCreate from "./GroupsCreate.vue";
import { ElMessageBox } from "element-plus";

const showCreateGroup = ref(false);

const openCreateGroup = () => {
  showCreateGroup.value = true;
};

const closeCreateGroup = () => {
  showCreateGroup.value = false;
};

const userStore = store();
const { read, updateData, removeData } = useFireBase();

const groups = ref([]);

const editDialogVisible = ref(false);
const editingGroupId = ref(null);

const editForm = ref({
  name: "",
  members: [],
});

onMounted(async () => {
  try {
    const data = await read("groups");
    if (data) {
      groups.value = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      userStore.setGroups(groups.value);
    }
  } catch (e) {
    // ignore
  }
});

async function joinGroup(code) {
  try {
    const data = await read("groups");
    const foundKey = Object.keys(data || {}).find(
      (k) => data[k].inviteCode === code,
    );
    if (!foundKey) return showError("Invite code not found");
    const g = data[foundKey];
    const mobile = userStore.getActiveUser;
    if (!g.members.find((m) => m.mobile === mobile)) {
      g.members.push({
        mobile,
        name: userStore.getUserByMobile(mobile)?.name || mobile,
      });
      await updateData(`groups/${foundKey}`, () => g, "Joined group");
      userStore.addGroup({ id: foundKey, ...g });
      showSuccess("Joined group successfully");
    } else {
      showSuccess("Already a member");
    }
  } catch (e) {
    showError(e.message || e);
  }
}

function selectGroup(id) {
  userStore.setActiveGroup(id);
  showSuccess("Selected group " + id);
}
async function deleteGroup(groupId) {
  try {
    await ElMessageBox.confirm(
      "This will permanently delete the group. Continue?",
      "Delete Group",
      {
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        type: "warning",
      },
    );

    // ✅ Proper Firebase delete
    await removeData(`groups/${groupId}`);

    // Update local state
    groups.value = groups.value.filter((g) => g.id !== groupId);
    userStore.removeGroup(groupId);

    if (userStore.getActiveGroup === groupId) {
      userStore.setActiveGroup(null);
    }

    showSuccess("Group deleted successfully");
  } catch (err) {
    if (err !== "cancel") {
      showError(err.message || err);
    }
  }
}

function editGroup(groupId) {
  const group = groups.value.find((g) => g.id === groupId);
  if (!group) return;

  // Only owner can edit
  if (group.ownerMobile !== userStore.getActiveUser) {
    return showError("Only group owner can edit this group");
  }

  editingGroupId.value = groupId;

  editForm.value = {
    name: group.name,
    members: group.members.map((m) => m.mobile),
  };

  editDialogVisible.value = true;
}
async function updateGroup() {
  try {
    if (!editForm.value.name) {
      return showError("Group name is required");
    }

    const groupIndex = groups.value.findIndex(
      (g) => g.id === editingGroupId.value,
    );

    if (groupIndex === -1) return;

    const updatedGroup = {
      ...groups.value[groupIndex],
      name: editForm.value.name,
      members: editForm.value.members.map((m) => ({
        mobile: m,
        name: userStore.getUserByMobile(m)?.name || m,
      })),
    };

    // Update Firebase
    await updateData(
      `groups/${editingGroupId.value}`,
      () => updatedGroup,
      "Group updated",
    );

    // Update local list
    groups.value[groupIndex] = updatedGroup;
    userStore.updateGroup(updatedGroup);

    editDialogVisible.value = false;
    showSuccess("Group updated successfully");
  } catch (err) {
    showError(err.message || err);
  }
}
</script>

<style scoped>
/* Layout and spacing handled by Tailwind classes */
/* Default: no forced scrolling */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

/* Enable horizontal scroll only below 760px */
@media (max-width: 760px) {
  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  /* Force table width so it actually scrolls */
  .table-wrapper :deep(.el-table) {
    min-width: 720px;
  }
}
</style>
