<template>
  <el-collapse v-model="activePanel" class="mt-4 md:mt-0">
    <el-collapse-item name="salary-form">
      <template #title>
        <span class="font-semibold text-sm lg:text-base px-2">
          <template v-if="salaryData.salary !== null">
            Salary for {{ salaryData.month }}:
            <span class="text-green-600 font-bold ml-1">
              {{ formatAmount(salaryData.salary) }}
            </span>
          </template>
          <template v-else>Add/Update Monthly Salary</template>
        </span>
      </template>

      <!-- Form Section -->
      <el-form
        label-position="top"
        :model="form"
        :rules="rules"
        ref="salaryForm"
        class="space-y-4 px-3 pt-3 pb-1"
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
          <GenericButton
            :disabled="isSaveEnbl"
            type="success"
            @click="addSalary"
          >
            Save Salary
          </GenericButton>
          <GenericButton
            :disabled="isUpdateEnbl"
            type="warning"
            @click="updateSalary"
          >
            Update Salary
          </GenericButton>
        </div>
      </el-form>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref } from 'vue'
import { rules } from '../../assets/validation-rules'
import { GenericButton } from '../generic-components'
import { SalaryForm } from '../../scripts/monthly-expenses/salary-form'

const activePanel = ref([])

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
</script>
