import { computed } from 'vue'
import { isMemberOfGroup } from '@/helpers'

export function useJoinedGroups(groupsSource) {
  return computed(() =>
    (groupsSource.value || []).filter((group) => isMemberOfGroup(group))
  )
}
