<template>
  <div class="p-4">
    <h2 class="mb-4">Manage Users</h2>
    <el-form :model="form" ref="userForm" label-position="top">
      <el-form-item label="Full Name" prop="name">
        <el-input v-model="form.name" placeholder="Full name" />
      </el-form-item>
      <el-form-item label="Mobile Number" prop="mobile">
        <el-input v-model="form.mobile" placeholder="Mobile number" />
      </el-form-item>
      <div class="flex justify-end">
        <el-button type="primary" @click="saveUser">Save User</el-button>
      </div>
    </el-form>

    <el-divider />
    <h3>Existing Users</h3>
    <el-table :data="users">
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="mobile" label="Mobile" />
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import useFireBase from "../api/firebase-apis";
import { store } from "../stores/store";
import { showSuccess, showError } from "../utils/showAlerts";

const userStore = store();
const { updateData } = useFireBase();

const form = ref({ name: "", mobile: "" });

const users = computed(() => userStore.getUsers || []);

function saveUser() {
  if (!form.value.mobile) return showError("Mobile is required");
  const payload = { name: form.value.name || "", mobile: form.value.mobile };
  const getData = () => payload;
  updateData(`users/${form.value.mobile}`, getData, "User saved");
  userStore.addUser(payload);
  showSuccess("User saved locally");
  form.value.name = "";
  form.value.mobile = "";
}
</script>

<style scoped>
.el-table {
  margin-top: 12px;
}
</style>
