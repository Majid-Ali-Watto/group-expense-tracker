<template>
  <fieldset
    class="w-full border border-gray-300 rounded-lg p-6 bg-white shadow-md"
  >
    <legend class="text-lg font-semibold px-2">
      Add/Update Monthly Salary
    </legend>

    <!-- Form Section -->
    <el-form
      label-position="top"
      :model="form"
      :rules="rules"
      ref="salaryForm"
      class="space-y-4"
    >
      <el-form-item label="Monthly Salary" prop="salary">
        <el-input-number
          v-model.number="form.salary"
          :min="1"
          placeholder="Enter salary"
          class="w-full"
          controls-position="right"
        />
      </el-form-item>

      <div class="flex justify-between">
        <GenericButton :disabled="isSaveEnbl" type="success" @click="addSalary"
          >Save Salary</GenericButton
        >
        <GenericButton
          :disabled="isUpdateEnbl"
          button
          type="warning"
          @click="updateSalary"
          >Update Salary</GenericButton
        >
      </div>
    </el-form>

    <!-- Divider -->
    <el-divider />

    <!-- Display Section -->
    <div v-if="salaryData.salary !== null" class="text-center space-x-2">
      <span
        class="lg:text-lg md:text-base sm:text-sm font-semibold text-gray-700"
      >
        <strong>Salary for {{ salaryData.month }}:</strong>
      </span>

      <span
        class="lg:text-2xl md:text-lg sm:text-base font-bold text-green-600"
      >
        {{ formatAmount(salaryData.salary) }}
      </span>
    </div>
  </fieldset>
</template>

<script setup>
import { rules } from '../../assets/validation-rules'
import { GenericButton } from '../generic-components'
import { SalaryForm } from '../../scripts/salary-form'
import { onMounted, watch } from 'vue'

const {
  formatAmount,
  salaryData,
  form,
  salaryForm,
  isSaveEnbl,
  isUpdateEnbl,
  addSalary,
  updateSalary
} = SalaryForm()

// Debug: Watch the salaryForm ref
watch(() => salaryForm.value, (newVal) => {
  console.log('SalaryForm ref changed:', newVal)
}, { immediate: true })

onMounted(() => {
  console.log('SalaryForm component mounted')
  console.log('salaryForm ref on mount:', salaryForm.value)
})
</script>
