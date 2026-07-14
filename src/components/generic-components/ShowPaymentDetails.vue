<template>
  <!-- Show payment details -->
  <div class="text-sm text-gray-700 mb-2">
    <p v-if="request.type === 'update'">
      <strong>{{ t('approval.proposedChanges') }}</strong><br />
      <template v-if="request.changes.amount !== undefined">
        {{ t('sharedExpenses.proposedAmountLabel') }}
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
        {{ t('sharedExpenses.proposedPayerLabel') }}
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
        {{ t('sharedExpenses.proposedDescriptionLabel') }}
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
        {{ t('sharedExpenses.proposedCategoryLabel') }}
        <span
          v-if="
            request.current?.category !== undefined &&
            request.current.category !== request.changes.category
          "
        >
          <span class="line-through text-gray-400">{{
            request.current.category || t('common.none')
          }}</span>
          &nbsp;→&nbsp;
        </span>
        <span class="font-medium">{{
          request.changes.category || t('common.none')
        }}</span
        ><br />
      </template>
      <template v-if="request.changes.date !== undefined">
        {{ t('sharedExpenses.proposedDateLabel') }}
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
      <strong>{{ t('sharedExpenses.paymentToBeDeleted') }}</strong><br />
      {{ t('sharedExpenses.proposedAmountLabel') }}
      {{ formatAmount(request.payment.amount) }}<br />
      {{ t('sharedExpenses.proposedPayerLabel') }}
      {{ getUserName(request.payment.payer) }}<br />
      {{ t('sharedExpenses.proposedCategoryLabel') }}
      {{ request.payment.category || t('common.none') }}<br />
      {{ t('sharedExpenses.proposedDescriptionLabel') }}
      {{ request.payment.description }}
    </p>
  </div>
</template>
<script setup>
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'
defineProps({
  request: Object,
  getUserName: Function
})
const formatAmount = inject('formatAmount')
const { t } = useI18n()
</script>
