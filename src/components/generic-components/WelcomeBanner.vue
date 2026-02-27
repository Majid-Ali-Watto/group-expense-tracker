<template>
  <div class="mb-0">
    <div class="banner-card shadow-sm p-2 sm:p-3">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <!-- User Info -->
        <div class="flex items-center gap-3">
          <div class="flex-shrink-0">
            <div class="avatar-circle">
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5">
              Welcome back
            </p>
            <p class="text-base font-bold text-gray-800 truncate">
              {{ displayName }}
            </p>
          </div>
        </div>

        <!-- Group Info -->
        <div class="flex items-center gap-3 sm:ml-4">
          <div class="flex-shrink-0">
            <div
              class="group-circle"
              :class="userStore.getActiveGroup ? '' : 'group-circle--empty'"
            >
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm text-gray-500 font-medium mb-0.5">
              Active Group (joined groups)
            </p>
            <el-select
              v-model="selectedGroupId"
              filterable
              size="small"
              placeholder="No Group Selected"
              class="min-w-0 font-bold"
              :class="joinedGroups.length === 0 ? 'opacity-50' : ''"
              :disabled="joinedGroups.length === 0"
              @change="handleSelectGroup"
            >
              <el-option
                v-for="group in joinedGroups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { store } from '../../stores/store'
import { showSuccess } from '../../utils/showAlerts'
import { isMemberOfGroup } from '../../helpers/users'

defineProps({
  displayName: String
})

const userStore = store()

const joinedGroups = computed(() =>
  userStore.getGroups.filter((g) => isMemberOfGroup(g))
)

const selectedGroupId = ref(userStore.getActiveGroup)

watch(
  () => userStore.getActiveGroup,
  (newId) => {
    selectedGroupId.value = newId
  }
)

function handleSelectGroup(id) {
  const group = userStore.getGroupById(id)
  if (!group) return
  userStore.setActiveGroup(id)
  showSuccess(`Selected group: ${group.name}`)
}
</script>

<style scoped>
.banner-card {
  background: var(--tab-gradient-start);
  /* linear-gradient(
    90deg,
    var(--success-50),
    var(--tab-gradient-start),
    var(--tab-gradient-end)
  ); */
  border: 1px solid var(--success-100);
  /* border-radius: 12px; */
}

.avatar-circle,
.group-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 18px -12px rgba(34, 197, 94, 0.5);
}

.avatar-circle {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.group-circle {
  background: linear-gradient(135deg, var(--success-400), var(--success-600));
}

.group-circle--empty {
  background: #d1d5db;
  box-shadow: none;
}
</style>
