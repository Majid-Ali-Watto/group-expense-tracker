<template>
  <div class="ngf-card">
    <div class="ngf-icon">🧭</div>
    <div class="ngf-title">
      {{
        searchQuery
          ? 'No groups match your search'
          : variant === 'joined'
            ? "You haven't joined any groups yet"
            : 'No more groups are available right now'
      }}
    </div>
    <div class="ngf-copy">
      {{
        searchQuery
          ? 'Try a different group name, code, owner, or member.'
          : variant === 'joined'
            ? 'Create a new group or accept an invitation to get started.'
            : 'New groups will appear here when someone invites you or creates one.'
      }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'available'
  }
})
</script>

<style scoped>
.ngf-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1.1rem 1rem;
  border: 1px dashed rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(34, 197, 94, 0.06), rgba(59, 130, 246, 0.04)),
    var(--card-bg);
  text-align: center;
}

.ngf-icon {
  font-size: 1.6rem;
  line-height: 1;
}

.ngf-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.ngf-copy {
  max-width: 34rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-secondary);
}
</style>
