<template>
  <div v-if="pendingMemberCount > 0">
    <div
      class="text-xs font-medium text-orange-500 mb-2 flex items-center gap-1"
    >
      <span>⏳ Pending Invitations ({{ pendingMemberCount }})</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <el-tag
        v-for="(member, i) in group.pendingMembers.slice(
          0,
          initialMemberLoadCount
        )"
        :key="i"
        size="small"
        type="warning"
      >
        {{ userStore.getUserByUid(member.uid)?.name || member.uid }}
        ({{ displayMobileForGroup(member.uid, group) }})
      </el-tag>
      <el-tag
        v-if="pendingMemberCount > initialMemberLoadCount"
        size="small"
        type="warning"
        class="cursor-pointer"
        @click="showDialog = true"
      >
        +{{ pendingMemberCount - initialMemberLoadCount }} more
      </el-tag>
    </div>

    <el-dialog
      v-model="showDialog"
      :title="`Pending Invitations (${pendingMemberCount})`"
      width="340px"
      append-to-body
      align-center
    >
      <div class="overflow-y-auto max-h-64 pr-1">
        <div
          v-for="(member, i) in group.pendingMembers"
          :key="i"
          class="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0"
        >
          <div
            class="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-semibold shrink-0"
          >
            {{
              (userStore.getUserByUid(member.uid)?.name || member.uid).charAt(0).toUpperCase()
            }}
          </div>
          <div class="text-sm text-gray-700">
            {{ userStore.getUserByUid(member.uid)?.name || member.uid }}
            <span class="text-gray-500 font-bold text-xs ml-1">
              ({{ displayMobileForGroup(member.uid, group) }})
            </span>
          </div>
          <el-tag size="small" type="warning" class="ml-auto shrink-0"
            >Pending</el-tag
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores'

const showDialog = ref(false)
const userStore = useUserStore()

const props = defineProps({
  group: { type: Object, required: true },
  displayMobileForGroup: { type: Function, required: true }
})

const initialMemberLoadCount = 2
const pendingMemberCount = computed(
  () => props.group.pendingMembers?.length ?? 0
)
</script>
