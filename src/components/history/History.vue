<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <HOC
    :componentToBeRendered="ExpenseList"
    :component-props="{ isHistory: true, dbRef: 'payments-backup' }"
  />
</template>

<script setup>
import HOC from '../layout/HOC.vue'
import { loadAsyncComponent } from '../../utils/async-component'

const ExpenseList = loadAsyncComponent(
  () => import('../shared-expenses/ExpenseList.vue')
)
</script>
