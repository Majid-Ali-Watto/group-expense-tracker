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
        <GenericInputNumber
          v-model="form.salary"
          label="Monthly Salary"
          prop="salary"
          :min="1"
          placeholder="Enter salary"
        />

        <div class="flex flex-wrap justify-end gap-2">
          <GenericButton
            :disabled="isSaveEnbl || isSubmitting"
            :loading="isSubmitting"
            type="success"
            size="small"
            @click="addSalary"
          >
            Save Salary
          </GenericButton>
          <GenericButton
            :disabled="isUpdateEnbl || isSubmitting"
            :loading="isSubmitting"
            type="warning"
            size="small"
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
import GenericInputNumber from '../generic-components/GenericInputNumber.vue'

const activePanel = ref([])

const {
  formatAmount,
  salaryData,
  form,
  salaryForm,
  isSaveEnbl,
  isUpdateEnbl,
  addSalary,
  updateSalary,
  isSubmitting
} = SalaryForm()
</script>
