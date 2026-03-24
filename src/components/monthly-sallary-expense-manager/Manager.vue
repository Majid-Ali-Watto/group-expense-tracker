<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="manager-wrap">
    <div class="manager-top">
      <div class="manager-col">
        <AddNewTransactionButton
          text="Want to add a new expense?"
          :form-open="showForm"
          @click="setShowForm"
          @close="setShowForm"
        />
        <Transition name="form-slide">
          <div v-if="showForm">
            <HOC
              :componentToBeRendered="AddExpense"
              :componentProps="{ showForm }"
              :listenersToPass="{ click: setShowForm }"
            />
          </div>
        </Transition>
      </div>
      <div class="manager-col">
        <HOC :componentToBeRendered="AddSalary" />
      </div>
    </div>
    <HOC :componentToBeRendered="ExpenseList" />
  </div>
</template>

<script setup>
import AddNewTransactionButton from '../generic-components/AddNewTransactionButton.vue'
import HOC from '../layout/HOC.vue'
import { ref } from 'vue'
import { loadAsyncComponent } from '../../utils/async-component'

const AddSalary = loadAsyncComponent(() => import('./SalaryForm.vue'))
const AddExpense = loadAsyncComponent(() => import('./ExpenseForm.vue'))
const ExpenseList = loadAsyncComponent(() => import('./SalaryExpenseList.vue'))

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
