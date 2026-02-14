<template>
  <div>
    <fieldset class="border rounded bg-white shadow-sm p-4">
      <legend class="font-medium">Create Group</legend>
      <el-form :model="groupForm" ref="groupFormRef">
        <el-form-item label="Name" prop="name" label-position="top">
          <el-input
            v-model="groupForm.name"
            placeholder="Enter group name"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="Members" prop="members" label-position="top">
          <el-select
            v-model="groupForm.members"
            multiple
            placeholder="Select members"
            class="w-full"
          >
            <el-option
              v-for="u in usersOptions"
              :key="u.mobile"
              :label="u.name + ' (' + u.mobile + ')'"
              :value="u.mobile"
            />
          </el-select>
        </el-form-item>
        <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
          <el-button type="primary" @click="createGroup">Create</el-button>
        </div>
        <br />
        <slot name="clear"></slot>
      </el-form>
    </fieldset>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { store } from "../stores/store";
import useFireBase from "../api/firebase-apis";
import { showError, showSuccess } from "../utils/showAlerts";

const userStore = store();
const { updateData } = useFireBase();

const groupForm = ref({ name: "", members: [] });

const usersOptions = computed(() => userStore.getUsers || []);

function generateInvite() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function createGroup() {
  if (!groupForm.value.name) return showError("Please provide group name");
  const id = Date.now().toString();
  const invite = generateInvite();
  const payload = {
    id,
    name: groupForm.value.name,
    ownerMobile: userStore.getActiveUser,
    members: (groupForm.value.members || []).map((m) => ({
      mobile: m,
      name: userStore.getUserByMobile(m)?.name || m,
    })),
    inviteCode: invite,
  };
  try {
    await updateData(`groups/${id}`, () => payload, "Group created");
    userStore.addGroup(payload);
    showSuccess("Group created");
    groupForm.value = { name: "", members: [] };
  } catch (err) {
    showError(err);
  }
}
</script>
