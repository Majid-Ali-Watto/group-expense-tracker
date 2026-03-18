<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="manager-wrap">
    <div class="manager-top">
      <div class="manager-col">
        <AddNewTransactionButton
          text="Want to add a new expense?"
          @click="setShowForm"
          v-if="!showForm"
        />
        <HOC
          v-else-if="showForm"
          :componentToBeRendered="AddExpense"
          :componentProps="{ showForm }"
          :listenersToPass="{ click: setShowForm }"
        />
      </div>
      <div class="manager-col">
        <HOC :componentToBeRendered="AddSalary" />
      </div>
    </div>
    <HOC :componentToBeRendered="ExpenseList" />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import AddNewTransactionButton from '../generic-components/AddNewTransactionButton.vue'
import HOC from '../layout/HOC.vue'
import { ref } from 'vue'

const AddSalary = defineAsyncComponent(() => import('./SalaryForm.vue'))
const AddExpense = defineAsyncComponent(() => import('./ExpenseForm.vue'))
const ExpenseList = defineAsyncComponent(
  () => import('./SalaryExpenseList.vue')
)

const showForm = ref(false)
const setShowForm = () => {
  showForm.value = !showForm.value
}
</script>

<style scoped>
.manager-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}
.manager-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 600px) {
  .manager-top {
    grid-template-columns: 1fr;
  }
}
.manager-col {
  min-width: 0;
}
</style>
