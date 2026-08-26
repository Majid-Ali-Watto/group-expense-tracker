import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useUsersOptions,
  useFireBase,
  useReceiptOcr,
  useReceiptUpload,
  useSharedActivityEmail,
  useUnsavedChangesGuard,
  useStoreProxy
} from '@/composables'
import {
  getWhoAddedTransaction,
  showError,
  showSuccess,
  buildRequestMeta,
  dateToMonthNode,
  getCurrentDateInputValue,
  normalizeDateInputValue,
  formatDateForStorage,
  mergeCategoryOptions,
  normalizePhoneNumber,
  phoneNumbersMatch,
  formatPlainNumber
} from '@/utils'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { useCurrency } from '@/composables/useCurrency'
import { DB_NODES, DEFAULT_CURRENCY } from '@/constants'
import { invalidateByPrefix } from '@/utils/queryCache'

export const LoanForm = (props, emit) => {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const storeProxy = useStoreProxy()
  const { currencyOptionsIncluding, getExchangeRate, convertCurrency } =
    useCurrency()

  const activeUserUid = computed(() => authStore.getActiveUserUid)

  // Personal loans convert into the active user's own currency; shared
  // (group) loans convert into the group's shared currency — same
  // "convert into one currency so balances stay consistent" reasoning as
  // shared-expenses.js / personal-expense-form.js.
  const loanCurrency = computed(() =>
    props.isPersonal
      ? userStore.getUserByUid(activeUserUid.value)?.currency ||
        DEFAULT_CURRENCY
      : groupStore.getGroupById(groupStore.getActiveGroup)?.currency ||
        DEFAULT_CURRENCY
  )

  const openForm = () => {
    emit('closeForm')
  }

  const createInitialFormData = () => ({
    amount: null,
    currency: loanCurrency.value,
    loanGiver: '',
    loanReceiver: '',
    loanGiverMobile: '',
    loanReceiverMobile: '',
    description: '',
    category: props.isPersonal ? '' : groupCategory.value || '',
    date: getCurrentDateInputValue()
  })

  const { usersOptions: options } = useUsersOptions()
  const { usersOptions: usersForDropdown } = useUsersOptions({ allUsers: true })
  const groupCategory = computed(
    () => groupStore.getGroupById(groupStore.getActiveGroup)?.category || ''
  )
  const categoryOptions = computed(() =>
    mergeCategoryOptions([
      !props.isPersonal ? groupCategory.value : '',
      formData.value?.category
    ])
  )

  const { deleteData, updateData, saveData, isSubmitting } = useFireBase()
  const { saveData: saveExpenseCopy } = useFireBase()
  const { sendSharedActivityEmail } = useSharedActivityEmail()

  const loanForm = ref(null)
  const isVisible = ref(true)
  const isEditMode = computed(() => !!props.row?.amount)

  const formData = ref(createInitialFormData())
  // Narrowed to codes the current exchange-rate snapshot can actually
  // convert (plus whatever's already on the form, even if editing a past
  // entry whose currency later dropped out of the snapshot) — useCurrency.js.
  const currencyOptions = computed(() =>
    currencyOptionsIncluding(formData.value.currency)
  )
  // Live preview for the "Will be converted to {amount} {currency}..." note
  // — recalculates as the entrant edits the amount or currency. Null hides
  // the note (matching currency, no amount yet, or no rate available).
  const convertedAmountPreview = computed(() => {
    const enteredCurrency = formData.value.currency || loanCurrency.value
    if (enteredCurrency === loanCurrency.value) return null

    const enteredAmount = parseFloat(formData.value.amount)
    if (!enteredAmount || Number.isNaN(enteredAmount)) return null

    const converted = convertCurrency(
      enteredAmount,
      enteredCurrency,
      loanCurrency.value
    )
    return converted === null ? null : formatPlainNumber(converted)
  })
  const initialFormSnapshot = ref(JSON.stringify(createInitialFormData()))
  const existingMonth = ref(dateToMonthNode(formData.value.date))

  const activeUserName = computed(
    () => userStore.getUserByUid(activeUserUid.value)?.name || ''
  )
  const activeUserMobile = computed(
    () => userStore.getUserByUid(activeUserUid.value)?.mobile || ''
  )

  // ========== Select from Users (personal loans) ==========
  const selectedGiverUser = ref('')
  const selectedReceiverUser = ref('')
  // Real (unmasked) mobile when a user was picked from the dropdown
  const giverRealMobile = ref('')
  const receiverRealMobile = ref('')

  const {
    receiptFiles,
    receiptUploading,
    existingReceiptUrls,
    removeReceipt,
    setSelectedFiles,
    uploadSelectedFiles,
    deleteExistingReceipts
  } = useReceiptUpload({
    // Support both old single-value records and new array format
    existingUrls: computed(() => props.row?.receiptUrls ?? null),
    existingMeta: computed(() => props.row?.receiptMeta ?? null)
  })

  const { receiptExtracting, extractAndStructure } = useReceiptOcr({
    receiptFiles,
    existingReceiptUrls,
    type: 'shared-loan'
  })

  const SHARED_LOAN_JSON_SHAPE = JSON.stringify({
    amount: 0,
    description: '',
    category: '',
    date: 'YYYY-MM-DD'
  })

  async function extractTextFromReceipt() {
    const { data } = await extractAndStructure(SHARED_LOAN_JSON_SHAPE)
    if (!data) return

    if (data.amount != null) formData.value.amount = data.amount
    if (data.description) formData.value.description = data.description
    if (data.category) formData.value.category = data.category
    if (data.date) formData.value.date = data.date

    await nextTick()
    showSuccess(t('common.receiptExtracted'))
  }

  // ========== Copy to Personal Expenses ==========
  const copyToExpenses = ref(false)

  const resetForm = async () => {
    formData.value = createInitialFormData()
    initialFormSnapshot.value = JSON.stringify(formData.value)
    isMeGiver.value = false
    isMeReceiver.value = false
    selectedGiverUser.value = ''
    selectedReceiverUser.value = ''
    giverRealMobile.value = ''
    receiverRealMobile.value = ''
    copyToExpenses.value = false
    removeReceipt()
    await nextTick()
    loanForm.value?.clearValidate()
  }

  const getOtherPartyName = () => {
    if (isMeGiver.value) {
      return props.isPersonal
        ? formData.value.loanReceiver
        : userStore.getUserByUid(formData.value.loanReceiver)?.name ||
            formData.value.loanReceiver
    }
    return props.isPersonal
      ? formData.value.loanGiver
      : userStore.getUserByUid(formData.value.loanGiver)?.name ||
          formData.value.loanGiver
  }

  const isCurrentUserIdentity = (value) =>
    value === activeUserUid.value ||
    (activeUserMobile.value && phoneNumbersMatch(value, activeUserMobile.value))

  const getCurrentGiverIdentity = () =>
    giverRealMobile.value ||
    formData.value.loanGiverMobile ||
    formData.value.loanGiver

  const getCurrentReceiverIdentity = () =>
    receiverRealMobile.value ||
    formData.value.loanReceiverMobile ||
    formData.value.loanReceiver

  // ========== ME? Checkboxes ==========
  const isMeGiver = ref(false)
  const isMeReceiver = ref(false)

  watch(isMeGiver, (val) => {
    if (val) {
      isMeReceiver.value = false
      selectedGiverUser.value = ''
      giverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanGiverMobile = activeUserMobile.value
        formData.value.loanGiver = activeUserName.value
      } else {
        formData.value.loanGiver = activeUserUid.value
      }
    } else {
      selectedGiverUser.value = ''
      giverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanGiverMobile = ''
        formData.value.loanGiver = ''
      } else {
        formData.value.loanGiver = ''
      }
    }
  })

  watch(isMeReceiver, (val) => {
    if (val) {
      isMeGiver.value = false
      selectedReceiverUser.value = ''
      receiverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = activeUserMobile.value
        formData.value.loanReceiver = activeUserName.value
      } else {
        formData.value.loanReceiver = activeUserUid.value
      }
    } else {
      selectedReceiverUser.value = ''
      receiverRealMobile.value = ''
      if (props.isPersonal) {
        formData.value.loanReceiverMobile = ''
        formData.value.loanReceiver = ''
      } else {
        formData.value.loanReceiver = ''
      }
    }
  })

  watch(selectedGiverUser, async (uid) => {
    if (!uid) {
      giverRealMobile.value = ''
      return
    }
    if (props.isPersonal && uid === getCurrentReceiverIdentity()) {
      selectedGiverUser.value = ''
      showError(t('sharedLoans.giverReceiverSame'))
      return
    }
    const user = userStore.getUserByUid(uid)
    if (!user) return
    if (isCurrentUserIdentity(uid)) {
      if (props.isPersonal && isMeReceiver.value) {
        selectedGiverUser.value = ''
        showError(t('sharedLoans.ifReceiverCantBeGiver'))
        return
      }
      // Let isMeGiver watcher handle field setting
      isMeGiver.value = true
      return
    }
    // Uncheck ME? first if it was set, wait for its watcher to clear fields
    if (isMeGiver.value) {
      isMeGiver.value = false
      await nextTick()
    }
    // Store real (unmasked) mobile so validation passes
    giverRealMobile.value = user.mobile
      ? normalizePhoneNumber(user.mobile)
      : uid
    formData.value.loanGiverMobile = giverRealMobile.value
    formData.value.loanGiver = user.name || ''
  })

  watch(selectedReceiverUser, async (uid) => {
    if (!uid) {
      receiverRealMobile.value = ''
      return
    }
    if (props.isPersonal && uid === getCurrentGiverIdentity()) {
      selectedReceiverUser.value = ''
      showError(t('sharedLoans.giverReceiverSame'))
      return
    }
    const user = userStore.getUserByUid(uid)
    if (!user) return
    if (isCurrentUserIdentity(uid)) {
      if (props.isPersonal && isMeGiver.value) {
        selectedReceiverUser.value = ''
        showError(t('sharedLoans.ifGiverCantBeReceiver'))
        return
      }
      isMeReceiver.value = true
      return
    }
    if (isMeReceiver.value) {
      isMeReceiver.value = false
      await nextTick()
    }
    // Store real (unmasked) mobile so validation passes
    receiverRealMobile.value = user.mobile
      ? normalizePhoneNumber(user.mobile)
      : uid
    formData.value.loanReceiverMobile = receiverRealMobile.value
    formData.value.loanReceiver = user.name || ''
  })

  // ========== Auto-fill the other party when unambiguous ==========
  // Shared (non-personal) loans only: if excluding the person just picked
  // leaves exactly one selectable group member, auto-fill them into the
  // other field — e.g. a 2-person group, or a larger group where blocked
  // members reduce the effective pool to 2. Never overwrites a value the
  // user (or edit-mode data load) already set.
  function otherSelectableParty(excludeUid) {
    const remaining = options.value.filter(
      (o) => !o.disabled && o.value !== excludeUid
    )
    return remaining.length === 1 ? remaining[0].value : null
  }

  watch(
    () => formData.value.loanGiver,
    (giver) => {
      if (props.isPersonal || !giver || formData.value.loanReceiver) return
      const other = otherSelectableParty(giver)
      if (other) formData.value.loanReceiver = other
    }
  )

  watch(
    () => formData.value.loanReceiver,
    (receiver) => {
      if (props.isPersonal || !receiver || formData.value.loanGiver) return
      const other = otherSelectableParty(receiver)
      if (other) formData.value.loanGiver = other
    }
  )

  watch(
    () => props.row,
    async (newRow) => {
      // Edit mode shows/edits what was actually typed (original
      // amount+currency), not the already-converted base amount.
      formData.value.amount = newRow?.originalAmount ?? newRow?.amount ?? null
      formData.value.currency =
        newRow?.originalCurrency || newRow?.currency || loanCurrency.value
      formData.value.loanGiver = props.isPersonal
        ? (newRow?.loanGiver ?? '')
        : (newRow?.giver ?? '')
      formData.value.loanReceiver = props.isPersonal
        ? (newRow?.loanReceiver ?? '')
        : (newRow?.receiver ?? '')
      formData.value.loanGiverMobile =
        newRow?.giverMobile ?? newRow?.giver ?? newRow?.loanGiverMobile ?? ''
      formData.value.loanReceiverMobile =
        newRow?.receiverMobile ??
        newRow?.receiver ??
        newRow?.loanReceiverMobile ??
        ''
      formData.value.description = newRow?.description ?? ''
      formData.value.category =
        newRow?.category ?? (props.isPersonal ? '' : groupCategory.value || '')
      formData.value.date = normalizeDateInputValue(newRow?.date)
      initialFormSnapshot.value = JSON.stringify(formData.value)
      existingMonth.value =
        props.row?._month ||
        dateToMonthNode(newRow?.date || formData.value.date)
      isVisible.value = !newRow?.amount
      removeReceipt()
      // Auto-tick ME? checkbox in edit mode
      if (newRow?.amount) {
        const giverMobile = props.isPersonal
          ? formData.value.loanGiverMobile || formData.value.loanGiver
          : formData.value.loanGiver
        const receiverMobile = props.isPersonal
          ? formData.value.loanReceiverMobile || formData.value.loanReceiver
          : formData.value.loanReceiver
        isMeGiver.value =
          giverMobile === activeUserUid.value ||
          (activeUserMobile.value &&
            phoneNumbersMatch(giverMobile, activeUserMobile.value))
        isMeReceiver.value =
          receiverMobile === activeUserUid.value ||
          (activeUserMobile.value &&
            phoneNumbersMatch(receiverMobile, activeUserMobile.value))
      } else {
        isMeGiver.value = false
        isMeReceiver.value = false
      }
      // In edit mode for personal loans, pre-populate selectedGiverUser /
      // selectedReceiverUser so the raw-mobile text fields are hidden
      if (props.isPersonal && newRow?.amount) {
        const giverMob = formData.value.loanGiverMobile
        if (giverMob && !isMeGiver.value) {
          const giverUser = userStore.getUserByMobile(giverMob)
          if (giverUser) selectedGiverUser.value = giverUser.uid
        }
        const receiverMob = formData.value.loanReceiverMobile
        if (receiverMob && !isMeReceiver.value) {
          const receiverUser = userStore.getUserByMobile(receiverMob)
          if (receiverUser) selectedReceiverUser.value = receiverUser.uid
        }
        // Wait for the selectedGiverUser / selectedReceiverUser watchers to
        // finish updating formData, then re-snapshot so the form isn't dirty
        await nextTick()
        initialFormSnapshot.value = JSON.stringify(formData.value)
      }
    },
    { immediate: true }
  )

  watch(groupCategory, (category) => {
    if (!props.isPersonal && !isEditMode.value && !formData.value.category) {
      formData.value.category = category || ''
    }
  })

  const onGiverMobileBlur = () => {
    if (
      phoneNumbersMatch(
        formData.value.loanGiverMobile,
        activeUserMobile.value
      ) ||
      formData.value.loanGiverMobile == activeUserUid.value
    ) {
      formData.value.loanGiver =
        activeUserName.value || formData.value.loanGiver
    }
  }

  const onReceiverMobileBlur = () => {
    if (
      phoneNumbersMatch(
        formData.value.loanReceiverMobile,
        activeUserMobile.value
      ) ||
      formData.value.loanReceiverMobile == activeUserUid.value
    ) {
      formData.value.loanReceiver =
        activeUserName.value || formData.value.loanReceiver
    }
  }

  const isFormDirty = computed(
    () =>
      (props.showForm || isEditMode.value) &&
      (JSON.stringify(formData.value) !== initialFormSnapshot.value ||
        receiptFiles.value.length > 0)
  )

  const { confirmDiscardChanges } = useUnsavedChangesGuard(isFormDirty)

  async function requestClose() {
    const canClose = await confirmDiscardChanges()
    if (!canClose) return false

    await resetForm()
    if (isEditMode.value) emit('closeModal')
    else emit('closeForm')
    return true
  }

  const closeForm = async () => {
    await requestClose()
  }

  const validateForm = (whatTask = 'Save') => {
    loanForm.value.validate(async (valid) => {
      if (valid) {
        // Shared loan guard: giver and receiver must not be the same person
        if (!props.isPersonal) {
          if (
            formData.value.loanGiver &&
            formData.value.loanGiver === formData.value.loanReceiver
          ) {
            showError(t('sharedLoans.giverReceiverSame'))
            return
          }
        }

        // Personal loan guard: logged-in user must be either giver or receiver
        if (props.isPersonal) {
          const giverMobile =
            giverRealMobile.value ||
            formData.value.loanGiverMobile ||
            formData.value.loanGiver
          const receiverMobile =
            receiverRealMobile.value ||
            formData.value.loanReceiverMobile ||
            formData.value.loanReceiver
          if (
            giverMobile === receiverMobile ||
            phoneNumbersMatch(giverMobile, receiverMobile)
          ) {
            showError(t('sharedLoans.giverReceiverSame'))
            return
          }
          const isMe = (val) =>
            val === activeUserUid.value ||
            (activeUserMobile.value &&
              phoneNumbersMatch(val, activeUserMobile.value))

          if (!isMe(giverMobile) && !isMe(receiverMobile)) {
            showError(t('sharedLoans.personalMustBeYou'))
            return
          }

          if (isMe(giverMobile) && formData.value.loanGiver) {
            if (formData.value.loanGiver !== activeUserName.value) {
              showError(t('sharedLoans.giverNameMismatch'))
              return
            }
          }
          if (isMe(receiverMobile) && formData.value.loanReceiver) {
            if (formData.value.loanReceiver !== activeUserName.value) {
              showError(t('sharedLoans.receiverNameMismatch'))
              return
            }
          }
        }

        let loanPath
        const monthYear = isEditMode.value
          ? existingMonth.value
          : dateToMonthNode(formData.value.date)
        if (props.isPersonal) {
          loanPath = `${props.dbRef}/${authStore.getActiveUserUid}/months/${monthYear}/loans`
        } else {
          const groupId = groupStore.getActiveGroup || 'global'
          loanPath = `${props.dbRef}/${groupId}/months/${monthYear}/loans`
        }
        const personalLoanDocumentPath =
          props.isPersonal && isEditMode.value && props.row?.id
            ? `${props.dbRef}/${authStore.getActiveUserUid}/months/${props.row._month || monthYear}/loans/${props.row.id}`
            : null

        const uploadedReceipts = await uploadSelectedFiles({
          replaceExisting: whatTask === 'Update' && props.isPersonal,
          deleteContext: personalLoanDocumentPath
            ? { documentPath: personalLoanDocumentPath }
            : null
        })
        if (!uploadedReceipts) return

        const receiptUrls = uploadedReceipts.receiptUrls
        const receiptMeta = uploadedReceipts.receiptMeta
        const loanData =
          whatTask === 'Delete' ? null : getLoanData(receiptUrls, receiptMeta)
        if (whatTask !== 'Delete' && !loanData) return

        if (whatTask === 'Save' || whatTask === 'Duplicate') {
          // Capture expense data before saveData resets the form
          const expenseCopyMonth = dateToMonthNode(formData.value.date)
          const expenseCopy = copyToExpenses.value
            ? {
                amount: formData.value.amount,
                payer: activeUserUid.value,
                category: formData.value.category || 'Finance',
                description: formData.value.description,
                location: 'Loan',
                recipient: getOtherPartyName(),
                month: expenseCopyMonth,
                whoAdded: getWhoAddedTransaction(),
                date: formatDateForStorage(formData.value.date),
                whenAdded: new Date().toLocaleString('en-PK')
              }
            : null

          saveData(
            loanPath,
            () => loanData,
            loanForm,
            whatTask === 'Duplicate'
              ? t('sharedLoans.loanDuplicated')
              : t('sharedLoans.loanAdded'),
            async (createdDoc) => {
              if (!props.isPersonal) {
                sendSharedActivityEmail({
                  type: 'shared-loan',
                  action: whatTask === 'Duplicate' ? 'duplicated' : 'created',
                  entryId: createdDoc?.id || '',
                  month: monthYear,
                  data: loanData
                })
              }
              if (expenseCopy) {
                const mockFormRef = { value: { resetFields: () => {} } }
                saveExpenseCopy(
                  `${DB_NODES.PERSONAL_EXPENSES}/${expenseCopy.payer}/months/${expenseCopyMonth}/expenses`,
                  () => expenseCopy,
                  mockFormRef,
                  t('sharedLoans.expenseCopyAdded'),
                  null
                )
              }
              if (props.isPersonal) {
                invalidateByPrefix(
                  `${DB_NODES.PERSONAL_LOANS}/${activeUserUid.value}/months`
                )
              }
              removeReceipt()
              if (isEditMode.value) {
                emit('closeModal')
              } else {
                // Sync snapshot so isFormDirty is false — prevents the
                // "unsaved changes" dialog from appearing after a successful save
                await resetForm()
                closeForm()
              }
            }
          )
        } else if (whatTask == 'Update') {
          if (!props.isPersonal) {
            const groupId = groupStore.getActiveGroup || 'global'
            createUpdateRequest(
              `${props.dbRef}/${groupId}/months/${monthYear}/loans/${props.row.id}`,
              receiptUrls,
              receiptMeta
            )
          } else {
            const updateMonth = props.row._month || monthYear
            const personalUpdatePath = `${props.dbRef}/${authStore.getActiveUserUid}/months/${updateMonth}/loans`
            updateData(
              `${personalUpdatePath}/${props.row.id}`,
              () => loanData,
              t('sharedLoans.loanUpdated')
            )
            emit('closeModal')
          }
        } else if (whatTask == 'Delete') {
          if (!props.isPersonal) {
            const groupId = groupStore.getActiveGroup || 'global'
            createDeleteRequest(
              `${props.dbRef}/${groupId}/months/${monthYear}/loans/${props.row.id}`
            )
          } else {
            const deleteMonth = props.row._month || monthYear
            const personalDeletePath = `${props.dbRef}/${authStore.getActiveUserUid}/months/${deleteMonth}/loans`
            deleteExistingReceipts({
              documentPath: `${personalDeletePath}/${props.row.id}`
            })
            deleteData(
              `${personalDeletePath}/${props.row.id}`,
              t('sharedLoans.loanDeleted')
            )
            emit('closeModal')
          }
        }
      }
    })
  }

  const createDeleteRequest = (loanPath) => {
    const deleteRequest = buildRequestMeta(storeProxy)

    updateData(
      loanPath,
      () => ({ deleteRequest }),
      t('approval.deleteRequestSent')
    )
    emit('closeModal')
  }

  const createUpdateRequest = (
    loanPath,
    receiptUrls = [],
    receiptMeta = []
  ) => {
    const changes = getLoanData(receiptUrls, receiptMeta)
    if (!changes) {
      showError(t('sharedExpenses.exchangeRateUnavailable'))
      return
    }

    const updateRequest = {
      changes,
      ...buildRequestMeta(storeProxy)
    }

    updateData(
      loanPath,
      () => ({ updateRequest }),
      t('approval.updateRequestSent')
    )
    emit('closeModal')
  }

  // Converts the entered amount into loanCurrency if a different one was
  // picked, freezing the rate used at this moment. Returns null when the
  // rate table doesn't have a needed currency, so the caller can block
  // submission rather than silently store a wrong number.
  function convertToLoanCurrency(enteredAmount) {
    const baseCurrency = loanCurrency.value
    const enteredCurrency = formData.value.currency || baseCurrency

    if (enteredCurrency === baseCurrency) {
      return { amount: enteredAmount, extra: {} }
    }

    const rate = getExchangeRate(enteredCurrency, baseCurrency)
    if (rate === null) return null

    return {
      amount: Math.round(enteredAmount * rate * 100) / 100,
      extra: {
        originalAmount: enteredAmount,
        originalCurrency: enteredCurrency,
        exchangeRate: rate
      }
    }
  }

  function getLoanData(receiptUrls = [], receiptMeta = []) {
    const converted = convertToLoanCurrency(parseFloat(formData.value.amount))
    if (!converted) {
      showError(t('sharedExpenses.exchangeRateUnavailable'))
      return null
    }

    const giverMobile = props.isPersonal
      ? giverRealMobile.value ||
        normalizePhoneNumber(formData.value.loanGiverMobile) ||
        formData.value.loanGiver
      : formData.value.loanGiver

    const receiverMobile = props.isPersonal
      ? receiverRealMobile.value ||
        normalizePhoneNumber(formData.value.loanReceiverMobile) ||
        formData.value.loanReceiver
      : formData.value.loanReceiver

    const loan = {
      amount: converted.amount,
      currency: loanCurrency.value,
      ...converted.extra,
      description: formData.value.description,
      ...(formData.value.category
        ? { category: formData.value.category }
        : isEditMode.value
          ? { category: null }
          : {}),
      [!props.isPersonal ? 'giver' : 'loanGiver']: giverMobile,
      [!props.isPersonal ? 'receiver' : 'loanReceiver']: receiverMobile,
      ...(props.isPersonal
        ? {
            giverName: formData.value.loanGiver,
            receiverName: formData.value.loanReceiver
          }
        : {}),
      ...(!props.isPersonal
        ? { group: groupStore.getActiveGroup || null }
        : {}),
      date: formatDateForStorage(formData.value.date),
      whoAdded: getWhoAddedTransaction(),
      whenAdded: new Date().toLocaleString('en-PK'),
      ...(receiptUrls?.length ? { receiptUrls, receiptMeta } : {})
    }
    return loan
  }

  return {
    options,
    loanForm,
    isVisible,
    isEditMode,
    formData,
    loanCurrency,
    currencyOptions,
    convertedAmountPreview,
    openForm,
    closeForm,
    requestClose,
    resetForm,
    validateForm,
    receiptFiles,
    receiptExtracting,
    receiptUploading,
    categoryOptions,
    existingReceiptUrls,
    setSelectedFiles,
    removeReceipt,
    extractTextFromReceipt,
    onGiverMobileBlur,
    onReceiverMobileBlur,
    isMeGiver,
    isMeReceiver,
    copyToExpenses,
    selectedGiverUser,
    selectedReceiverUser,
    usersForDropdown,
    isSubmitting
  }
}
