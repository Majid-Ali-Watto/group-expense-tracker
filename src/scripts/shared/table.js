import { ElMessage, ElMessageBox } from 'element-plus'
import {
  computed,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch
} from 'vue'
import {
  useTabStore,
  useGroupStore,
  useDataStore,
  useUserStore,
  useAuthStore
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
import {
  useDebouncedRef,
  getDownloadConfig,
  useStoreProxy
} from '@/composables'
import { useRoute, useRouter } from 'vue-router'

const TABLE_HEADER_CONFIG = {
  [Tabs.SHARED_EXPENSES]: {
    columns: ['amount', 'category', 'description', 'payer', 'date', 'split'],
    optionalColumns: ['splitItems', 'location', 'receiptUrls']
  },
  [Tabs.SHARED_LOANS]: {
    columns: ['amount', 'category', 'description', 'giver', 'receiver', 'date'],
    optionalColumns: ['receiptUrls']
  },
  [Tabs.PERSONAL_EXPENSES]: {
    columns: [
      'amount',
      'category',
      'description',
      'location',
      'recipient',
      'date'
    ],
    optionalColumns: ['receiptUrls']
  },
  [Tabs.PERSONAL_LOANS]: {
    columns: [
      'amount',
      'category',
      'description',
      'loanGiver',
      'loanReceiver',
      'date'
    ],
    optionalColumns: ['receiptUrls']
  }
}

export const Table = (props) => {
  const dialogFormVisible = ref(false)
  const deleteMode = ref(false)
  const state = reactive({ row: null })
  const screenWidth = ref(window.innerWidth)
  const tabStore = useTabStore()
  const groupStore = useGroupStore()
  const dataStore = useDataStore()
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const childRef = ref(null)
  const tableRef = ref(null)
  const highlightRowId = ref(null)

  const activeTab = computed(() => tabStore.activeTab)
  const activeGroupObj = computed(() =>
    groupStore.getActiveGroup
      ? groupStore.getGroupById(groupStore.getActiveGroup)
      : null
  )
  const activeTabComponent = () => getEditComponent(activeTab.value)

  const storeProxy = useStoreProxy()
  const formatUser = (mobile, name = null) =>
    formatUserDisplay(storeProxy, mobile, {
      name,
      group: activeGroupObj.value,
      preferMasked: true
    })
  const formatRecipient = (recipient) =>
    userStore.getUserByUid(recipient)?.name || recipient || '—'

  function isEmptyCellValue(value) {
    if (Array.isArray(value)) return value.length === 0
    if (value && typeof value === 'object')
      return Object.keys(value).length === 0
    return value === undefined || value === null || value === ''
  }

  function displayCellValue(value) {
    if (isEmptyCellValue(value)) return '-'
    return typeof value === 'object' ? JSON.stringify(value) : value
  }

  function displayFormattedValue(value, formatter) {
    if (isEmptyCellValue(value)) return '-'
    const formatted = formatter(value)
    return formatted === undefined || formatted === null || formatted === ''
      ? '-'
      : formatted
  }

  function getSearchableValue(key, value) {
    if (key === 'recipient') return formatRecipient(value)
    if (key === 'giver' || key === 'receiver') return formatUser(value)
    if (key === 'loanGiver' || key === 'loanReceiver') return formatUser(value)
    if (key === 'payer') {
      return value ? formatUser(value) : ''
    }
    return value
  }

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

  const hasDownloadRows = ref(props.rows.length > 0)
  const canDownloadExcel = computed(() => {
    const config = getDownloadConfig()
    return hasDownloadRows.value && config.excel
  })
  const canDownloadPdf = computed(() => {
    const config = getDownloadConfig()
    return hasDownloadRows.value && config.pdf
  })
  const isDownloadAvailable = computed(
    () => canDownloadExcel.value || canDownloadPdf.value
  )

  watch(
    () => props.rows,
    (newRows) => {
      hasDownloadRows.value = newRows.length > 0
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
      ref.validateForm('Duplicate')
    } catch (e) {
      ElMessage.error(e.message)
    }
  }

  async function requestChildClose() {
    try {
      const ref = await waitForComponentRef()
      if (typeof ref.requestClose === 'function') {
        return await ref.requestClose()
      }
    } catch {
      return true
    }
    return true
  }

  async function closeDialog() {
    const canClose = await requestChildClose()
    if (!canClose) return
    dialogFormVisible.value = false
  }

  async function handleDialogBeforeClose(done) {
    const canClose = await requestChildClose()
    if (canClose) done()
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

  function hasAnyRowValue(key) {
    return props.rows.some((row) => {
      const value = row?.[key]
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ''
    })
  }

  const headers = computed(() => {
    if (props.rows.length > 0) {
      const config = TABLE_HEADER_CONFIG[activeTab.value]
      const isSharedLoans = activeTab.value === Tabs.SHARED_LOANS
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
        // 'splitItems',
        'receiptMeta',
        'receiptUrls',
        'id',
        '_month',
        'month'
      ]
      if (isSharedLoans) excludedCols.push('giverName', 'receiverName')
      if (isPersonalLoans) excludedCols.push('giverName', 'receiverName')

      let cols = []

      if (config) {
        cols = [
          ...config.columns,
          ...config.optionalColumns.filter((key) => hasAnyRowValue(key))
        ]
      } else {
        cols = Object.keys(props.rows[0] || {}).filter(
          (col) => !excludedCols.includes(col)
        )
      }
      const receiptIndex = cols.indexOf('receiptUrls')
      if (receiptIndex !== -1) cols.splice(receiptIndex, 1)
      cols = cols
        .map((key) => ({
          label: key,
          key
        }))
        .sort((a, b) => {
          if (a.label < b.label) return -1
          if (a.label > b.label) return 1
          return 0
        })

      return receiptIndex !== -1
        ? cols.concat({ key: 'receiptUrls', label: 'Receipts' })
        : cols
    }

    return []
  })

  const openForEdit = (rowS, rowIndex) => {
    if (rowS.deleteRequest || rowS.updateRequest) {
      const requestType = rowS.deleteRequest ? 'delete' : 'update'
      const requester =
        rowS.deleteRequest?.requestedBy || rowS.updateRequest?.requestedBy
      const currentUser = authStore.getActiveUserUid

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

  const showRowInfo = (row) => {
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

  const openForDelete = (rowS, rowIndex) => {
    if (rowS.deleteRequest || rowS.updateRequest) {
      const requestType = rowS.deleteRequest ? 'delete' : 'update'
      const requester =
        rowS.deleteRequest?.requestedBy || rowS.updateRequest?.requestedBy
      const currentUser = authStore.getActiveUserUid
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
  // ── Helpers shared by both PDF summary/settlement builders ──────────────
  const TH_STYLE =
    'padding:8px 12px;border:1px solid #d1d5db;background:#f5f7fa;color:#111827;font-weight:600;font-size:12px;text-align:left;width:40%;'
  const TD_STYLE =
    'padding:8px 12px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-size:13px;'
  const SECTION_HEADER_STYLE =
    'text-align:left;padding:8px 12px;background:#22c55e;color:#fff;font-size:13px;font-weight:700;border:1px solid #16a34a;letter-spacing:.04em;'
  const TABLE_STYLE =
    'width:100%;border-collapse:collapse;font-family:Poppins,sans-serif;font-size:13px;margin-bottom:12px;'

  function makeRow(label, value) {
    const tr = document.createElement('tr')
    const th = document.createElement('th')
    th.style.cssText = TH_STYLE
    th.textContent = label
    const td = document.createElement('td')
    td.style.cssText = TD_STYLE
    td.textContent = value
    tr.appendChild(th)
    tr.appendChild(td)
    return tr
  }

  function buildSelectedSummaryEl(rows) {
    const groupId = groupStore.getActiveGroup
    const groupObj = groupId ? groupStore.getGroupById(groupId) : null
    const usersList = groupObj?.members?.length
      ? groupObj.members
      : userStore.getUsers || []

    const totalSpent = rows.reduce((sum, p) => sum + (p.amount || 0), 0)
    const hasCustomSplits = rows.some(
      (p) => (p.splitMode || 'equal') === 'custom'
    )

    // perPersonOwed (custom splits)
    const perPersonMap = {}
    rows.forEach((payment) => {
      if (!payment.split?.length) return
      payment.split.forEach((s) => {
        if (!s.uid || !(s.amount > 0)) return
        if (!perPersonMap[s.uid])
          perPersonMap[s.uid] = {
            name: formatUser(s.uid, s.name),
            amount: 0
          }
        perPersonMap[s.uid].amount += s.amount
      })
    })
    const perPersonOwed = Object.values(perPersonMap)

    // averageSpent
    const participants = new Set()
    rows.forEach((payment) => {
      if (payment.split?.length) {
        payment.split.forEach((s) => {
          if (s.uid && (s.amount || 0) > 0) participants.add(s.uid)
        })
      } else if (payment.participants?.length) {
        payment.participants.forEach((m) => participants.add(m))
      }
    })
    const averageSpent = participants.size ? totalSpent / participants.size : 0

    // friendTotals
    const friendTotals = usersList
      .map((user) => {
        const mobile = user.uid
        return {
          name: formatUser(mobile, user.name),
          total: rows.reduce((sum, payment) => {
            if (payment.payerMode === 'multiple' && payment.payers?.length) {
              const entry = payment.payers.find((p) => p.uid === mobile)
              return sum + (entry?.amount || 0)
            }
            if (payment.payer === mobile) return sum + (payment.amount || 0)
            return sum
          }, 0)
        }
      })
      .filter((f) => f.total > 0)

    const table = document.createElement('table')
    table.style.cssText = TABLE_STYLE
    const thead = document.createElement('thead')
    const headerTr = document.createElement('tr')
    const th = document.createElement('th')
    th.colSpan = 2
    th.style.cssText = SECTION_HEADER_STYLE
    th.textContent = 'Expense Summary'
    headerTr.appendChild(th)
    thead.appendChild(headerTr)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    tbody.appendChild(makeRow('Total Spent', formatAmount(totalSpent)))
    if (!hasCustomSplits) {
      tbody.appendChild(
        makeRow('Average Per Person', formatAmount(averageSpent))
      )
    } else {
      perPersonOwed.forEach((p) =>
        tbody.appendChild(
          makeRow(`${p.name}'s Expense`, formatAmount(p.amount))
        )
      )
    }
    friendTotals.forEach((f) =>
      tbody.appendChild(makeRow(`${f.name} Paid`, formatAmount(f.total)))
    )
    table.appendChild(tbody)
    return table
  }

  function computeSettlements(rows) {
    const users = userStore.getUsers?.length ? userStore.getUsers : []
    const map = {}
    users.forEach((u) => (map[u.uid] = 0))

    rows.forEach((payment) => {
      const amount = payment.amount || 0
      const participants = payment.participants?.length
        ? payment.participants
        : users.map((u) => u.uid)

      let shares = []
      if (payment.split?.length) {
        shares = payment.split.map((s) => ({ id: s.uid, share: s.amount }))
      } else if (
        participants.length &&
        typeof participants[0] === 'object' &&
        participants[0].share != null
      ) {
        shares = participants.map((p) => ({
          id: p.userId || p.name,
          share: p.share
        }))
      } else {
        const equalShare = participants.length
          ? amount / participants.length
          : 0
        shares = participants.map((p) => ({
          id: typeof p === 'string' ? p : p.userId || p.name,
          share: equalShare
        }))
      }
      shares.forEach((s) => {
        map[s.id] = (map[s.id] || 0) - s.share
      })

      if (payment.payerMode === 'multiple' && payment.payers?.length) {
        payment.payers.forEach((p) => {
          if (p.uid)
            map[p.uid] = (map[p.uid] || 0) + (parseFloat(p.amount) || 0)
        })
      } else if (payment.payer) {
        map[payment.payer] = (map[payment.payer] || 0) + amount
      }
    })

    const list = Object.keys(map).map((m) => ({
      uid: m,
      balance: Number(map[m] || 0)
    }))
    const creditors = list.filter((l) => l.balance > 0).map((c) => ({ ...c }))
    const debtors = list
      .filter((l) => l.balance < 0)
      .map((d) => ({ ...d, balance: -d.balance }))

    const result = []
    let i = 0,
      j = 0
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i],
        creditor = creditors[j]
      const amt = Math.min(debtor.balance, creditor.balance)
      if (amt > 0) {
        result.push({
          from: debtor.uid,
          to: creditor.uid,
          amount: parseFloat(amt.toFixed(2))
        })
        debtor.balance = parseFloat((debtor.balance - amt).toFixed(2))
        creditor.balance = parseFloat((creditor.balance - amt).toFixed(2))
      }
      if (debtor.balance <= 0.001) i++
      if (creditor.balance <= 0.001) j++
    }
    return result
  }

  function buildSettlementTable(settlements) {
    const CELL = 'padding:8px 12px;border:1px solid #d1d5db;font-size:12px;'
    const table = document.createElement('table')
    table.style.cssText = TABLE_STYLE

    // section heading
    const thead = document.createElement('thead')
    const titleTr = document.createElement('tr')
    const titleTh = document.createElement('th')
    titleTh.colSpan = 3
    titleTh.style.cssText = SECTION_HEADER_STYLE
    titleTh.textContent = 'Pairwise Settlements (Who pays whom)'
    titleTr.appendChild(titleTh)
    thead.appendChild(titleTr)

    // column headers — matches BalanceSummaryCard columns
    const colTr = document.createElement('tr')
    ;['Pays', 'Receives', 'Amount'].forEach((label) => {
      const th = document.createElement('th')
      th.style.cssText =
        CELL +
        'background:#f5f7fa;color:#6b7280;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:left;'
      th.textContent = label
      colTr.appendChild(th)
    })
    thead.appendChild(colTr)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    if (!settlements.length) {
      const tr = document.createElement('tr')
      const td = document.createElement('td')
      td.colSpan = 3
      td.style.cssText =
        CELL +
        'background:#ffffff;color:#6b7280;font-style:italic;text-align:center;'
      td.textContent = "No pending settlements. Everyone's balance is zero."
      tr.appendChild(td)
      tbody.appendChild(tr)
    } else {
      settlements.forEach((s, idx) => {
        const tr = document.createElement('tr')
        tr.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f9fafb'
        const cellDefs = [
          { text: formatUser(s.from), color: '#ef4444' },
          { text: formatUser(s.to), color: '#16a34a' },
          { text: formatAmount(s.amount), color: '#111827', bold: true }
        ]
        cellDefs.forEach(({ text, color, bold }) => {
          const td = document.createElement('td')
          td.style.cssText =
            CELL +
            `background:inherit;color:${color};${bold ? 'font-weight:700;' : ''}`
          td.textContent = text
          tr.appendChild(td)
        })
        tbody.appendChild(tr)
      })
    }
    table.appendChild(tbody)
    return table
  }

  function buildSelectedSettlementEl(rows) {
    return buildSettlementTable(computeSettlements(rows))
  }

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
                return `${formatUser(p.uid)}: ${formatAmount(p.amount)}`
              })
              .join('\n')
          } else {
            td.textContent = row.payer ? formatUser(row.payer) : '—'
          }
        } else if (key === 'split') {
          if (Array.isArray(row.split)) {
            td.textContent = row.split
              .map((s) => {
                return `${formatUser(s.uid, s.name)}: ${formatAmount(s.amount)}`
              })
              .join('\n')
          } else {
            td.textContent = displayCellValue(row.split)
          }
        } else if (key === 'splitItems') {
          if (Array.isArray(row.splitItems) && row.splitItems.length) {
            td.textContent = row.splitItems.map(formatSplitItem).join('\n')
          } else {
            td.textContent = displayCellValue(row.splitItems)
          }
        } else if (key === 'giver' || key === 'receiver') {
          td.textContent = row[key] ? formatUser(row[key]) : '-'
        } else if (key === 'loanGiver' || key === 'loanReceiver') {
          const name = key === 'loanGiver' ? row.giverName : row.receiverName
          td.textContent = row[key] ? formatUser(row[key], name) : '-'
        } else if (key === 'recipient') {
          td.textContent = row[key] ? formatRecipient(row[key]) : '-'
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
            td.textContent = '-'
          }
        } else {
          td.textContent = displayCellValue(row[key])
        }
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    return table
  }

  function _downloadPdf(
    rows,
    filenamePrefix,
    title,
    subtitle,
    isSelectedOnly = false
  ) {
    const printHeaders = headers.value

    // 1. Hide filter toolbar and no-print elements.
    const noPrint = Array.from(
      props.dataRef.querySelectorAll('.no-print-pdf, .filter-bar')
    )
    noPrint.forEach((el) => (el.style.display = 'none'))

    // For a full PDF: show the pre-built pdf-only-summary (all-rows data).
    // For a selected-rows PDF: compute fresh summary + settlement from the
    // selected rows and inject them, treating selection exactly like a filter.
    const pdfOnlySummaries = Array.from(
      props.dataRef.querySelectorAll('.pdf-only-summary')
    )
    const selectedRestorations = []

    if (isSelectedOnly) {
      const summarySection = props.dataRef.querySelector('.pdf-summary-section')
      if (summarySection) {
        const el = buildSelectedSummaryEl(rows)
        summarySection.appendChild(el)
        selectedRestorations.push(() => el.remove())
      }
      const settlementSection = props.dataRef.querySelector(
        '.pdf-settlement-section'
      )
      if (settlementSection) {
        // Hide the original Settlement component content so it doesn't print twice
        const originalChildren = Array.from(settlementSection.children)
        originalChildren.forEach((child) => (child.style.display = 'none'))
        const el = buildSelectedSettlementEl(rows)
        settlementSection.appendChild(el)
        selectedRestorations.push(() => {
          el.remove()
          originalChildren.forEach((child) => (child.style.display = ''))
        })
      }
    } else {
      pdfOnlySummaries.forEach((el) => (el.style.display = ''))
    }

    // 2. Override app CSS variables to force light mode on the captured section.
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

    // 3. Replace component-based tables with plain <table> elements so
    //    html2canvas captures them correctly regardless of theme.
    const domReplacements = []

    const replaceEl = (origEl, replacement) => {
      if (!replacement) return
      const parent = origEl.parentNode
      const sibling = origEl.nextSibling
      parent.replaceChild(replacement, origEl)
      domReplacements.push(() => {
        replacement.remove()
        if (sibling) parent.insertBefore(origEl, sibling)
        else parent.appendChild(origEl)
      })
    }

    // el-table (clips overflow, relies on El Plus CSS vars)
    props.dataRef
      .querySelectorAll('.el-table')
      .forEach((el) => replaceEl(el, buildRealTableFromElTable(el)))

    // bsc-table (BalanceSummaryCard — Settlement section, relies on CSS vars)
    // Replace only the .pdf-settlement-section's bsc-table for the full PDF.
    if (!isSelectedOnly) {
      props.dataRef
        .querySelectorAll('.pdf-settlement-section .bsc-table')
        .forEach((bscEl) => {
          replaceEl(bscEl, buildSettlementTable(computeSettlements(props.rows)))
        })
    }

    // 5. Temporarily replace the virtualized scroll wrapper with a real <table>
    //    so html2canvas captures every row (not just visible ones in virtual scroll)
    const scrollWrapper = props.dataRef.querySelector(
      '.expense-table-v2-scroll-wrapper'
    )
    const printTable = buildPrintTable(printHeaders, rows)
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

    // 6. Capture the live dataRef DOM, then restore everything
    return downloadPDF(props.dataRef, filenamePrefix, title, subtitle).finally(
      () => {
        // Restore no-print elements
        noPrint.forEach((el) => (el.style.display = ''))
        // Hide pdf-only-summary (full PDF) or remove injected els (selected PDF)
        pdfOnlySummaries.forEach((el) => (el.style.display = 'none'))
        selectedRestorations.forEach((restore) => restore())
        // Restore CSS vars
        Object.keys(lightVarDefs).forEach((k) =>
          props.dataRef.style.removeProperty(k)
        )
        props.dataRef.style.backgroundColor = prevBg
        props.dataRef.style.color = prevColor
        props.dataRef.style.padding = prevPadding
        // Restore replaced DOM elements (el-table, el-descriptions)
        domReplacements.forEach((restore) => restore())
        // Restore virtual table
        if (restoreTable) restoreTable()
      }
    )
  }

  function downloadPdfData() {
    if (!canDownloadPdf.value) return
    if (!props.dataRef) return
    const printRows = props.rows
    if (!headers.value.length || !printRows.length) return

    const title = props.downloadTitle.replace(/_/g, ' ') + ' Report'
    const subtitle = props.reportMonth ? `Report for: ${props.reportMonth}` : ''
    _downloadPdf(
      printRows,
      getCurrentMonth() + `_${props.downloadTitle}_`,
      title,
      subtitle
    )
  }

  function downloadExcelData() {
    if (!canDownloadExcel.value) return
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
      const user = authStore.getActiveUserUid
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
    if (!canDownloadExcel.value) return
    if (!selectedRows.value.length) return
    downloadExcel(
      selectedRows.value,
      getCurrentMonth() + `_${props.downloadTitle}_Selected_`,
      `${props.downloadTitle} (Selected)`
    )
  }

  function downloadSelectedPdf() {
    if (!canDownloadPdf.value) return
    if (!selectedRows.value.length || !props.dataRef) return
    if (!headers.value.length) return

    const rows = selectedRows.value
    const title = `${props.downloadTitle.replace(/_/g, ' ')} — ${rows.length} selected row(s)`
    const subtitle = props.reportMonth ? `Report for: ${props.reportMonth}` : ''
    _downloadPdf(
      rows,
      `${getCurrentMonth()}_${props.downloadTitle}_Selected_`,
      title,
      subtitle,
      true
    )
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
          const searchableValue = getSearchableValue(k, val)
          if (Array.isArray(searchableValue))
            return JSON.stringify(searchableValue).toLowerCase().includes(q)
          if (typeof searchableValue === 'object' && searchableValue !== null)
            return JSON.stringify(searchableValue).toLowerCase().includes(q)
          return String(searchableValue ?? '')
            .toLowerCase()
            .includes(q)
        })
      )
    }
    if (sortKey.value) {
      const key = sortKey.value
      const order = sortOrder.value
      data = [...data].sort((a, b) => {
        const av = getSearchableValue(key, a[key]) ?? ''
        const bv = getSearchableValue(key, b[key]) ?? ''
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
    if (rowData.id === highlightRowId.value) cls += ' et-row--highlight'
    else if (rowData.deleteRequest) cls += ' et-row--delete'
    else if (rowData.updateRequest) cls += ' et-row--update'
    else if (rowIndex % 2 !== 0) cls += ' et-row--odd'
    if (selectedKeys.value.includes(rowData._origIndex))
      cls += ' et-row--selected'
    return cls
  }

  // Watch for pending scroll-to-row requests from bell notifications.
  // We watch both the store value and filteredSortedRows so that if the
  // data hasn't loaded yet when the store is first set (timing issue on
  // tab navigation), we retry automatically once rows populate.
  watch(
    [() => dataStore.pendingScrollRowId, filteredSortedRows],
    async ([rowId]) => {
      if (!rowId) return
      const rowIndex = filteredSortedRows.value.findIndex((r) => r.id === rowId)
      if (rowIndex === -1) return // data not loaded yet — wait for next tick
      await nextTick()
      // First scroll the page so the table is visible, then scroll within the table
      containerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      tableRef.value?.scrollToRow(rowIndex, 'smart')
      highlightRowId.value = rowId
      dataStore.setPendingScrollRowId(null)
      setTimeout(() => {
        highlightRowId.value = null
      }, 5000)
    },
    { immediate: true }
  )

  // --- Show More dialog ---
  const showMoreDialogVisible = ref(false)
  const showMoreTitle = ref('')
  const showMoreItems = ref([])

  const formatPayer = (p) => `${formatUser(p.uid)}: ${formatAmount(p.amount)}`

  const formatSplit = (s) =>
    `${formatUser(s.uid, s.name)}: ${formatAmount(s.amount)}`

  const formatSplitItem = (item) => {
    const description = item?.description?.trim() || 'Item'
    const amount =
      item?.amount === undefined || item?.amount === null || item?.amount === ''
        ? '-'
        : formatAmount(item.amount)
    const participants =
      Array.isArray(item?.participants) && item.participants.length
        ? item.participants.map((mobile) => formatUser(mobile)).join(', ')
        : '-'

    return `${description}: ${amount} [${participants}]`
  }

  const formatReceipt = (url, i) => ({ label: `Receipt ${i + 1}`, href: url })

  function openShowMore(title, items) {
    showMoreTitle.value = title
    showMoreItems.value = items
    showMoreDialogVisible.value = true
  }

  function doEdit(rowData) {
    deleteMode.value = false
    const { _origIndex, ...cleanRow } = rowData
    openForEdit(cleanRow, _origIndex)
  }

  function doDelete(rowData) {
    const { _origIndex, ...cleanRow } = rowData
    openForDelete(cleanRow, _origIndex)
  }

  function doInfo(rowData) {
    showRowInfo(rowData)
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
    canDownloadExcel,
    canDownloadPdf,
    isDownloadAvailable,
    formatAmount,
    dialogWidth,
    closeDialog,
    handleDialogBeforeClose,
    headers,
    update,
    remove,
    duplicate,
    openForEdit,
    showRowInfo,
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
    tableRef,
    highlightRowId,
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
    formatRecipient,
    displayCellValue,
    displayFormattedValue,
    formatPayer,
    formatSplit,
    formatSplitItem,
    formatReceipt,
    openShowMore,
    handleTableAction
  }
}
