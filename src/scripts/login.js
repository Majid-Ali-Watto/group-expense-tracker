import { onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import useFireBase from '../api/firebase-apis'
import { store } from '../stores/store'
import { showError, showSuccess } from '../utils/showAlerts'
import {
  getStoredUser,
  removeUserFromStorage,
  setUserInStorage
} from '../utils/whoAdded'
import { generatePasscodes, printPasscodes } from '../utils/passcodes'
import { encryptForSession, encryptForStore } from '../utils/sessionCrypto'


export const Login = () => {
  const RECOVERY_CODES_COUNT = 1
  const userStore = store()
  const { read, updateData } = useFireBase()

  const form = ref({
    name: '',
    mobile: '',
    loginCode: '',
    rememberMe: false
  })

  const loginForm = ref(null)

  // Recovery codes setup dialog state
  const recoveryCodesDialogVisible = ref(false)
  const pendingLoginData = ref(null)
  // pendingLoginData shape:
  // { mobile, userName, loginCode, codes: string[], existingUser: object|null }

  onMounted(() => {
    const data = getStoredUser()
    if (data) {
      form.value.name = data.name || ''
      form.value.mobile = data.mobile || ''
      form.value.loginCode = data.loginCode || ''
      form.value.rememberMe = true
    }
  })

  // ── helpers ──────────────────────────────────────────────────────────────

  function activateUserGroup(mobileKey) {
    const groups = userStore.getGroups || []
    const myGroup = groups.find((g) =>
      (g.members || []).some((m) => m.mobile === mobileKey)
    )
    if (myGroup) userStore.setActiveGroup(myGroup.id)
  }

  async function completeLogin(payload, message) {
    const token = crypto.randomUUID()
    const [encryptedSession, encryptedStore] = await Promise.all([
      encryptForSession(token), // AES-GCM → sessionStorage
      encryptForStore(token)    // AES-CBC → Pinia store
    ])
    userStore.setActiveUser(payload.mobile)
    userStore.addUser(payload)
    userStore.setActiveLoginCode(payload.loginCode)
    userStore.setSessionToken(encryptedStore)
    sessionStorage.setItem('_session', encryptedSession)
    activateUserGroup(payload.mobile)
    showSuccess(message)
  }

  // Firebase may return arrays as plain objects keyed by index – normalise them
  function toArray(val) {
    if (!val) return []
    return Array.isArray(val) ? val : Object.values(val)
  }

  // ── Recovery codes setup dialog ───────────────────────────────────────────

  /** Called when user clicks "I've saved my codes" in the recovery dialog. */
  async function confirmRecoveryCodes() {
    const { mobile, userName, loginCode, codes, existingUser, isRegenerationFlow } = pendingLoginData.value

    // If this is a regeneration flow, codes were already saved to Firebase
    if (!isRegenerationFlow) {
      // Original flow: save codes for first-time login or registration
      const userPayload = existingUser
        ? { ...existingUser, loginCode, recoveryCodes: codes }
        : { name: userName, mobile, loginCode, recoveryCodes: codes }

      await updateData(
        `users/${mobile}`,
        () => userPayload,
        'Account setup complete! Your login code and recovery codes have been saved.'
      )
    }

    if (form.value.rememberMe) setUserInStorage(form.value)
    else removeUserFromStorage()

    recoveryCodesDialogVisible.value = false
    pendingLoginData.value = null

    const message = isRegenerationFlow
      ? 'Login code reset successfully. New recovery codes saved. You are now logged in!'
      : 'Welcome! Your account is ready.'

    await completeLogin(
      { name: userName, mobile, loginCode },
      message
    )
  }

  /** Print / Save as PDF button inside the recovery dialog. */
  function handlePrintCodes() {
    if (!pendingLoginData.value) return
    const { userName, mobile, codes } = pendingLoginData.value
    printPasscodes(userName, mobile, codes)
  }

  // ── Main login / register handler ─────────────────────────────────────────

  function handleSubmit() {
    loginForm.value.validate(async (valid) => {
      if (!valid) return

      const mobileKey = form.value.mobile.trim()
      const rawName = form.value.name.trim()
      const loginCodeValue = form.value.loginCode.trim()

      if (!/^03\d{9}$/.test(mobileKey)) {
        return showError('Mobile number must be 11 digits starting with 03 (e.g., 03009090909)')
      }

      const normalizedName = rawName.replace(/\s+/g, ' ').trim()
      if (!/^[a-zA-Z]+(\s[a-zA-Z]+)*$/.test(normalizedName)) {
        return showError('Name can only contain alphabets and single spaces (no special characters)')
      }

      if (loginCodeValue.length < 4 || loginCodeValue.length > 15) {
        return showError('Login code must be between 4 and 15 characters')
      }

      try {
        const user = await read(`users/${mobileKey}`)

        if (user) {
          // ── Existing user ──────────────────────────────────────────────
          const dbName = user.name.trim().replace(/\s+/g, ' ').toLowerCase()
          if (dbName !== normalizedName.toLowerCase()) {
            return showError('Name does not match the registered user for this mobile number')
          }

          if (user.loginCode === null || user.loginCode === undefined) {
            // First-time login: set login code + generate recovery codes
            try {
              await ElMessageBox.confirm(
                `This is your first login. After setting your login code you will be shown <strong>${RECOVERY_CODES_COUNT} recovery passcodes</strong> — save them safely before continuing!`,
                'Set Login Code',
                {
                  confirmButtonText: 'OK, Continue',
                  cancelButtonText: 'Cancel',
                  type: 'info',
                  dangerouslyUseHTMLString: true
                }
              )
            } catch {
              return
            }

            const codes = generatePasscodes(RECOVERY_CODES_COUNT)
            pendingLoginData.value = {
              mobile: mobileKey,
              userName: user.name,
              loginCode: loginCodeValue,
              codes,
              existingUser: user
            }
            recoveryCodesDialogVisible.value = true
          } else {
            // Normal login
            if (user.loginCode !== loginCodeValue) {
              return showError('Incorrect login code')
            }

            if (form.value.rememberMe) setUserInStorage(form.value)
            else removeUserFromStorage()

            await completeLogin(
              { name: user.name, mobile: mobileKey, loginCode: user.loginCode },
              'Login successful!'
            )
          }
        } else {
          // ── New user registration ──────────────────────────────────────
          try {
            await ElMessageBox.confirm(
              `No account found for <strong>${mobileKey}</strong>. Register as a new user named <strong>${normalizedName}</strong>?<br><br>After registration you will be shown <strong>${RECOVERY_CODES_COUNT} recovery passcodes</strong> — save them safely!`,
              'Register New User',
              {
                confirmButtonText: 'Register',
                cancelButtonText: 'Cancel',
                type: 'warning',
                dangerouslyUseHTMLString: true
              }
            )
          } catch {
            return
          }

          const codes = generatePasscodes(RECOVERY_CODES_COUNT)
          pendingLoginData.value = {
            mobile: mobileKey,
            userName: normalizedName,
            loginCode: loginCodeValue,
            codes,
            existingUser: null
          }
          recoveryCodesDialogVisible.value = true
        }
      } catch (error) {
        showError(error?.message || error || 'An error occurred while logging you in')
      }
    })
  }

  // ── Forgot login code (recovery flow) ────────────────────────────────────

  async function handleForgotCode() {
    const mobileKey = form.value.mobile.trim()

    if (!mobileKey) {
      return showError('Please enter your mobile number first')
    }
    if (!/^03\d{9}$/.test(mobileKey)) {
      return showError('Please enter a valid mobile number (11 digits starting with 03)')
    }

    try {
      const user = await read(`users/${mobileKey}`)

      if (!user) {
        return ElMessageBox.alert(
          'No account found with this mobile number. Please register first.',
          'Account Not Found',
          { confirmButtonText: 'OK', type: 'warning' }
        )
      }

      // Pre-fill the name field
      form.value.name = user.name

      const storedCodes = toArray(user.recoveryCodes)

      if (storedCodes.length === 0) {
        return ElMessageBox.alert(
          `No recovery codes are set for <strong>${user.name}</strong>.<br><br>Please contact an admin to reset your login code via the Users panel.`,
          'Recovery Not Available',
          { confirmButtonText: 'OK', type: 'warning', dangerouslyUseHTMLString: true }
        )
      }

      // ── Step 1: ask for recovery passcode ──────────────────────────────
      let enteredCode
      try {
        const result = await ElMessageBox.prompt(
          `Enter one of your saved recovery passcodes for <strong>${user.name}</strong>.<br>
          <span style="color:#888;font-size:12px;">You have <strong>${storedCodes.length}</strong> recovery code(s) remaining.</span>`,
          'Enter Recovery Passcode',
          {
            confirmButtonText: 'Verify',
            cancelButtonText: 'Cancel',
            dangerouslyUseHTMLString: true,
            inputPlaceholder: 'e.g. ABCD-EFGH-JKLM'
          }
        )
        enteredCode = result.value?.trim().toUpperCase()
      } catch {
        return
      }

      const normalizedStored = storedCodes.map((c) => c.trim().toUpperCase())
      const matchIndex = normalizedStored.indexOf(enteredCode)

      if (matchIndex === -1) {
        return showError('Invalid recovery passcode. Please check and try again.')
      }

      // ── Step 2: enter new login code ────────────────────────────────────
      let newLoginCode
      try {
        const result = await ElMessageBox.prompt(
          'Recovery code verified! Enter your new login code.',
          'Set New Login Code',
          {
            confirmButtonText: 'Save & Login',
            cancelButtonText: 'Cancel',
            inputType: 'password',
            inputPlaceholder: '4–15 characters',
            inputValidator: (val) => {
              if (!val || val.trim().length < 4) return 'Minimum 4 characters required'
              if (val.trim().length > 15) return 'Maximum 15 characters allowed'
              return true
            }
          }
        )
        newLoginCode = result.value?.trim()
      } catch {
        return
      }

      // Remove the used code; check if it's the last one
      const updatedCodes = storedCodes.filter((_, i) => i !== matchIndex)
      const isLastCode = storedCodes.length === 1

      if (isLastCode) {
        // Generate new recovery codes and show dialog for user to save them
        const newCodes = generatePasscodes(RECOVERY_CODES_COUNT)

        pendingLoginData.value = {
          mobile: mobileKey,
          userName: user.name,
          loginCode: newLoginCode,
          codes: newCodes,
          existingUser: user,
          isRegenerationFlow: true
        }

        // Save new codes to Firebase immediately
        const updated = {
          ...user,
          loginCode: newLoginCode,
          recoveryCodes: newCodes
        }

        await updateData(
          `users/${mobileKey}`,
          () => updated,
          `Login code reset! All recovery codes have been regenerated.`
        )

        // Show dialog for user to save new codes
        recoveryCodesDialogVisible.value = true
      } else {
        // Normal flow: just update codes and login
        const updated = {
          ...user,
          loginCode: newLoginCode,
          recoveryCodes: updatedCodes.length > 0 ? updatedCodes : null
        }

        await updateData(
          `users/${mobileKey}`,
          () => updated,
          `Login code reset! ${updatedCodes.length} recovery code(s) remaining.`
        )

        // Auto-login with the new code
        form.value.loginCode = newLoginCode
        if (form.value.rememberMe) setUserInStorage({ ...form.value, loginCode: newLoginCode })
        else removeUserFromStorage()

        await completeLogin(
          { name: user.name, mobile: mobileKey, loginCode: newLoginCode },
          'Login code reset successfully. You are now logged in!'
        )
      }
    } catch (error) {
      showError(error?.message || 'Failed to process recovery')
    }
  }

  return {
    form,
    loginForm,
    recoveryCodesDialogVisible,
    pendingLoginData,
    handleSubmit,
    handleForgotCode,
    confirmRecoveryCodes,
    handlePrintCodes,
    RECOVERY_CODES_COUNT
  }
}
