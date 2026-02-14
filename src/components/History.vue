<template>
  <HOC
    :componentToBeRendered="ExpenseList"
    :component-props="{ isHistory: true, dbRef: 'payments-backup' }"
  />
</template>

<script setup>
import HOC from "./HOC.vue";
import { defineAsyncComponent } from "vue";

const ExpenseList = defineAsyncComponent(() => import("./ExpenseList.vue"));
</script>
