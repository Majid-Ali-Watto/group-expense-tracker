<template>
  <fieldset class="w-full border border-gray-300 rounded-lg p-4">
    <legend>Expense Details</legend>
    <el-form
      label-position="top"
      :model="form"
      :rules="rules"
      ref="expenseForm"
    >
      <AmountInput v-model.number="form.amount" required />
      <GenericInput
        v-model="form.description"
        label="Description"
        prop="description"
        placeholder="Enter description"
        required
      />
      <GenericInput
        v-model="form.location"
        label="Location"
        prop="location"
        placeholder="Enter location"
        required
      />
      <GenericInput
        v-model="form.recipient"
        label="Recipient"
        prop="recipient"
        placeholder="To Whom"
        required
      />
      <div class="flex justify-end" v-if="!isEditMode">
        <GenericButton v-if="showForm" type="info" @click="$emit('click')"
          >Cancel</GenericButton
        >
        <GenericButton type="success" @click="() => validateForm()"
          >Add Expense</GenericButton
        >
      </div>
    </el-form>
  </fieldset>
</template>

<script setup>
import { rules } from '../../assets/validation-rules'
import { GenericButton, AmountInput, GenericInput } from '../generic-components'
import { ExpenseForm } from '../../scripts/expense-form'
import { onMounted, watch } from 'vue'

const emit = defineEmits(['closeModal', 'click'])
const props = defineProps({
  row: Object,
  showForm: Boolean
})

const { isEditMode, form, expenseForm, validateForm } = ExpenseForm(props, emit)

// Debug: Watch the expenseForm ref
watch(() => expenseForm.value, (newVal) => {
  console.log('ExpenseForm ref changed:', newVal)
}, { immediate: true })

onMounted(() => {
  console.log('ExpenseForm component mounted')
  console.log('expenseForm ref on mount:', expenseForm.value)
})

defineExpose({
  validateForm,
  expenseForm
})
</script>
