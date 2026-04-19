import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  useFireBase,
  checkForAppUpdate,
  loadAppConfig,
  useRateLimit
} from '@/composables'
import {
  validateEmail,
  findUserByEmail,
  findUserByMobile,
  resolveUserFromAuth,
  USER_TAB_KEYS,
  createUserTabSelection,
  buildUserTabConfig,
  hasSavedUserTabConfig,
  hasEnabledUserTabs,
  findUserTabConfigByUid,
  buildUserTabConfigDocument,
  canAccessManageTabs,
  hasSharedFeatures
} from '@/helpers'
import { useAuthStore, useGroupStore, useUserStore } from '@/stores'
import { DB_NODES } from '@/constants'
import {
  showError,
  showSuccess,
  encryptForSession,
  encryptForStore,
  generateUUID,
  trackAnalyticsEvent
} from '@/utils'
import { withTrace } from '@/utils/performance'
import {
  auth,
  database,
  doc,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setDoc,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from '@/firebase'

export const Login = () => {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { setData } = useFireBase()
  const {
    clearLoginAttempts,
    isLoginLocked,
    recordFailedAttempt,
    getRateLimitData,
    MAX_ATTEMPTS
  } = useRateLimit()
  const isSubmitting = ref(false)

  const createInitialForm = () => ({
    name: '',
    mobile: '',
    email: '',
    password: '',
    rememberMe: false
  })

  const form = ref(createInitialForm())

  const loginForm = ref(null)
  // Initialize mode from the current URL path
  const mode = ref(route.path === '/register' ? 'register' : 'login')

  // When the URL changes (e.g. browser back/forward), sync the mode
  watch(
    () => route.path,
    (path) => {
      const next = path === '/register' ? 'register' : 'login'
      if (mode.value !== next) mode.value = next
    }
  )

  // When user clicks the Login/Register toggle, update the URL to match
  watch(mode, (val) => {
    const target = val === 'register' ? '/register' : '/login'
    if (route.path !== target) router.push(target)
  })

  // Email reset dialog state
  const emailResetDialogVisible = ref(false)
  const resetEmail = ref('')
  const isEmailResetLoading = ref(false)

  // Email verification state
  const lastRegisteredEmail = ref('')
  const showResendVerification = ref(false)
  const featureSelectionDialogVisible = ref(false)
  const isSavingFeatureSelection = ref(false)
  const featureSelection = ref(createUserTabSelection())
  const pendingLoginContext = ref(null)

  // Google sign-in — mobile collection for new Google users
  const googleMobileDialogVisible = ref(false)
  const googleMobileInput = ref('')
  const isGoogleMobileSubmitting = ref(false)
  const googlePendingFirebaseUser = ref(null)

  async function getSignInMethods(email) {
    try {
      return await fetchSignInMethodsForEmail(auth, email)
    } catch {
      return []
    }
  }

  function isGoogleOnlyAccount(signInMethods = []) {
    return (
      signInMethods.includes('google.com') &&
      !signInMethods.includes('password')
    )
  }

  onMounted(async () => {
    // Check for a new app version and notify the user if one is being applied
    checkForAppUpdate()

    const storedEmail = localStorage.getItem('rememberedEmail')
    if (storedEmail) {
      form.value.email = storedEmail
      form.value.rememberMe = true
    }

    // Check if redirected from password reset completion
    const urlParams = new URLSearchParams(window.location.search)
    const resetMode = urlParams.get('mode')
    const emailParam = urlParams.get('email')

    if (resetMode === 'resetPassword' && emailParam) {
      // Firebase has already handled the password reset
      // User is being redirected back after completing reset on Firebase domain
      const email = decodeURIComponent(emailParam)

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname)

      // Pre-fill email and show success message
      form.value.email = email
      mode.value = 'login'

      await ElMessageBox.alert(
        'Your password has been reset successfully! You can now login with your new code.',
        'Password Reset Complete',
        {
          confirmButtonText: 'OK',
          type: 'success'
        }
      )
    }
  })

  // ── helpers ──────────────────────────────────────────────────────────────

  function activateUserGroup(userId) {
    if (!hasSharedFeatures(userStore.getActiveUserTabConfig)) return
    const groups = groupStore.getGroups || []
    const myGroup = groups.find((g) =>
      (g.members || []).some((m) => m.uid === userId)
    )
    if (myGroup) groupStore.setActiveGroup(myGroup.id)
  }

  async function completeLogin(payload, message) {
    clearLoginAttempts()
    userStore.addUser({
      uid: payload.uid,
      name: payload.name || '',
      mobile: payload.mobile || '',
      email: payload.email || '',
      photoUrl: payload.photoUrl || '',
      photoMeta: payload.photoMeta || null,
      emailVerified: payload.emailVerified !== false,
      blocked: payload.blocked === true,
      billedUser: payload.billedUser === true,
      bugResolver: payload.bugResolver === true,
      isAdmin: payload.isAdmin === true
    })
    userStore.setActiveUserTabAccess({
      config: payload.userTabConfig || null,
      accessManageTabs: canAccessManageTabs(payload.userTabConfig)
    })
    const token = generateUUID()
    const [encryptedSession, encryptedStore] = await Promise.all([
      encryptForSession({ ...payload, token }),
      encryptForStore({ ...payload, token })
    ])

    sessionStorage.setItem('_session', encryptedSession)
    authStore.setActiveUserUid(payload.uid)
    authStore.setSessionToken(encryptedStore)
    authStore.setActivePassword(payload.password)
    activateUserGroup(payload.uid)
    loadAppConfig() // fire-and-forget: load remote config flags after login
    trackAnalyticsEvent('login', { method: 'password' })
    showSuccess(message || 'Login successful!')
  }

  function resetFeatureSelectionDialog() {
    featureSelection.value = createUserTabSelection()
    pendingLoginContext.value = null
    featureSelectionDialogVisible.value = false
  }

  function openFeatureSelectionDialog(
    user,
    password,
    existingTabConfig = null
  ) {
    featureSelection.value = createUserTabSelection()
    pendingLoginContext.value = {
      uid: user.uid,
      name: user.name || '',
      mobile: user.mobile || '',
      email: user.email || '',
      password,
      existingTabConfig
    }
    featureSelectionDialogVisible.value = true
  }

  watch(
    () => featureSelection.value.shared,
    (enabled) => {
      if (enabled) {
        featureSelection.value[USER_TAB_KEYS.GROUPS] = true
        featureSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = true
        return
      }

      featureSelection.value[USER_TAB_KEYS.GROUPS] = false
      featureSelection.value[USER_TAB_KEYS.SHARED_EXPENSES] = false
      featureSelection.value[USER_TAB_KEYS.SHARED_LOANS] = false
      featureSelection.value[USER_TAB_KEYS.USERS] = false
    }
  )

  watch(
    () => featureSelection.value.personal,
    (enabled) => {
      if (enabled) {
        featureSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = true
        return
      }

      featureSelection.value[USER_TAB_KEYS.PERSONAL_EXPENSES] = false
      featureSelection.value[USER_TAB_KEYS.PERSONAL_LOANS] = false
    }
  )

  async function saveFeatureSelection() {
    if (!pendingLoginContext.value || isSavingFeatureSelection.value) return

    isSavingFeatureSelection.value = true
    try {
      const sel = featureSelection.value
      if (!sel.shared && !sel.personal) {
        return showError(
          'Please select at least one feature group — Shared or Personal — to continue.',
          { duration: 0 }
        )
      }
      if (
        sel.shared &&
        !sel[USER_TAB_KEYS.SHARED_EXPENSES] &&
        !sel[USER_TAB_KEYS.SHARED_LOANS] &&
        !sel[USER_TAB_KEYS.USERS]
      ) {
        return showError(
          'You selected Shared features but no shared tabs are enabled. Please select at least one shared tab (Shared Expenses, Shared Loans, or Users).',
          { duration: 0 }
        )
      }
      if (
        sel.personal &&
        !sel[USER_TAB_KEYS.PERSONAL_EXPENSES] &&
        !sel[USER_TAB_KEYS.PERSONAL_LOANS]
      ) {
        return showError(
          'You selected Personal features but no personal tabs are enabled. Please select at least one personal tab (Personal Expenses or Personal Loans).',
          { duration: 0 }
        )
      }
      const userTabConfig = buildUserTabConfig(sel)
      if (!hasEnabledUserTabs(userTabConfig)) {
        return showError('Select at least one actual tab to continue.')
      }
      const { uid, name, mobile, email, password, existingTabConfig } =
        pendingLoginContext.value
      const payload = buildUserTabConfigDocument(
        uid,
        userTabConfig,
        existingTabConfig
      )
      await setDoc(doc(database, DB_NODES.USER_TAB_CONFIGS, uid), payload, {
        merge: true
      })

      featureSelectionDialogVisible.value = false
      await completeLogin(
        { uid, name, mobile, email, password, userTabConfig: payload },
        'Login successful!'
      )
      pendingLoginContext.value = null
    } catch (error) {
      console.error('Failed to save initial tab selection:', error)
      showError(
        error?.code === 'permission-denied'
          ? 'You do not have permission to save tab settings.'
          : error?.message || 'Failed to save tab settings.'
      )
    } finally {
      isSavingFeatureSelection.value = false
    }
  }

  async function cancelFeatureSelection() {
    resetFeatureSelectionDialog()
    try {
      await signOut(auth)
    } catch {
      // Best effort; the UI is already back on the login form.
    }
  }

  // ── Main handlers ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!loginForm.value || isSubmitting.value) return

    const minutesLocked = isLoginLocked()
    if (minutesLocked) {
      return showError(
        `Too many failed attempts. Try again in ${minutesLocked} minute(s).`
      )
    }

    try {
      await loginForm.value.validate()
    } catch {
      return showError('Please fill in all required fields correctly')
    }

    isSubmitting.value = true
    try {
      if (mode.value === 'register') {
        await withTrace('auth_register', handleRegistration)
      } else {
        await withTrace('auth_login', handleLogin)
      }
    } finally {
      isSubmitting.value = false
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────

  async function handleRegistration() {
    const { name, mobile, email, password, rememberMe } = form.value

    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const emailValue = email.trim().toLowerCase()
    const mobileValue = mobile.trim()

    if (!normalizedName || !mobileValue || !emailValue || !password) {
      return showError('All fields are required for registration')
    }

    if (!validateEmail(emailValue)) {
      return showError('Please enter a valid email address')
    }

    if (password.length < 6 || password.length > 15) {
      return showError('Password must be between 6 and 15 characters')
    }

    try {
      // Create Firebase Auth user first — throws auth/email-already-in-use if duplicate.
      // We create auth before any Firestore read so all subsequent reads are authenticated.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailValue,
        password
      )

      // Now authenticated — check if mobile is already taken in Firestore
      const existingUserByMobile = await findUserByMobile(mobileValue)
      if (existingUserByMobile) {
        // Mobile taken — roll back the Auth user we just created
        await userCredential.user.delete()
        return showError('An account with this mobile number already exists')
      }

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: normalizedName
      })

      // Send email verification — always redirect to /login after verification,
      // not the current path (which may be /register).
      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      }

      await sendEmailVerification(userCredential.user, actionCodeSettings)

      // Save user data to Firestore
      const userData = {
        uid: userCredential.user.uid,
        name: normalizedName,
        mobile: mobileValue,
        email: emailValue,
        emailVerified: false, // Will be set to true on first successful login
        blocked: false,
        billedUser: false,
        isAdmin: false,
        bugResolver: false
      }

      await setData(
        `${DB_NODES.USERS}/${userCredential.user.uid}`,
        userData,
        ''
      )
      trackAnalyticsEvent('sign_up', { method: 'password' })

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', emailValue)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      // Store email for potential resend
      lastRegisteredEmail.value = emailValue

      await ElMessageBox.alert(
        `Account created successfully!<br><br>A verification email has been sent to <strong>${emailValue}</strong>.<br><br><strong>Important:</strong> You must verify your email within 48 hours by clicking the link in the email. After verification, you can login.<br><br>If you don't receive the email, please check your <strong>spam or junk folder</strong>.<br><br>If you don't verify within 48 hours, you may need to contact support to complete registration.`,
        'Registration Successful - Verify Your Email',
        {
          confirmButtonText: 'OK',
          type: 'success',
          dangerouslyUseHTMLString: true
        }
      )

      // Switch to login mode and pre-fill email
      mode.value = 'login'
      form.value.email = emailValue
      form.value.name = ''
      form.value.mobile = ''
      form.value.password = ''
      showResendVerification.value = true
    } catch (error) {
      const knownCodes = [
        'auth/email-already-in-use',
        'auth/weak-password',
        'auth/invalid-email'
      ]
      if (!knownCodes.includes(error.code)) {
        console.error('Registration error:', error)
      }

      if (error.code === 'auth/email-already-in-use') {
        showError(
          "This email is already registered. If you registered recently but haven't verified, check your email for the verification link. If the email doesn't belong to you or you need help, please contact support."
        )
      } else if (error.code === 'auth/weak-password') {
        showError('Password is too weak. Please use at least 6 characters.')
      } else if (error.code === 'auth/invalid-email') {
        showError('Invalid email format')
      } else {
        showError(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async function handleLogin() {
    const { email, password, rememberMe } = form.value

    const emailValue = email.trim().toLowerCase()

    if (!emailValue || !password) {
      return showError('Email and password are required')
    }

    if (!validateEmail(emailValue)) {
      return showError('Please enter a valid email address')
    }

    const signInMethods = await getSignInMethods(emailValue)
    if (isGoogleOnlyAccount(signInMethods)) {
      return showError(
        `This account was created with Continue with Google. Please sign in using Google instead of email and password.\nOR\n If you want to use email and password, please reset your password to set it up first.`
      )
    }

    try {
      // Set persistence based on Remember Me
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      )

      // Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        emailValue,
        password
      )

      // Check if email is verified
      // NOTE: Unverified accounts created by mistake (e.g., random emails) will exist
      // but cannot login. This prevents email squatting since the real owner can verify.
      // Consider implementing Cloud Function to auto-delete unverified accounts > 48hrs old.
      if (!userCredential.user.emailVerified) {
        lastRegisteredEmail.value = emailValue
        showResendVerification.value = true
        return showError(
          'Your email is not verified. Please check your inbox and click the verification link. Use "Resend Verification Email" if needed.'
        )
      }

      const resolvedUser = await resolveUserFromAuth(userCredential.user)
      if (!resolvedUser) {
        return showError(
          'No account found with this email. Please register first or check your email address.'
        )
      }

      // Hide resend verification option on successful login
      showResendVerification.value = false

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', emailValue)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      const tabConfigDoc = await findUserTabConfigByUid(resolvedUser.uid)

      if (!hasSavedUserTabConfig(tabConfigDoc)) {
        openFeatureSelectionDialog(resolvedUser, password, tabConfigDoc)
        return
      }

      // Complete login
      await completeLogin(
        {
          name: resolvedUser.name,
          mobile: resolvedUser.mobile,
          email: resolvedUser.email,
          photoUrl: resolvedUser.photoUrl || '',
          photoMeta: resolvedUser.photoMeta || null,
          uid: resolvedUser.uid,
          emailVerified: true,
          blocked: resolvedUser.blocked === true,
          billedUser: resolvedUser.billedUser === true,
          bugResolver: resolvedUser.bugResolver === true,
          isAdmin: resolvedUser.isAdmin === true,
          password,
          userTabConfig: tabConfigDoc
        },
        'Login successful!'
      )
    } catch (error) {
      console.error('Login error:', error)
      recordFailedAttempt()

      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/firebase-app-check-token-is-invalid'
      ) {
        const { count } = getRateLimitData()
        const left = MAX_ATTEMPTS - count
        showError(
          left > 0
            ? `Incorrect email or password. ${left} attempt(s) remaining. If you don't have an account, please register first.`
            : "Incorrect email or password. If you don't have an account, please register first."
        )
      } else if (error.code === 'auth/too-many-requests') {
        showError('Too many failed attempts. Please try again later.')
      } else {
        showError(error.message || 'Login failed. Please try again.')
      }
    }
  }

  // ── Forgot password (email reset) ───────────────────────────────────────

  async function handleResendVerification() {
    const email =
      lastRegisteredEmail.value || form.value.email.trim().toLowerCase()

    if (!email) {
      return showError('Email address not found. Please enter your email.')
    }

    try {
      // Sign in to get the user object (required for sendEmailVerification)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        form.value.password
      )

      const actionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      }

      await sendEmailVerification(userCredential.user, actionCodeSettings)

      showSuccess(
        `Verification email has been resent to ${email}. Please check your inbox.`
      )
    } catch (error) {
      console.error('Error resending verification email:', error)

      if (error.code === 'auth/too-many-requests') {
        showError(
          'Too many requests. Please wait a few minutes before trying again.'
        )
      } else if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showError(
          'Incorrect password. Please enter your correct password to resend verification.'
        )
      } else {
        showError(error.message || 'Failed to resend verification email.')
      }
    }
  }

  function handleForgotCode() {
    resetEmail.value = form.value.email?.trim() || ''
    emailResetDialogVisible.value = true
  }

  async function sendResetEmail() {
    const email = resetEmail.value?.trim() || ''

    if (!email) {
      return showError('Please enter your email address')
    }

    if (!validateEmail(email)) {
      return showError('Please enter a valid email address')
    }

    isEmailResetLoading.value = true

    try {
      // Configure action code settings to redirect back to our app
      const actionCodeSettings = {
        // URL to redirect to after email link is clicked
        url: `${window.location.origin}${window.location.pathname}?mode=resetPassword&email=${encodeURIComponent(email)}`,
        handleCodeInApp: true
      }

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email, actionCodeSettings)

      isEmailResetLoading.value = false
      emailResetDialogVisible.value = false
      resetEmail.value = ''

      await ElMessageBox.alert(
        `A password reset link has been sent to <strong>${email}</strong>.<br><br>Click the link in your email to reset your password on the secure Firebase page. You'll be redirected back to this page when done.`,
        'Reset Email Sent',
        {
          confirmButtonText: 'OK',
          type: 'success',
          dangerouslyUseHTMLString: true
        }
      )
    } catch (error) {
      isEmailResetLoading.value = false
      console.error('Error sending reset email:', error)

      if (error.code === 'auth/user-not-found') {
        showError('No account found with this email address.')
      } else if (error.code === 'auth/invalid-email') {
        showError('Invalid email address format.')
      } else if (error.code === 'auth/too-many-requests') {
        showError('Too many requests. Please try again later.')
      } else {
        showError(
          error.message || 'Failed to send reset email. Please try again.'
        )
      }
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────

  async function handleGoogleSignIn() {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user

      const email = firebaseUser.email?.trim().toLowerCase()
      const existingUser = await findUserByEmail(email)

      if (existingUser) {
        // Returning user — run the normal post-auth flow
        const tabConfigDoc = await findUserTabConfigByUid(existingUser.uid)
        if (!hasSavedUserTabConfig(tabConfigDoc)) {
          openFeatureSelectionDialog(existingUser, null, tabConfigDoc)
          return
        }
        await completeLogin(
          {
            name: existingUser.name,
            mobile: existingUser.mobile,
            email: existingUser.email,
            uid: existingUser.uid,
            password: null,
            userTabConfig: tabConfigDoc
          },
          'Login successful!'
        )
      } else {
        // New Google user — collect mobile number before saving to DB
        googlePendingFirebaseUser.value = firebaseUser
        googleMobileInput.value = ''
        googleMobileDialogVisible.value = true
      }
    } catch (error) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        // User dismissed — do nothing
        return
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        showError(
          'This email is already registered with email and password. Please login using your email and password instead.'
        )
        return
      }
      console.error('Google sign-in error:', error)
      showError(error.message || 'Google sign-in failed. Please try again.')
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitGoogleMobile() {
    if (!googlePendingFirebaseUser.value || isGoogleMobileSubmitting.value)
      return

    const mobile = googleMobileInput.value.replace(/\D/g, '').trim()
    if (!mobile) return showError('Please enter your mobile number.')
    if (mobile.length < 10 || mobile.length > 11) {
      return showError('Please enter a valid mobile number (10-11 digits).')
    }

    isGoogleMobileSubmitting.value = true
    try {
      const existingByMobile = await findUserByMobile(mobile)
      if (existingByMobile) {
        return showError('An account with this mobile number already exists.')
      }

      const firebaseUser = googlePendingFirebaseUser.value
      const email = firebaseUser.email.trim().toLowerCase()
      const name = (firebaseUser.displayName || email.split('@')[0]).trim()
      const uid = firebaseUser.uid

      const userData = {
        uid,
        name,
        mobile,
        email,
        emailVerified: true,
        blocked: false,
        billedUser: false,
        isAdmin: false,
        bugResolver: false
      }

      await setDoc(doc(database, DB_NODES.USERS, uid), userData)
      trackAnalyticsEvent('sign_up', { method: 'google' })

      googleMobileDialogVisible.value = false
      openFeatureSelectionDialog({ uid, name, mobile, email }, null, null)
    } catch (error) {
      console.error('Google mobile submit error:', error)
      showError(
        error.message || 'Failed to save your details. Please try again.'
      )
    } finally {
      isGoogleMobileSubmitting.value = false
    }
  }

  function cancelGoogleMobileDialog() {
    googleMobileDialogVisible.value = false
    googleMobileInput.value = ''
    googlePendingFirebaseUser.value = null
    signOut(auth).catch(() => {})
  }

  return {
    form,
    loginForm,
    mode,
    isSubmitting,
    emailResetDialogVisible,
    resetEmail,
    isEmailResetLoading,
    showResendVerification,
    featureSelection,
    featureSelectionDialogVisible,
    isSavingFeatureSelection,
    googleMobileDialogVisible,
    googleMobileInput,
    isGoogleMobileSubmitting,
    handleSubmit,
    handleForgotCode,
    sendResetEmail,
    handleResendVerification,
    saveFeatureSelection,
    cancelFeatureSelection,
    handleGoogleSignIn,
    submitGoogleMobile,
    cancelGoogleMobileDialog
  }
}
