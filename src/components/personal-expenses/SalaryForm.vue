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
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <GenericDropDown
            v-model="selectedMonthValue"
            label="Month"
            placeholder="Select month"
            :options="monthOptions"
          />
          <GenericDropDown
            v-model="selectedYear"
            label="Year"
            placeholder="Select year"
            :options="yearOptions"
            :filterable="false"
          />
        </div>

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
import { rules } from '@/assets'
import { GenericButton } from '@/components/generic-components'
import { SalaryForm } from '@/scripts/personal-expenses'
import {
  GenericDropDown,
  GenericInputNumber
} from '@/components/generic-components'

const activePanel = ref([])

const {
  formatAmount,
  salaryData,
  form,
  salaryForm,
  selectedYear,
  selectedMonthValue,
  monthOptions,
  yearOptions,
  isSaveEnbl,
  isUpdateEnbl,
  addSalary,
  updateSalary,
  isSubmitting
} = SalaryForm()
</script>
