import { GROUP_CATEGORIES } from '@/assets'

function normalizeCategoryValues(values = []) {
  return [
    ...new Set(
      values.map((value) => String(value || '').trim()).filter(Boolean)
    )
  ]
}

export function mergeCategoryOptions(values = []) {
  const normalizedValues = normalizeCategoryValues(values)
  const knownValues = new Set(GROUP_CATEGORIES.map((option) => option.value))

  const customOptions = normalizedValues
    .filter((value) => !knownValues.has(value))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      label: value,
      value
    }))

  return [...GROUP_CATEGORIES, ...customOptions]
}

export function buildCategoryFilterOptions(
  values = [],
  { allLabel = 'All Categories', allValue = '' } = {}
) {
  return [{ label: allLabel, value: allValue }, ...mergeCategoryOptions(values)]
}
