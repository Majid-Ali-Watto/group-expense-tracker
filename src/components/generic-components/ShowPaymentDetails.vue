<template>
  <!-- Show payment details -->
  <div class="text-sm text-gray-700 mb-2">
    <p v-if="request.type === 'update'">
      <strong>Proposed Changes:</strong><br />
      Amount: {{ formatAmount(request.changes.amount) }}<br />
      Payer: {{ getUserName(request.changes.payer) }}<br />
      Description: {{ request.changes.description }}<br />
      Date: {{ request.changes.date }}
    </p>
    <p v-else>
      <strong>Payment to be deleted:</strong><br />
      Amount: {{ formatAmount(request.payment.amount) }}<br />
      Payer: {{ getUserName(request.payment.payer) }}<br />
      Description: {{ request.payment.description }}
    </p>
  </div>
</template>
<script setup>
import { inject } from 'vue'
defineProps({
  request: Object,
  getUserName: Function
})
const formatAmount = inject('formatAmount')
</script>
