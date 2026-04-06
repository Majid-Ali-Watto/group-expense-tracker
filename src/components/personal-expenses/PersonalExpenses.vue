<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="flex w-full flex-col gap-3 sm:gap-5">
    <div class="flex flex-col gap-3 sm:gap-5">
      <div class="min-w-0">
        <AddNewTransactionButton
          text="Want to add a new expense?"
          :form-open="showForm"
          @click="openExpenseForm"
          @close="handleExpenseFormClose"
        />
        <Transition name="form-slide">
          <div v-if="showForm">
            <HOC
              ref="expenseFormHostRef"
              :componentToBeRendered="AddExpense"
              :componentProps="{ showForm }"
              :listenersToPass="{ click: setShowForm }"
            />
          </div>
        </Transition>
      </div>
      <div class="min-w-0">
        <HOC :componentToBeRendered="AddSalary" />
      </div>
    </div>
    <HOC :componentToBeRendered="ExpenseList" />
  </div>
</template>

<script setup>
import { AddNewTransactionButton } from '@/components/generic-components'
import { HOC } from '@/components/layout'
import { ref } from 'vue'
import { loadAsyncComponent } from '@/utils'

const AddSalary = loadAsyncComponent(() => import('./SalaryForm.vue'))
const AddExpense = loadAsyncComponent(() => import('./PersonalExpenseForm.vue'))
const ExpenseList = loadAsyncComponent(
  () => import('./PersonalExpenseList.vue')
)

const showForm = ref(false)
const expenseFormHostRef = ref(null)

const setShowForm = () => {
  showForm.value = !showForm.value
}

function openExpenseForm() {
  showForm.value = true
}

async function handleExpenseFormClose() {
  const requestClose =
    expenseFormHostRef.value?.componentRef?.requestClose || null
  if (typeof requestClose === 'function') {
    await requestClose()
    return
  }
  showForm.value = false
}
</script>
