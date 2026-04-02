<template>
  <!-- Show payment details -->
  <div class="text-sm text-gray-700 mb-2">
    <p v-if="request.type === 'update'">
      <strong>Proposed Changes:</strong><br />
      <template v-if="request.changes.amount !== undefined">
        Amount:
        <span
          v-if="
            request.current?.amount !== undefined &&
            String(request.current.amount) !== String(request.changes.amount)
          "
        >
          <span class="line-through text-gray-400">{{
            formatAmount(request.current.amount)
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{
          formatAmount(request.changes.amount)
        }}</span
        ><br />
      </template>
      <template v-if="request.changes.payer !== undefined">
        Payer:
        <span
          v-if="
            request.current?.payer &&
            request.current.payer !== request.changes.payer
          "
        >
          <span class="line-through text-gray-400">{{
            getUserName(request.current.payer)
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{ getUserName(request.changes.payer) }}</span
        ><br />
      </template>
      <template v-if="request.changes.description !== undefined">
        Description:
        <span
          v-if="
            request.current?.description !== undefined &&
            request.current.description !== request.changes.description
          "
        >
          <span class="line-through text-gray-400">{{
            request.current.description
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{ request.changes.description }}</span
        ><br />
      </template>
      <template v-if="request.changes.category !== undefined">
        Category:
        <span
          v-if="
            request.current?.category !== undefined &&
            request.current.category !== request.changes.category
          "
        >
          <span class="line-through text-gray-400">{{
            request.current.category || 'None'
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{ request.changes.category || 'None' }}</span
        ><br />
      </template>
      <template v-if="request.changes.date !== undefined">
        Date:
        <span
          v-if="
            request.current?.date &&
            request.current.date !== request.changes.date
          "
        >
          <span class="line-through text-gray-400">{{
            request.current.date
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{ request.changes.date }}</span>
      </template>
    </p>
    <p v-else>
      <strong>Payment to be deleted:</strong><br />
      Amount: {{ formatAmount(request.payment.amount) }}<br />
      Payer: {{ getUserName(request.payment.payer) }}<br />
      Category: {{ request.payment.category || 'None' }}<br />
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
