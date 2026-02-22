<template>
  <el-collapse
    class="mb-3"
    @change="() => loadGroupBalances(group.id, groupType)"
  >
    <el-collapse-item>
      <template #title>
        <span class="text-sm font-medium text-gray-600">
          <svg
            class="inline-block w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          View Details
        </span>
      </template>

      <div class="space-y-3 pt-2">
        <!-- Description -->
        <div v-if="group.description">
          <div class="text-xs font-medium text-gray-500 mb-1">Description</div>
          <div class="text-sm text-gray-700 italic">
            {{ group.description }}
          </div>
        </div>

        <!-- Group Code -->
        <div class="flex flex-row justify-between">
          <div class="text-xs font-medium text-gray-500 mb-1">Group Code</div>
          <div
            class="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block"
          >
            {{ group.id }}
          </div>
        </div>

        <!-- Owner -->
        <div class="flex flex-row justify-between">
          <div class="text-xs font-medium text-gray-500 mb-1">Owner</div>
          <div class="text-sm text-gray-700">
            {{
              userStore.getUserByMobile(group.ownerMobile)?.name +
                ` (${displayMobileForGroup(group.ownerMobile, group)})` ||
              group.ownerMobile
            }}
          </div>
        </div>
        <slot name="your-position"></slot>
        <!-- Members List -->
        <div>
          <div class="text-xs font-medium text-gray-500 mb-2">
            Members ({{ group.members.length }})
          </div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(member, i) in group.members"
              :key="i"
              size="small"
              type="info"
            >
              {{ member.name }} ({{
                displayMobileForGroup(member.mobile, group)
              }})
            </el-tag>
          </div>
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>
<script setup>
import { store } from '../../stores/store'

const userStore = store()

defineProps({
  group: {
    type: Object,
    required: true
  },
  loadGroupBalances: {
    type: Function,
    required: true
  },
  displayMobileForGroup: {
    type: Function,
    required: true
  },
  groupType: {
    type: String,
    required: true
  }
})
</script>
