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
            size="small"
            :maxlength="50"
          />
        </el-form-item>
        <el-form-item label="Description" label-position="top">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="Enter group description (optional)"
            class="w-full"
            size="small"
            :maxlength="100"
          />
        </el-form-item>
        <GenericDropDown
          v-model="groupForm.members"
          label="Members"
          prop="members"
          label-position="top"
          :options="usersOptions"
          placeholder="Select members"
          size="small"
          multiple
          required
        />
        <div class="flex flex-row justify-end gap-2">
          <slot name="clear"></slot>
          <el-button type="primary" size="small" @click="createGroup"
            >Create</el-button
          >
        </div>
      </el-form>
    </fieldset>
  </div>
</template>

<script setup>
import { groupRules } from '../../assets/validation-rules'
import { GroupsCreate } from '../../scripts/groups/groups-create'
import { GenericDropDown } from '../generic-components'

const emit = defineEmits(['groupCreated'])
const props = defineProps({
  preselectedMember: { type: String, default: null }
})

const { groupForm, groupFormRef, usersOptions, createGroup } = GroupsCreate(
  emit,
  props
)
</script>
