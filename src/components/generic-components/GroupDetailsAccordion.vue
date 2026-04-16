<template>
  <el-collapse
    class="mb-3"
    @change="() => loadGroupBalances(group.id, groupType)"
  >
    <el-collapse-item>
      <template #title>
        <span class="px-2 text-sm font-medium text-gray-600">
          <InfoCircleIcon class="inline-block w-4 h-4 mr-1" />
          View Details
        </span>
      </template>

      <div class="space-y-3 pt-2 px-2">
        <!-- Description -->
        <div v-if="group.description">
          <div class="text-xs font-medium text-gray-500 mb-1">Description</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ group.description }}
          </div>
        </div>

        <slot name="your-position"></slot>
        <!-- Members List -->
        <div>
          <div
            class="text-xs font-medium text-gray-500 mb-2 flex items-center justify-between"
          >
            <span>Members ({{ memberCount }})</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(member, i) in group.members.slice(
                0,
                initialMemberLoadCount
              )"
              :key="i"
              size="small"
              type="info"
            >
              {{ userStore.getUserByUid(member.uid)?.name }}
              ({{ displayMobileForGroup(member.mobile, group) }})
            </el-tag>
            <el-tag
              v-if="memberCount > initialMemberLoadCount"
              size="small"
              type="info"
              class="cursor-pointer"
              @click="showMembersDialog = true"
            >
              +{{ memberCount - initialMemberLoadCount }} more
            </el-tag>
          </div>
        </div>

        <!-- Pending Invitations -->
        <GroupPendingMembersList
          :group="group"
          :display-mobile-for-group="displayMobileForGroup"
        />

        <!-- Members Dialog -->
        <el-dialog
          v-model="showMembersDialog"
          :title="`Members (${memberCount})`"
          width="340px"
          append-to-body
          align-center
        >
          <div class="overflow-y-auto max-h-64 pr-1">
            <div
              v-for="(member, i) in group.members"
              :key="i"
              class="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
            >
              <div
                class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold shrink-0"
              >
                {{
                  (userStore.getUserByUid(member.uid)?.name || member.mobile)
                    .charAt(0)
                    .toUpperCase()
                }}
              </div>
              <div class="text-sm text-gray-700">
                {{ userStore.getUserByUid(member.uid)?.name || member.mobile }}
                <span class="text-gray-500 font-bold text-xs ml-1"
                  >({{ displayMobileForGroup(member.mobile, group) }})</span
                >
              </div>
            </div>
          </div>
        </el-dialog>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>
<script setup>
import { computed, ref } from 'vue'
import { InfoCircleIcon } from '@/components/icons'
import { useUserStore } from '@/stores'
import GroupPendingMembersList from './GroupPendingMembersList.vue'

const showMembersDialog = ref(false)

const userStore = useUserStore()

const props = defineProps({
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

const memberCount = computed(() => props.group.members.length)
const initialMemberLoadCount = 2
</script>
