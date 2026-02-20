import { ElMessage } from 'element-plus'
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
  nextTick
} from 'vue'
import { store } from '../stores/store'
import { getEditComponent } from '../utils/active-tab'
import { Tabs } from '../assets/enums'
import { downloadExcel, downloadPDF } from '../utils/downloadDataProcedures'
import getCurrentMonth from '../utils/getCurrentMonth'

export const Table = (props) => {
  const timeout = ref(null)
  const delay = 300
  const dialogFormVisible = ref(false)
  const state = reactive({ row: null })
  const screenWidth = ref(window.innerWidth)
  const tabStore = store()
  const childRef = ref(null)

  const activeTab = computed(() => tabStore.$state.activeTab)
  const activeTabComponent = () => getEditComponent(activeTab.value)

  const dialogComponentProps = computed(() => {
    const base = { friends: props.friends, row: state.row }
    if (activeTab.value === Tabs.PERSONAL_LOANS) {
      return {
        ...base,
        dbRef: 'personal-loans',
        isPersonal: true,
        showForm: true
      }
    }
    if (activeTab.value === Tabs.SHARED_LOANS) {
      return { ...base, showForm: true }
    }
    return base
  })

  const isDownloadAvailable = ref(props.rows.length > 0)

  watch(
    () => props.rows,
    (newRows) => {
      isDownloadAvailable.value = newRows.length > 0
    },
    { immediate: true, deep: true }
  )

  const formatAmount = inject('formatAmount')

  async function update() {
    await nextTick()
    
    // Wait for component to be fully mounted with retries
    let retries = 0
    while (!childRef.value?.componentRef && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }
    
    console.log('update called, childRef:', childRef.value)
    console.log('componentRef:', childRef.value?.componentRef)
    if (!childRef.value?.componentRef) {
      console.error('Component ref not available after retries')
      ElMessage.error('Form is not ready. Please try again.')
      return
    }
    childRef.value.componentRef.validateForm('Update', childRef.value.componentRef)
  }
  
  async function remove() {
    await nextTick()
    
    // Wait for component to be fully mounted with retries
    let retries = 0
    while (!childRef.value?.componentRef && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }
    
    console.log('remove called, childRef:', childRef.value)
    console.log('componentRef:', childRef.value?.componentRef)
    if (!childRef.value?.componentRef) {
      console.error('Component ref not available after retries')
      ElMessage.error('Form is not ready. Please try again.')
      return
    }
    childRef.value.componentRef.validateForm('Delete', childRef.value.componentRef)
  }

  function updateScreenWidth() {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateScreenWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })

  const dialogWidth = computed(() => {
    return screenWidth.value < 600 ? screenWidth.value * 0.95 : 500
  })

  const headers = computed(() => {
    if (props.rows.length > 0) {
      const cols = Object.keys(props.rows[0]).filter(
        (col) =>
          ![
            'whenAdded',
            'whoAdded',
            'group',
            'participants',
            'updateRequest',
            'deleteRequest',
            'notifications',
            'payerMode',
            'splitMode',
            'splitItems'
          ].includes(col)
      )
      return cols.map((key) => ({
        label: key,
        key: key === 'payers' ? 'payer' : key
      }))
    }

    return []
  })

  const handleClick = (rowS, rowIndex) => {
    if (rowS.deleteRequest || rowS.updateRequest) {
      const requestType = rowS.deleteRequest ? 'delete' : 'update'
      const requester =
        rowS.deleteRequest?.requestedBy || rowS.updateRequest?.requestedBy
      const currentUser = tabStore.getActiveUser

      if (requester === currentUser) {
        ElMessage.info(
          `You have a pending ${requestType} request. Please wait for approval or cancel it from the pending requests section.`
        )
      } else {
        ElMessage.warning(
          `This item has a pending ${requestType} request. Please approve or reject it before making changes.`
        )
      }
      return
    }

    let date = rowS.date?.split(',')[0].split('/').reverse().join('-')
    let time = rowS.date?.split(',')[1]
    date = date + ', ' + time
    clearTimeout(timeout.value)
    timeout.value = setTimeout(() => {
      dialogFormVisible.value = true
      state.row = { ...rowS, date, id: props.keys[rowIndex] }
    }, delay)
  }

  function getDetails(row) {
    if (row.whoAdded) {
      return row?.whoAdded + ' on ' + (row?.whenAdded || 'N/A')
    } else return 'N/A'
  }

  const handleDoubleClick = (row) => {
    clearTimeout(timeout.value)
    ElMessage.info('Added By: ' + getDetails(row))
  }

  function downloadExcelData() {
    downloadExcel(
      props.rows,
      getCurrentMonth() + `_${props.downloadTitle}_`,
      props.downloadTitle
    )
  }

  function downloadPdfData() {
    downloadPDF(props.dataRef, getCurrentMonth() + `_${props.downloadTitle}_`)
  }

  return {
    tabStore,
    dialogFormVisible,
    state,
    childRef,
    activeTabComponent,
    dialogComponentProps,
    isDownloadAvailable,
    formatAmount,
    dialogWidth,
    headers,
    update,
    remove,
    handleClick,
    handleDoubleClick,
    downloadExcelData,
    downloadPdfData
  }
}
