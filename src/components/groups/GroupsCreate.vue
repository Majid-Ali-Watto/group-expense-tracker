<template>
  <div>
    <fieldset class="border border-gray-300 rounded-lg p-4">
      <legend class="font-medium">Create Group</legend>
      <el-form :model="groupForm" :rules="groupRules" ref="groupFormRef">
        <GenericInputField
          v-model="groupForm.name"
          label="Name"
          prop="name"
          label-position="top"
          placeholder="Enter group name"
          :maxlength="50"
        />
        <GenericInputField
          v-model="groupForm.description"
          label="Description"
          label-position="top"
          type="textarea"
          :rows="3"
          placeholder="Enter group description (optional)"
          :maxlength="100"
        />
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
        <GenericDropDown
          v-model="groupForm.category"
          label="Category"
          label-position="top"
          :options="categoryOptions"
          placeholder="Select a category (optional)"
          size="small"
        />
        <div class="flex flex-row justify-end gap-2">
          <slot name="clear"></slot>
          <el-button type="primary" size="small" :loading="isSubmitting" :disabled="isSubmitting" @click="createGroup"
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
import GenericInputField from '../generic-components/GenericInputField.vue'
import { GROUP_CATEGORIES } from '../../assets/enums'

const emit = defineEmits(['groupCreated'])
const props = defineProps({
  preselectedMember: { type: String, default: null }
})

const categoryOptions = GROUP_CATEGORIES
const { groupForm, groupFormRef, usersOptions, createGroup, isSubmitting } = GroupsCreate(
  emit,
  props
)
</script>
