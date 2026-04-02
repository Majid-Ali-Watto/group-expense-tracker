import { ElMessage, ElMessageBox } from 'element-plus'
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue'
import {
  useAuthStore,
  useTabStore,
  useGroupStore,
  useUserStore
} from '@/stores'
import {
  getEditComponent,
  downloadExcel,
  downloadPDF,
  getCurrentMonth,
  formatUserDisplay,
  buildRequestMeta,
  startLoading,
  stopLoading,
  showSuccess,
  showError
} from '@/utils'
import { Tabs } from '@/assets'
import { database, writeBatch, doc } from '@/firebase'
import { DB_NODES } from '@/constants'
import { useDebouncedRef } from '@/composables'
import { useRoute, useRouter } from 'vue-router'

export const Table = (props) => {
  const clickTimeout = ref(null)
  const lastClickTime = ref(0)
  const doubleClickThreshold = 300
  const dialogFormVisible = ref(false)
  const deleteMode = ref(false)
  const state = reactive({ row: null })
  const screenWidth = ref(window.innerWidth)
  const authStore = useAuthStore()
  const tabStore = useTabStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const childRef = ref(null)

  const activeTab = computed(() => tabStore.activeTab)
  const activeGroupObj = computed(() =>
    groupStore.getActiveGroup
      ? groupStore.getGroupById(groupStore.getActiveGroup)
      : null
  )
  const activeTabComponent = () => getEditComponent(activeTab.value)

  const storeProxy = {
    get getActiveUser() {
      return authStore.getActiveUser
    },
    getUserByMobile: (m) => userStore.getUserByMobile(m)
  }
  const formatUser = (mobile, name = null) =>
    formatUserDisplay(storeProxy, mobile, {
      name,
      group: activeGroupObj.value,
      preferMasked: !activeGroupObj.value
    })

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
        dbRef: DB_NODES.PERSONAL_LOANS,
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

  function waitForComponentRef(timeoutMs = 5000) {
    if (childRef.value?.componentRef)
      return Promise.resolve(childRef.value.componentRef)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        stop()
        reject(new Error('Form is not ready. Please try again.'))
      }, timeoutMs)
      const stop = watch(
        () => childRef.value?.componentRef,
        (val) => {
          if (val) {
            clearTimeout(timer)
            stop()
            resolve(val)
          }
        },
        { immediate: true }
      )
    })
  }

  async function update() {
    try {
      const ref = await waitForComponentRef()
      ref.validateForm('Update')
    } catch (e) {
      ElMessage.error(e.message)
    }
  }

  async function remove() {
    try {
      const ref = await waitForComponentRef()
      ref.validateForm('Delete')
    } catch (e) {
      ElMessage.error(e.message)
    }
  }

  async function duplicate() {
    try {
      const ref = await waitForComponentRef()
      ref.validateForm('Save')
    } catch (e) {
      ElMessage.error(e.message)
    }
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
      const isSharedLoans = activeTab.value === Tabs.SHARED_LOANS

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
        'id',
        '_month',
        'month'
      ]
      if (isSharedLoans) excludedCols.push('giverName', 'receiverName')

      const rowKeys = Object.keys(props.rows[0])

      const cols = rowKeys.filter((col) => !excludedCols.includes(col))

      return cols
        .map((key) => ({
          label: key,
          key: key === 'payers' ? 'payer' : key
        }))
        .sort((a, b) => {
          if (a.label < b.label) return -1
          if (a.label > b.label) return 1
          return 0
        })
        .concat({ key: 'receiptUrls', label: 'Receipts' })
    }

    return []
  })

  const handleClick = (rowS, rowIndex) => {
    if (rowS.deleteRequest || rowS.updateRequest) {
      const requestType = rowS.deleteRequest ? 'delete' : 'update'
      const requester =
        rowS.deleteRequest?.requestedBy || rowS.updateRequest?.requestedBy
      const currentUser = authStore.getActiveUser

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
    const whoAdded = row?.whoAdded
    const addedBy = whoAdded
      ? formatUserDisplay(storeProxy, whoAdded, { group: activeGroupObj.value })
      : 'N/A'
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

  const openForDelete = (rowS, rowIndex) => {
    if (rowS.deleteRequest || rowS.updateRequest) {
      const requestType = rowS.deleteRequest ? 'delete' : 'update'
      const requester =
        rowS.deleteRequest?.requestedBy || rowS.updateRequest?.requestedBy
      const currentUser = authStore.getActiveUser
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
    deleteMode.value = true
    dialogFormVisible.value = true
    state.row = { ...rowS, date, id: props.keys[rowIndex] }
  }

  // Converts a rendered el-table element into a plain <table> by reading
  // the already-rendered cell text nodes. This avoids el-table's internal
  // horizontal scrollbar clipping that html2canvas cannot un-clip.
  function buildRealTableFromElTable(elTableEl) {
    const headerCells = Array.from(
      elTableEl.querySelectorAll('.el-table__header thead tr th .cell')
    )
    const headers = headerCells
      .map((th) => th.textContent.trim())
      .filter(Boolean)
    if (!headers.length) return null

    const bodyRows = Array.from(
      elTableEl.querySelectorAll('.el-table__body tbody tr')
    )
    const rows = bodyRows
      .map((tr) =>
        Array.from(tr.querySelectorAll('td .cell')).map((td) =>
          td.textContent.trim()
        )
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
      if (row.deleteRequest) tr.style.backgroundColor = '#fff1f2'
      else if (row.updateRequest) tr.style.backgroundColor = '#fff7ed'

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
                return `${formatUser(p.mobile)}: ${formatAmount(p.amount)}`
              })
              .join('\n')
          } else {
            td.textContent = row.payer ? formatUser(row.payer) : '—'
          }
        } else if (key === 'split') {
          if (Array.isArray(row.split)) {
            td.textContent = row.split
              .map((s) => {
                return `${formatUser(s.mobile, s.name)}: ${formatAmount(s.amount)}`
              })
              .join('\n')
          } else {
            td.textContent = row.split ?? '—'
          }
        } else if (key === 'giver' || key === 'receiver') {
          td.textContent = row[key] ? formatUser(row[key]) : '—'
        } else if (key === 'receiptUrls') {
          if (Array.isArray(row.receiptUrls) && row.receiptUrls.length) {
            row.receiptUrls.forEach((url, i) => {
              if (i > 0) td.appendChild(document.createElement('br'))
              const a = document.createElement('a')
              a.href = url
              a.textContent = `Receipt ${i + 1}`
              a.style.cssText =
                'color:#2563eb;text-decoration:underline;font-size:12px;'
              td.appendChild(a)
            })
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
      '--hover-bg': '#f3f4f6'
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
    const scrollWrapper = props.dataRef.querySelector(
      '.expense-table-v2-scroll-wrapper'
    )
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
    const pdfSubtitle = props.reportMonth
      ? `Report for: ${props.reportMonth}`
      : ''
    downloadPDF(
      props.dataRef,
      getCurrentMonth() + `_${props.downloadTitle}_`,
      pdfTitle,
      pdfSubtitle
    ).finally(() => {
      // Restore no-print elements
      noPrint.forEach((el) => (el.style.display = ''))
      // Restore collapsed panels
      collapseWraps.forEach((el, i) => {
        el.style.display = collapseWrapOrigDisplay[i]
        el.style.height = ''
        el.style.overflow = ''
      })
      // Restore CSS vars
      Object.keys(lightVarDefs).forEach((k) =>
        props.dataRef.style.removeProperty(k)
      )
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

  // --- Virtualized table sizing ---
  const containerRef = ref(null)
  const containerWidth = ref(800)
  const tableHeight = computed(() => Math.floor(window.innerHeight * 0.6))

  // --- Row Selection ---
  const selectedKeys = ref([])

  const isAllSelected = computed(
    () =>
      filteredSortedRows.value.length > 0 &&
      filteredSortedRows.value.every((r) =>
        selectedKeys.value.includes(r._origIndex)
      )
  )

  const isIndeterminate = computed(() => {
    const count = filteredSortedRows.value.filter((r) =>
      selectedKeys.value.includes(r._origIndex)
    ).length
    return count > 0 && count < filteredSortedRows.value.length
  })

  function toggleSelectAll(val) {
    if (val) {
      selectedKeys.value = filteredSortedRows.value.map((r) => r._origIndex)
    } else {
      selectedKeys.value = []
    }
  }

  function toggleSelectRow(origIndex) {
    if (selectedKeys.value.includes(origIndex)) {
      selectedKeys.value = selectedKeys.value.filter((k) => k !== origIndex)
    } else {
      selectedKeys.value = [...selectedKeys.value, origIndex]
    }
  }

  function isRowSelected(origIndex) {
    return selectedKeys.value.includes(origIndex)
  }

  function clearSelection() {
    selectedKeys.value = []
  }

  const selectedRows = computed(() =>
    props.rows.filter((_, i) => selectedKeys.value.includes(i))
  )

  watch(
    () => props.rows,
    () => {
      selectedKeys.value = []
    }
  )

  const isBulkDeleteDirectly = computed(
    () =>
      activeTab.value === Tabs.PERSONAL_EXPENSES ||
      activeTab.value === Tabs.PERSONAL_LOANS
  )

  async function bulkDeleteSelected() {
    if (!selectedKeys.value.length) return

    const eligible = filteredSortedRows.value.filter(
      (r) =>
        selectedKeys.value.includes(r._origIndex) &&
        !r.deleteRequest &&
        !r.updateRequest
    )
    const skipped = selectedKeys.value.length - eligible.length

    if (!eligible.length) {
      ElMessage.warning(
        'All selected items have pending requests and cannot be deleted.'
      )
      return
    }

    const isShared = !isBulkDeleteDirectly.value
    const actionLabel = isShared ? 'Send delete requests for' : 'Delete'
    const skippedNote = skipped
      ? ` (${skipped} skipped — pending requests)`
      : ''

    try {
      await ElMessageBox.confirm(
        `${actionLabel} ${eligible.length} item(s)?${skippedNote}`,
        'Bulk Delete',
        {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          type: 'error'
        }
      )
    } catch {
      return
    }

    const loading = startLoading()
    try {
      const groupId = groupStore.getActiveGroup
      const month = props.reportMonth
      const user = authStore.getActiveUser
      const tab = activeTab.value
      const deleteRequestMeta = isShared ? buildRequestMeta(storeProxy) : null

      const batch = writeBatch(database)
      for (const row of eligible) {
        const key = props.keys[row._origIndex]

        if (tab === Tabs.SHARED_EXPENSES) {
          const docRef = doc(
            database,
            DB_NODES.SHARED_EXPENSES,
            groupId,
            'months',
            month,
            'payments',
            key
          )
          batch.update(docRef, { deleteRequest: deleteRequestMeta })
        } else if (tab === Tabs.SHARED_LOANS) {
          const docRef = doc(
            database,
            DB_NODES.SHARED_LOANS,
            groupId,
            'months',
            month,
            'loans',
            key
          )
          batch.update(docRef, { deleteRequest: deleteRequestMeta })
        } else if (tab === Tabs.PERSONAL_LOANS) {
          const loanMonth = row._month || month
          const docRef = doc(
            database,
            DB_NODES.PERSONAL_LOANS,
            user,
            'months',
            loanMonth,
            'loans',
            key
          )
          batch.delete(docRef)
        } else if (tab === Tabs.PERSONAL_EXPENSES) {
          const docRef = doc(
            database,
            DB_NODES.PERSONAL_EXPENSES,
            user,
            'months',
            month,
            'expenses',
            key
          )
          batch.delete(docRef)
        }
      }

      await batch.commit()

      clearSelection()
      if (isShared) {
        showSuccess(
          `Delete request sent for ${eligible.length} item(s). Waiting for group approval.`
        )
      } else {
        showSuccess(`${eligible.length} item(s) deleted successfully.`)
      }
    } catch (err) {
      showError(err.message || 'Bulk delete failed.')
    } finally {
      stopLoading(loading)
    }
  }

  function downloadSelectedExcel() {
    if (!selectedRows.value.length) return
    downloadExcel(
      selectedRows.value,
      getCurrentMonth() + `_${props.downloadTitle}_Selected_`,
      `${props.downloadTitle} (Selected)`
    )
  }

  async function downloadSelectedPdf() {
    if (!selectedRows.value.length || !props.dataRef) return
    const printHeaders = headers.value
    if (!printHeaders.length) return

    // Mirror downloadPdfData exactly — operate on the live props.dataRef so
    // html2canvas captures a fully-rendered, in-viewport element with all CSS
    // variables applied. Only difference: buildPrintTable uses selectedRows only.

    const noPrint = Array.from(
      props.dataRef.querySelectorAll('.no-print-pdf, .filter-bar')
    )
    noPrint.forEach((el) => (el.style.display = 'none'))

    const lightVarDefs = {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f9fafb',
      '--text-primary': '#1f2937',
      '--text-secondary': '#6b7280',
      '--border-color': '#e5e7eb',
      '--card-bg': '#fafafa',
      '--hover-bg': '#f3f4f6'
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

    const scrollWrapper = props.dataRef.querySelector(
      '.expense-table-v2-scroll-wrapper'
    )
    const printTable = buildPrintTable(printHeaders, selectedRows.value)
    let restoreTable = null
    if (scrollWrapper) {
      const parent = scrollWrapper.parentNode
      const sibling = scrollWrapper.nextSibling
      parent.replaceChild(printTable, scrollWrapper)
      restoreTable = () => {
        printTable.remove()
        if (sibling) parent.insertBefore(scrollWrapper, sibling)
        else parent.appendChild(scrollWrapper)
      }
    }

    const title = `${props.downloadTitle.replace(/_/g, ' ')} — ${selectedRows.value.length} selected row(s)`
    const subtitle = props.reportMonth ? `Report for: ${props.reportMonth}` : ''

    await downloadPDF(
      props.dataRef,
      `${getCurrentMonth()}_${props.downloadTitle}_Selected_`,
      title,
      subtitle
    ).finally(() => {
      noPrint.forEach((el) => (el.style.display = ''))
      Object.keys(lightVarDefs).forEach((k) =>
        props.dataRef.style.removeProperty(k)
      )
      props.dataRef.style.backgroundColor = prevBg
      props.dataRef.style.color = prevColor
      props.dataRef.style.padding = prevPadding
      if (restoreTable) restoreTable()
    })
  }

  const columnOrder = ref([])
  const dragSourceKey = ref(null)

  watch(activeTab, () => {
    columnOrder.value = []
    selectedKeys.value = []
  })

  watch(
    headers,
    (newHeaders) => {
      const headerKeys = newHeaders?.map((h) => h.key)
      const sameKeys =
        headerKeys.length === columnOrder.value.length &&
        headerKeys.every((k) => columnOrder.value.includes(k))
      if (!sameKeys) {
        columnOrder.value = headerKeys
      }
    },
    { immediate: true }
  )

  let resizeObserver = null

  onMounted(() => {
    if (containerRef.value) {
      containerWidth.value = containerRef.value.clientWidth
      resizeObserver = new ResizeObserver((entries) => {
        containerWidth.value = entries[0].contentRect.width
      })
      resizeObserver.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
  })

  // --- Filter & Sort ---
  const route = useRoute()
  const router = useRouter()
  const filterText = useDebouncedRef(route.query.search || '', 300)
  const sortKey = ref(null)
  const sortOrder = ref('asc')

  // Sync table search to URL so it survives sharing and is bookmarkable.
  // Uses route.path so it works on any tab without knowing which tab it is.
  watch(filterText, (val) => {
    const query = { ...route.query }
    if (val.trim()) query.search = val.trim()
    else delete query.search
    router.replace({ path: route.path, query })
  })

  function clearSort() {
    sortKey.value = null
    sortOrder.value = 'asc'
  }

  function toggleSort(key) {
    if (sortKey.value === key) {
      if (sortOrder.value === 'asc') sortOrder.value = 'desc'
      else {
        sortKey.value = null
        sortOrder.value = 'asc'
      }
    } else {
      sortKey.value = key
      sortOrder.value = 'asc'
    }
  }

  const filteredSortedRows = computed(() => {
    let data = props.rows.map((row, i) => ({ ...row, _origIndex: i }))
    const q = filterText.value.trim().toLowerCase()
    if (q) {
      data = data.filter((row) =>
        Object.entries(row).some(([k, val]) => {
          if (
            k.startsWith('_') ||
            k === 'deleteRequest' ||
            k === 'updateRequest'
          )
            return false
          if (Array.isArray(val))
            return JSON.stringify(val).toLowerCase().includes(q)
          if (typeof val === 'object' && val !== null)
            return JSON.stringify(val).toLowerCase().includes(q)
          return String(val ?? '')
            .toLowerCase()
            .includes(q)
        })
      )
    }
    if (sortKey.value) {
      const key = sortKey.value
      const order = sortOrder.value
      data = [...data].sort((a, b) => {
        const av = a[key] ?? ''
        const bv = b[key] ?? ''
        const an = parseFloat(av)
        const bn = parseFloat(bv)
        if (!isNaN(an) && !isNaN(bn)) return order === 'asc' ? an - bn : bn - an
        const as = String(av).toLowerCase()
        const bs = String(bv).toLowerCase()
        if (as < bs) return order === 'asc' ? -1 : 1
        if (as > bs) return order === 'asc' ? 1 : -1
        return 0
      })
    }
    return data
  })

  // --- Column definitions ---
  const MIN_COL_WIDTH = 150
  const ACTIONS_COL_WIDTH = 80
  const SELECT_COL_WIDTH = 50
  const tableColumns = computed(() => {
    if (!headers.value.length) return []
    const count = headers.value.length
    const availableWidth =
      containerWidth.value - ACTIONS_COL_WIDTH - SELECT_COL_WIDTH
    const defaultColWidth = Math.max(
      MIN_COL_WIDTH,
      Math.floor(availableWidth / count)
    )
    const orderedHeaders = [...headers.value].sort((a, b) => {
      const ai = columnOrder.value.indexOf(a.key)
      const bi = columnOrder.value.indexOf(b.key)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    const dataCols = orderedHeaders.map((h) => ({
      key: h.key,
      dataKey: h.key,
      title: h.label,
      width: defaultColWidth,
      align: 'left'
    }))
    return [
      {
        key: '__select__',
        dataKey: '__select__',
        title: '',
        width: SELECT_COL_WIDTH,
        align: 'center'
      },
      ...dataCols,
      {
        key: '__actions__',
        dataKey: '__actions__',
        title: 'Actions',
        width: ACTIONS_COL_WIDTH,
        align: 'center'
      }
    ]
  })

  function handleDragStart(key) {
    dragSourceKey.value = key
  }

  function handleDrop(targetKey) {
    if (!dragSourceKey.value || dragSourceKey.value === targetKey) return
    const order = [...columnOrder.value]
    const fromIdx = order.indexOf(dragSourceKey.value)
    const toIdx = order.indexOf(targetKey)
    if (fromIdx === -1 || toIdx === -1) return
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, dragSourceKey.value)
    columnOrder.value = order
    dragSourceKey.value = null
  }

  const columnSettingsVisible = ref(false)
  const colSettingsDragKey = ref(null)

  function openColumnSettings() {
    columnSettingsVisible.value = true
  }

  function handleColSettingsDrop(targetKey) {
    if (!colSettingsDragKey.value || colSettingsDragKey.value === targetKey)
      return
    const order = [...columnOrder.value]
    const fromIdx = order.indexOf(colSettingsDragKey.value)
    const toIdx = order.indexOf(targetKey)
    if (fromIdx === -1 || toIdx === -1) return
    order.splice(fromIdx, 1)
    order.splice(toIdx, 0, colSettingsDragKey.value)
    columnOrder.value = order
    colSettingsDragKey.value = null
  }

  const tableWidth = computed(() => {
    if (!tableColumns.value.length) return containerWidth.value
    return tableColumns.value.reduce((sum, col) => sum + col.width, 0)
  })

  // --- Row event handlers ---
  const getRowClass = ({ rowData, rowIndex }) => {
    const base = 'et-row'
    let cls = base
    if (rowData.deleteRequest) cls += ' et-row--delete'
    else if (rowData.updateRequest) cls += ' et-row--update'
    else if (rowIndex % 2 !== 0) cls += ' et-row--odd'
    if (selectedKeys.value.includes(rowData._origIndex))
      cls += ' et-row--selected'
    return cls
  }

  // --- Show More dialog ---
  const showMoreDialogVisible = ref(false)
  const showMoreTitle = ref('')
  const showMoreItems = ref([])

  const formatPayer = (p) =>
    `${formatUser(p.mobile)}: ${formatAmount(p.amount)}`

  const formatSplit = (s) =>
    `${formatUser(s.mobile, s.name)}: ${formatAmount(s.amount)}`

  const formatReceipt = (url, i) => ({ label: `Receipt ${i + 1}`, href: url })

  function openShowMore(title, items) {
    showMoreTitle.value = title
    showMoreItems.value = items
    showMoreDialogVisible.value = true
  }

  function doEdit(rowData) {
    deleteMode.value = false
    const { _origIndex, ...cleanRow } = rowData
    handleClick(cleanRow, _origIndex)
  }

  function doDelete(rowData) {
    const { _origIndex, ...cleanRow } = rowData
    openForDelete(cleanRow, _origIndex)
  }

  function doInfo(rowData) {
    handleDoubleClick(rowData)
  }

  function handleTableAction(command, rowData) {
    if (command === 'edit') doEdit(rowData)
    else if (command === 'delete') doDelete(rowData)
    else if (command === 'info') doInfo(rowData)
  }

  return {
    tabStore,
    dialogFormVisible,
    deleteMode,
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
    handleClick,
    handleDoubleClick,
    openForDelete,
    downloadExcelData,
    downloadPdfData,
    // Sizing
    containerRef,
    tableHeight,
    // Filter & Sort
    filterText,
    sortKey,
    sortOrder,
    clearSort,
    toggleSort,
    filteredSortedRows,
    // Columns
    tableColumns,
    tableWidth,
    handleDragStart,
    handleDrop,
    dragSourceKey,
    columnOrder,
    columnSettingsVisible,
    openColumnSettings,
    colSettingsDragKey,
    handleColSettingsDrop,
    // Row handlers
    getRowClass,
    // Selection
    selectedKeys,
    selectedRows,
    isAllSelected,
    isIndeterminate,
    toggleSelectAll,
    toggleSelectRow,
    isRowSelected,
    clearSelection,
    // Bulk actions
    isBulkDeleteDirectly,
    bulkDeleteSelected,
    downloadSelectedExcel,
    downloadSelectedPdf,
    // Show More dialog
    showMoreDialogVisible,
    showMoreTitle,
    showMoreItems,
    // Formatters
    formatUser,
    formatPayer,
    formatSplit,
    formatReceipt,
    openShowMore,
    handleTableAction
  }
}
