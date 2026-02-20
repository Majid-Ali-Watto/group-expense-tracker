<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="w-full mx-auto">
    <div class="flex flex-col gap-6">
      <el-row :gutter="30">
        <el-col :lg="12" :md="12" :sm="12">
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
        </el-col>
        <el-col :lg="12" :md="12" :sm="12">
          <HOC :componentToBeRendered="AddSalary" />
        </el-col>
      </el-row>
      <HOC :componentToBeRendered="ExpenseList" />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import AddNewTransactionButton from '../generic-components/AddNewTransactionButton.vue'
import HOC from '../HOC.vue'
import { ref } from 'vue'

// Async components
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
