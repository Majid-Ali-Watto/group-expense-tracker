import { ref, computed } from 'vue'
import { downloadPDF } from '../../utils/downloadDataProcedures'
import getCurrentMonth from '../../utils/getCurrentMonth'

export const NetPositionDialog = (props, emit, formatAmount) => {
  const isMobile = ref(window.innerWidth < 768)
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 768
  })

  const netPositionContent = ref(null)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const handleClose = () => {
    visible.value = false
  }

  async function downloadPdf() {
    if (!netPositionContent.value) return
    const el = netPositionContent.value
    const lightVars = {
      '--el-bg-color': '#ffffff',
      '--el-text-color-primary': '#1f2937',
      '--el-text-color-regular': '#374151',
      '--el-border-color': '#e5e7eb',
      '--el-border-color-lighter': '#f3f4f6',
      '--el-fill-color-lighter': '#f9fafb',
      '--el-color-success': '#22c55e',
      '--el-color-warning': '#f59e0b'
    }
    const prevBg = el.style.backgroundColor
    const prevColor = el.style.color
    const prevMaxHeight = el.style.maxHeight
    const prevOverflow = el.style.overflow
    Object.entries(lightVars).forEach(([k, v]) => el.style.setProperty(k, v))
    el.style.backgroundColor = '#ffffff'
    el.style.color = '#1f2937'
    el.style.maxHeight = 'none'
    el.style.overflow = 'visible'
    await downloadPDF(
      el,
      `${getCurrentMonth()}_Net_Position_`,
      'Expenses Summary'
    )
    Object.keys(lightVars).forEach((k) => el.style.removeProperty(k))
    el.style.backgroundColor = prevBg
    el.style.color = prevColor
    el.style.maxHeight = prevMaxHeight
    el.style.overflow = prevOverflow
  }

  const overallDonutSegments = computed(() => [
    {
      label: 'You Will Receive',
      value: props.summary?.totalLender ?? 0,
      formatted: formatAmount(props.summary?.totalLender ?? 0)
    },
    {
      label: 'You Will Pay',
      value: props.summary?.totalDebtor ?? 0,
      formatted: formatAmount(props.summary?.totalDebtor ?? 0)
    }
  ])

  const categoryBarItems = computed(() => {
    if (!props.summary) return []
    const s = props.summary
    return [
      {
        label: 'Shared Exp ↑',
        value: s.sharedExpenses.lenderAmount,
        formatted: formatAmount(s.sharedExpenses.lenderAmount)
      },
      {
        label: 'Shared Exp ↓',
        value: s.sharedExpenses.debtorAmount,
        formatted: formatAmount(s.sharedExpenses.debtorAmount)
      },
      {
        label: 'Shared Loan ↑',
        value: s.sharedLoans.lenderAmount,
        formatted: formatAmount(s.sharedLoans.lenderAmount)
      },
      {
        label: 'Shared Loan ↓',
        value: s.sharedLoans.debtorAmount,
        formatted: formatAmount(s.sharedLoans.debtorAmount)
      },
      {
        label: 'Personal Loan ↑',
        value: s.personalLoans.lenderAmount,
        formatted: formatAmount(s.personalLoans.lenderAmount)
      },
      {
        label: 'Personal Loan ↓',
        value: s.personalLoans.debtorAmount,
        formatted: formatAmount(s.personalLoans.debtorAmount)
      }
    ]
  })

  return {
    isMobile,
    netPositionContent,
    visible,
    handleClose,
    downloadPdf,
    overallDonutSegments,
    categoryBarItems
  }
}
