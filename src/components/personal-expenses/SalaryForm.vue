<template>
  <el-collapse v-model="activePanel" class="mt-4 md:mt-0">
    <el-collapse-item name="salary-form">
      <template #title>
        <span class="font-semibold text-sm lg:text-base px-2">
          <template v-if="salaryData.salary !== null">
            {{ t('personalExpenses.salaryFor', { month: salaryData.month }) }}
            <span class="text-green-600 font-bold ml-1">
              {{ formatAmount(salaryData.salary) }}
            </span>
          </template>
          <template v-else>{{
            t('personalExpenses.addUpdateMonthlySalary')
          }}</template>
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
            :label="t('common.month')"
            :placeholder="t('common.selectMonth')"
            :options="monthOptions"
          />
          <GenericDropDown
            v-model="selectedYear"
            :label="t('common.year')"
            :placeholder="t('common.selectYear')"
            :options="yearOptions"
            :filterable="false"
          />
        </div>

        <GenericInputNumber
          v-model="form.salary"
          :label="t('personalExpenses.monthlySalary')"
          prop="salary"
          :min="1"
          :placeholder="t('personalExpenses.enterSalary')"
        />

        <div class="flex flex-wrap justify-end gap-2">
          <GenericButton
            :disabled="isSaveEnbl || isSubmitting"
            :loading="isSubmitting"
            type="success"
            size="medium"
            @click="addSalary"
          >
            {{ t('personalExpenses.saveSalary') }}
          </GenericButton>
          <GenericButton
            :disabled="isUpdateEnbl || isSubmitting"
            :loading="isSubmitting"
            type="warning"
            size="medium"
            @click="updateSalary"
          >
            {{ t('personalExpenses.updateSalary') }}
          </GenericButton>
        </div>
      </el-form>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { rules } from '@/assets'
import { GenericButton } from '@/components/generic-components'
import { SalaryForm } from '@/scripts/personal-expenses'
import {
  GenericDropDown,
  GenericInputNumber
} from '@/components/generic-components'

const activePanel = ref([])
const { t } = useI18n()

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
