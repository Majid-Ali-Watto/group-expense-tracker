<template>
  <div>
    <fieldset class="border rounded bg-white shadow-sm p-4">
      <legend class="font-medium">Create Group</legend>
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef">
        <el-form-item label="Name" prop="name" label-position="top">
          <el-input
            v-model="groupForm.name"
            placeholder="Enter group name"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="Description" label-position="top">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="Enter group description (optional)"
            class="w-full"
          />
        </el-form-item>
        <el-form-item label="Members" prop="members" label-position="top">
          <el-select
            filterable
            v-model="groupForm.members"
            multiple
            placeholder="Select members"
            class="w-full"
          >
            <el-option
              v-for="u in usersOptions"
              :key="u.mobile"
              :label="getUserLabel(u)"
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
import { groupRules } from '../assets/validation-rules'
import { GroupsCreate } from '../scripts/groups-create'

const { groupForm, groupFormRef, usersOptions, createGroup, getUserLabel } = GroupsCreate()
</script>
