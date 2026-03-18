<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <HOC
    :componentToBeRendered="ExpenseList"
    :component-props="{ isHistory: true, dbRef: 'payments-backup' }"
  />
</template>

<script setup>
import HOC from '../layout/HOC.vue'
import { defineAsyncComponent } from 'vue'

const ExpenseList = defineAsyncComponent(
  () => import('../shared-expenses/ExpenseList.vue')
)
</script>
