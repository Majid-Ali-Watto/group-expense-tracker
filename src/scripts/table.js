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
  const clickTimeout = ref(null)
  const lastClickTime = ref(0)
  const doubleClickThreshold = 300
  const dialogFormVisible = ref(false)
  const state = reactive({ row: null })
  const screenWidth = ref(window.innerWidth)
  const tabStore = store()
  const childRef = ref(null)

  const activeTab = computed(() => tabStore.$state.activeTab)
  const activeTabComponent = () => getEditComponent(activeTab.value)

  const dialogComponentProps = computed(() => {
    const base = {
      row: {
        ...state.row,
        loanGiverMobile: state.row?.loanGiver || '',
        loanReceiverMobile: state.row?.loanReceiver || ''
      }
    }
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
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
    }

    if (!childRef.value?.componentRef) {
      ElMessage.error('Form is not ready. Please try again.')
      return
    }
    childRef.value.componentRef.validateForm('Update')
  }

  async function remove() {
    await nextTick()

    // Wait for component to be fully mounted with retries
    let retries = 0
    while (!childRef.value?.componentRef && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
    }

    if (!childRef.value?.componentRef) {
      ElMessage.error('Form is not ready. Please try again.')
      return
    }
    childRef.value.componentRef.validateForm('Delete')
  }

  async function duplicate() {
    await nextTick()

    let retries = 0
    while (!childRef.value?.componentRef && retries < 10) {
      await new Promise((resolve) => setTimeout(resolve, 50))
      retries++
    }

    if (!childRef.value?.componentRef) {
      ElMessage.error('Form is not ready. Please try again.')
      return
    }
    childRef.value.componentRef.validateForm('Save')
  }

  function updateScreenWidth() {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', updateScreenWidth)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
    clearTimeout(clickTimeout.value)
  })

  const dialogWidth = computed(() => {
    return screenWidth.value < 600 ? screenWidth.value * 0.95 : 500
  })

  const headers = computed(() => {
    if (props.rows.length > 0) {
      const isSharedExpenses = activeTab.value === Tabs.SHARED_EXPENSES
      const isSharedLoans = activeTab.value === Tabs.SHARED_LOANS
      const isPersonalExpenses = activeTab.value === Tabs.PERSONAL_EXPENSES
      const isPersonalLoans = activeTab.value === Tabs.PERSONAL_LOANS

      const excludedCols = [
        'whenAdded',
        'whoAdded',
        'group',
        'participants',
        'updateRequest',
        'deleteRequest',
        'notifications',
        'payerMode',
        'splitMode',
        'splitItems',
        'receiptMeta',
        'receiptUrls',
        'receiptUrl'
      ]
      if (isSharedLoans) excludedCols.push('giverName', 'receiverName')

      const rowKeys = Object.keys(props.rows[0])

      const cols = rowKeys.filter((col) => !excludedCols.includes(col))

      if (isSharedExpenses) cols.push('receiptUrls')
      if (isPersonalExpenses || isPersonalLoans || isSharedLoans)
        cols.push('receiptUrl')

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
    dialogFormVisible.value = true
    state.row = { ...rowS, date, id: props.keys[rowIndex] }
  }

  const handleDoubleClick = (row) => {
    const addedBy = row?.whoAdded || 'N/A'
    const when = row?.whenAdded || 'N/A'

    ElMessage({
      type: 'info',
      duration: 5000,
      showClose: true,
      customClass: 'table-toast',
      dangerouslyUseHTMLString: true,
      message: `
        <div class="table-toast__content">
          <div class="table-toast__label">Added By</div>
          <div class="table-toast__value">${addedBy}</div>
          <div class="table-toast__label">Date</div>
          <div class="table-toast__value">${when}</div>
        </div>
      `
    })
  }

  const handleRowClick = (rowS, rowIndex) => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTime.value
    lastClickTime.value = now

    clearTimeout(clickTimeout.value)

    if (timeSinceLastClick < doubleClickThreshold) {
      handleDoubleClick(rowS)
    } else {
      clickTimeout.value = setTimeout(
        () => handleClick(rowS, rowIndex),
        doubleClickThreshold
      )
    }
  }

  // Converts a rendered el-table element into a plain <table> by reading
  // the already-rendered cell text nodes. This avoids el-table's internal
  // horizontal scrollbar clipping that html2canvas cannot un-clip.
  function buildRealTableFromElTable(elTableEl) {
    const headerCells = Array.from(
      elTableEl.querySelectorAll('.el-table__header thead tr th .cell')
    )
    const headers = headerCells.map((th) => th.textContent.trim()).filter(Boolean)
    if (!headers.length) return null

    const bodyRows = Array.from(
      elTableEl.querySelectorAll('.el-table__body tbody tr')
    )
    const rows = bodyRows
      .map((tr) =>
        Array.from(tr.querySelectorAll('td .cell')).map((td) => td.textContent.trim())
      )
      .filter((row) => row.length > 0)

    const table = document.createElement('table')
    table.style.cssText =
      'width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:12px;margin-bottom:16px;'

    const thead = document.createElement('thead')
    const headerTr = document.createElement('tr')
    headerTr.style.backgroundColor = '#22c55e'
    headers.forEach((h) => {
      const th = document.createElement('th')
      th.textContent = h
      th.style.cssText =
        'padding:8px 12px;border:1px solid #16a34a;color:#fff;font-weight:600;font-size:11px;letter-spacing:.05em;text-align:left;'
      headerTr.appendChild(th)
    })
    thead.appendChild(headerTr)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    rows.forEach((cells, idx) => {
      const tr = document.createElement('tr')
      tr.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb'
      cells.forEach((cellText) => {
        const td = document.createElement('td')
        td.textContent = cellText
        td.style.cssText =
          'padding:6px 12px;border:1px solid #d1d5db;color:#1f2937;font-size:12px;word-break:break-word;'
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    return table
  }

  function buildPrintTable(hdrs, rowsData) {
    const table = document.createElement('table')
    table.style.cssText =
      'width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:12px;'

    // ── header ──
    const thead = document.createElement('thead')
    const headerTr = document.createElement('tr')
    headerTr.style.backgroundColor = '#22c55e'
    hdrs.forEach((h) => {
      const th = document.createElement('th')
      th.textContent = h.label.toUpperCase()
      th.style.cssText =
        'padding:8px 12px;border:1px solid #16a34a;color:#fff;font-weight:600;font-size:11px;letter-spacing:.05em;text-align:left;'
      headerTr.appendChild(th)
    })
    thead.appendChild(headerTr)
    table.appendChild(thead)

    // ── body ──
    const tbody = document.createElement('tbody')
    rowsData.forEach((row, idx) => {
      const tr = document.createElement('tr')
      tr.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb'
      if (row.deleteRequest)
        tr.style.backgroundColor = '#fff1f2'
      else if (row.updateRequest)
        tr.style.backgroundColor = '#fff7ed'

      hdrs.forEach((h) => {
        const td = document.createElement('td')
        td.style.cssText =
          'padding:6px 12px;border:1px solid #d1d5db;color:#1f2937;font-size:12px;word-break:break-word;'

        const key = h.key
        if (key === 'amount') {
          td.textContent = formatAmount(row[key]) ?? '—'
        } else if (key === 'payer') {
          if (row.payerMode === 'multiple' && row.payers?.length) {
            td.textContent = row.payers
              .map((p) => {
                const name = tabStore.getUserByMobile(p.mobile)?.name || p.mobile
                return `${name} (${p.mobile}): ${formatAmount(p.amount)}`
              })
              .join('\n')
          } else {
            const name = tabStore.getUserByMobile(row.payer)?.name
            td.textContent = name ? `${name} (${row.payer})` : (row.payer ?? '—')
          }
        } else if (key === 'split') {
          if (Array.isArray(row.split)) {
            td.textContent = row.split
              .map((s) => {
                const name = tabStore.getUserByMobile(s.mobile)?.name || s.mobile
                return `${name}: ${formatAmount(s.amount)}`
              })
              .join('\n')
          } else {
            td.textContent = row.split ?? '—'
          }
        } else if (key === 'giver' || key === 'receiver') {
          const name = tabStore.getUserByMobile(row[key])?.name
          td.textContent = name ? `${name} (${row[key]})` : (row[key] ?? '—')
        } else if (key === 'receiptUrls') {
          if (Array.isArray(row.receiptUrls) && row.receiptUrls.length) {
            row.receiptUrls.forEach((url, i) => {
              if (i > 0) td.appendChild(document.createElement('br'))
              const a = document.createElement('a')
              a.href = url
              a.textContent = `Receipt ${i + 1}`
              a.style.cssText = 'color:#2563eb;text-decoration:underline;font-size:12px;'
              td.appendChild(a)
            })
          } else {
            td.textContent = '—'
          }
        } else if (key === 'receiptUrl') {
          if (row.receiptUrl) {
            const a = document.createElement('a')
            a.href = row.receiptUrl
            a.textContent = 'View Receipt'
            a.style.cssText = 'color:#2563eb;text-decoration:underline;font-size:12px;'
            td.appendChild(a)
          } else {
            td.textContent = '—'
          }
        } else {
          const val = row[key]
          td.textContent =
            val == null
              ? '—'
              : typeof val === 'object'
                ? JSON.stringify(val)
                : String(val)
        }
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    return table
  }

  function downloadPdfData() {
    if (!props.dataRef) return
    const printHeaders = headers.value
    const printRows = props.rows
    if (!printHeaders.length || !printRows.length) return

    // 1. Hide filter toolbar + any filter-bar rows in live DOM
    const noPrint = Array.from(
      props.dataRef.querySelectorAll('.no-print-pdf, .filter-bar')
    )
    noPrint.forEach((el) => (el.style.display = 'none'))

    // 2. Force-expand any collapsed el-collapse panels (e.g., Summary)
    //    When collapsed, Vue v-show sets display:none on el-collapse-item__wrap
    const collapseWraps = Array.from(
      props.dataRef.querySelectorAll('.el-collapse-item__wrap')
    )
    const collapseWrapOrigDisplay = collapseWraps.map((el) => el.style.display)
    collapseWraps.forEach((el) => {
      el.style.display = 'block'
      el.style.height = 'auto'
      el.style.overflow = 'visible'
    })

    // 3. Override CSS variables to force light mode on the captured section
    //    (in case the user has dark theme active, which would produce dark backgrounds)
    const lightVarDefs = {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f9fafb',
      '--text-primary': '#1f2937',
      '--text-secondary': '#6b7280',
      '--border-color': '#e5e7eb',
      '--card-bg': '#fafafa',
      '--hover-bg': '#f3f4f6',
    }
    Object.entries(lightVarDefs).forEach(([k, v]) =>
      props.dataRef.style.setProperty(k, v)
    )
    const prevBg = props.dataRef.style.backgroundColor
    const prevColor = props.dataRef.style.color
    const prevPadding = props.dataRef.style.padding
    props.dataRef.style.backgroundColor = '#ffffff'
    props.dataRef.style.color = '#1f2937'
    props.dataRef.style.padding = '16px'

    // 4. Replace regular el-table instances (Settlement, Who Owes Whom) with plain
    //    <table> elements built from rendered cell text. el-table's internal horizontal
    //    scroll clips columns that overflow, and html2canvas reads the already-computed
    //    layout so CSS !important overrides don't help. DOM replacement is the only
    //    reliable fix.
    const elTables = Array.from(props.dataRef.querySelectorAll('.el-table'))
    const elTableRestorations = []
    elTables.forEach((elTableEl) => {
      const realTable = buildRealTableFromElTable(elTableEl)
      if (!realTable) return
      const parent = elTableEl.parentNode
      const sibling = elTableEl.nextSibling
      parent.replaceChild(realTable, elTableEl)
      elTableRestorations.push(() => {
        realTable.remove()
        if (sibling) parent.insertBefore(elTableEl, sibling)
        else parent.appendChild(elTableEl)
      })
    })

    // 5. Temporarily replace the virtualized scroll wrapper with a real <table>
    //    so html2canvas captures every row (not just visible ones in virtual scroll)
    const scrollWrapper = props.dataRef.querySelector('.expense-table-v2-scroll-wrapper')
    const realTable = buildPrintTable(printHeaders, printRows)
    let restoreTable = null
    if (scrollWrapper) {
      const parent = scrollWrapper.parentNode
      const sibling = scrollWrapper.nextSibling
      parent.replaceChild(realTable, scrollWrapper)
      restoreTable = () => {
        realTable.remove()
        if (sibling) parent.insertBefore(scrollWrapper, sibling)
        else parent.appendChild(scrollWrapper)
      }
    }

    // 6. Capture the live dataRef DOM, then restore everything
    const pdfTitle = props.downloadTitle.replace(/_/g, ' ') + ' Report'
    const pdfSubtitle = props.reportMonth ? `Report for: ${props.reportMonth}` : ''
    downloadPDF(props.dataRef, getCurrentMonth() + `_${props.downloadTitle}_`, pdfTitle, pdfSubtitle).finally(() => {
      // Restore no-print elements
      noPrint.forEach((el) => (el.style.display = ''))
      // Restore collapsed panels
      collapseWraps.forEach((el, i) => {
        el.style.display = collapseWrapOrigDisplay[i]
        el.style.height = ''
        el.style.overflow = ''
      })
      // Restore CSS vars
      Object.keys(lightVarDefs).forEach((k) => props.dataRef.style.removeProperty(k))
      props.dataRef.style.backgroundColor = prevBg
      props.dataRef.style.color = prevColor
      props.dataRef.style.padding = prevPadding
      // Restore el-tables (Settlement, Who Owes Whom)
      elTableRestorations.forEach((restore) => restore())
      // Restore virtual table
      if (restoreTable) restoreTable()
    })
  }

  function downloadExcelData() {
    downloadExcel(
      props.rows,
      getCurrentMonth() + `_${props.downloadTitle}_`,
      props.downloadTitle
    )
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
    duplicate,
    handleRowClick,
    downloadExcelData,
    downloadPdfData
  }
}
