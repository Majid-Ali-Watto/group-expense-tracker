import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import { stripLocalePrefix } from '@/utils/seo'
import { useFireBase, loadAppConfig, useRateLimit } from '@/composables'
import {
  validateEmail,
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
  isValidPhoneNumber,
  normalizePhoneNumber,
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
  const { t } = useI18n()
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const userStore = useUserStore()
  const { setData } = useFireBase()
  const { clearLoginAttempts, isLoginLocked, recordFailedAttempt } =
    useRateLimit()
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
  // Initialize mode from the current URL path (ignoring an optional /ur prefix)
  const mode = ref(
    stripLocalePrefix(route.path) === '/register' ? 'register' : 'login'
  )

  // When the URL changes (e.g. browser back/forward), sync the mode
  watch(
    () => route.path,
    (path) => {
      const next =
        stripLocalePrefix(path) === '/register' ? 'register' : 'login'
      if (mode.value !== next) mode.value = next
    }
  )

  // When user clicks the Login/Register toggle, update the URL to match,
  // preserving the current locale prefix (e.g. /ur/login <-> /ur/register)
  watch(mode, (val) => {
    const localePrefix = route.meta?.locale === 'ur' ? '/ur' : ''
    const target = `${localePrefix}${val === 'register' ? '/register' : '/login'}`
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
    // App-update check now runs once from App.vue's own onMounted (src/scripts/layout/app.js)
    // so it covers every route, not just this one — see checkForAppUpdate() there.

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
        t('authMessages.passwordResetCompleteBody'),
        t('authMessages.passwordResetCompleteTitle'),
        {
          confirmButtonText: t('common.ok'),
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
    await clearLoginAttempts(payload.email)
    userStore.addUser({
      uid: payload.uid,
      name: payload.name || '',
      mobile: payload.mobile || '',
      email: payload.email || '',
      photoUrl: payload.photoUrl || '',
      photoMeta: payload.photoMeta || null,
      emailVerified: payload.emailVerified !== false,
      blocked: payload.blocked === true
    })
    // isAdmin/billedUser/bugResolver live in user-admin-flags/{uid} — every
    // caller of completeLogin is expected to have already fetched them
    // (resolveUserFromAuth merges them in; the Google-returning-user path
    // fetches them explicitly) and passed them through on payload.
    userStore.setActiveUserAdminFlags({
      isAdmin: payload.isAdmin === true,
      billedUser: payload.billedUser === true,
      bugResolver: payload.bugResolver === true
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
    activateUserGroup(payload.uid)
    loadAppConfig() // fire-and-forget: load remote config flags after login
    trackAnalyticsEvent('login', { method: 'password' })
    showSuccess(message || t('authMessages.loginSuccessful'))
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
        return showError(t('authMessages.selectFeatureGroup'), {
          duration: 0
        })
      }
      if (
        sel.shared &&
        !sel[USER_TAB_KEYS.SHARED_EXPENSES] &&
        !sel[USER_TAB_KEYS.SHARED_LOANS] &&
        !sel[USER_TAB_KEYS.USERS]
      ) {
        return showError(t('authMessages.sharedNoTabsEnabled'), {
          duration: 0
        })
      }
      if (
        sel.personal &&
        !sel[USER_TAB_KEYS.PERSONAL_EXPENSES] &&
        !sel[USER_TAB_KEYS.PERSONAL_LOANS]
      ) {
        return showError(t('authMessages.personalNoTabsEnabled'), {
          duration: 0
        })
      }
      const userTabConfig = buildUserTabConfig(sel)
      if (!hasEnabledUserTabs(userTabConfig)) {
        return showError(t('authMessages.selectAtLeastOneTab'))
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
      await completeLogin({
        uid,
        name,
        mobile,
        email,
        password,
        userTabConfig: payload
      })
      pendingLoginContext.value = null
    } catch (error) {
      console.error('Failed to save initial tab selection:', error)
      showError(
        error?.code === 'permission-denied'
          ? t('authMessages.noPermissionSaveTabs')
          : error?.message || t('authMessages.saveTabSettingsFailed')
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

    isSubmitting.value = true
    try {
      const minutesLocked = await isLoginLocked(
        form.value.email.trim().toLowerCase()
      )
      if (minutesLocked) {
        return showError(
          t('authMessages.tooManyFailedAttempts', { minutes: minutesLocked })
        )
      }

      try {
        await loginForm.value.validate()
      } catch {
        return showError(t('authMessages.fillRequiredFields'))
      }

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
    const mobileValue = normalizePhoneNumber(mobile)

    if (!normalizedName || !mobileValue || !emailValue || !password) {
      return showError(t('authMessages.allFieldsRequired'))
    }

    if (!validateEmail(emailValue)) {
      return showError(t('authMessages.invalidEmail'))
    }

    if (!isValidPhoneNumber(mobileValue)) {
      return showError(t('validation.mobilePattern'))
    }

    if (password.length < 6 || password.length > 15) {
      return showError(t('authMessages.passwordLength'))
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
        return showError(t('authMessages.mobileExists'))
      }

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: normalizedName
      })

      // Send email verification — always redirect to /login after verification,
      // not the current path (which may be /register). Preserve the current
      // locale prefix so the post-verification redirect stays in Urdu.
      const localePrefix = route.meta?.locale === 'ur' ? '/ur' : ''
      const actionCodeSettings = {
        url: `${window.location.origin}${localePrefix}/login`,
        handleCodeInApp: false
      }

      await sendEmailVerification(userCredential.user, actionCodeSettings)

      // Save user data to Firestore. isAdmin/billedUser/bugResolver are
      // intentionally NOT included here — they live in the admin-only
      // user-admin-flags/{uid} doc (see firestore.rules), and default to
      // false there when absent. email is likewise kept off this doc — it
      // lives in the self/admin-only user-private/{uid} doc instead, since
      // users/{uid} is readable by any authenticated user.
      const userData = {
        uid: userCredential.user.uid,
        name: normalizedName,
        mobile: mobileValue,
        emailVerified: false, // Will be set to true on first successful login
        blocked: false
      }

      await setData(
        `${DB_NODES.USERS}/${userCredential.user.uid}`,
        userData,
        ''
      )
      await setData(
        `${DB_NODES.USER_PRIVATE}/${userCredential.user.uid}`,
        { email: emailValue },
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

      try {
        await signOut(auth)
      } catch (signOutError) {
        console.warn('Failed to clear registration auth state:', signOutError)
      }

      await ElMessageBox.alert(
        t('authMessages.registrationSuccessBody', { email: emailValue }),
        t('authMessages.registrationSuccessTitle'),
        {
          confirmButtonText: t('common.ok'),
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
        showError(t('authMessages.emailAlreadyRegistered'))
      } else if (error.code === 'auth/weak-password') {
        showError(t('authMessages.weakPassword'))
      } else if (error.code === 'auth/invalid-email') {
        showError(t('authMessages.invalidEmailFormat'))
      } else {
        showError(error.message || t('authMessages.registrationFailed'))
      }
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async function handleLogin() {
    const { email, password, rememberMe } = form.value

    const emailValue = email.trim().toLowerCase()

    if (!emailValue || !password) {
      return showError(t('authMessages.emailPasswordRequired'))
    }

    if (!validateEmail(emailValue)) {
      return showError(t('authMessages.invalidEmail'))
    }

    const signInMethods = await getSignInMethods(emailValue)
    if (isGoogleOnlyAccount(signInMethods)) {
      return showError(t('authMessages.googleOnlyAccount'))
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
        return showError(t('authMessages.emailNotVerified'))
      }

      const resolvedUser = await resolveUserFromAuth(userCredential.user)
      if (!resolvedUser) {
        return showError(t('authMessages.noAccountFound'))
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
      await completeLogin({
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
      })
    } catch (error) {
      console.error('Login error:', error)

      if (error.code === 'auth/user-not-found') {
        // Firebase returns this when email enumeration protection is disabled
        showError(t('authMessages.noAccountFound'))
      } else if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/firebase-app-check-token-is-invalid'
      ) {
        const { attemptsLeft } = await recordFailedAttempt(emailValue)
        showError(
          attemptsLeft > 0
            ? t('authMessages.incorrectCredentialsWithAttempts', {
                left: attemptsLeft
              })
            : t('authMessages.incorrectCredentials')
        )
      } else if (error.code === 'auth/too-many-requests') {
        showError(t('authMessages.tooManyFailedLoginAttempts'))
      } else {
        showError(error.message || t('authMessages.loginFailed'))
      }
    }
  }

  // ── Forgot password (email reset) ───────────────────────────────────────

  async function handleResendVerification() {
    const email =
      lastRegisteredEmail.value || form.value.email.trim().toLowerCase()

    if (!email) {
      return showError(t('authMessages.emailNotFound'))
    }

    try {
      // Sign in to get the user object (required for sendEmailVerification)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        form.value.password
      )

      const localePrefix = route.meta?.locale === 'ur' ? '/ur' : ''
      const actionCodeSettings = {
        url: `${window.location.origin}${localePrefix}/login`,
        handleCodeInApp: false
      }

      await sendEmailVerification(userCredential.user, actionCodeSettings)

      showSuccess(t('authMessages.verificationResent', { email }))
    } catch (error) {
      console.error('Error resending verification email:', error)

      if (error.code === 'auth/too-many-requests') {
        showError(t('authMessages.tooManyRequestsWait'))
      } else if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/firebase-app-check-token-is-invalid'
      ) {
        showError(t('authMessages.incorrectPasswordResend'))
      } else {
        showError(error.message || t('authMessages.resendFailed'))
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
      return showError(t('authMessages.enterEmailAddress'))
    }

    if (!validateEmail(email)) {
      return showError(t('authMessages.invalidEmail'))
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
        t('authMessages.resetEmailSentBody', { email }),
        t('authMessages.resetEmailSentTitle'),
        {
          confirmButtonText: t('common.ok'),
          type: 'success',
          dangerouslyUseHTMLString: true
        }
      )
    } catch (error) {
      isEmailResetLoading.value = false
      console.error('Error sending reset email:', error)

      if (error.code === 'auth/user-not-found') {
        showError(t('authMessages.noAccountForEmail'))
      } else if (error.code === 'auth/invalid-email') {
        showError(t('authMessages.invalidEmailAddressFormat'))
      } else if (error.code === 'auth/too-many-requests') {
        showError(t('authMessages.tooManyRequests'))
      } else {
        showError(error.message || t('authMessages.resetEmailFailed'))
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

      const existingUser = await resolveUserFromAuth(firebaseUser)

      if (existingUser) {
        // Returning user — run the normal post-auth flow
        const tabConfigDoc = await findUserTabConfigByUid(existingUser.uid)
        if (!hasSavedUserTabConfig(tabConfigDoc)) {
          openFeatureSelectionDialog(existingUser, null, tabConfigDoc)
          return
        }
        await completeLogin({
          name: existingUser.name,
          mobile: existingUser.mobile,
          email: existingUser.email,
          uid: existingUser.uid,
          password: null,
          userTabConfig: tabConfigDoc,
          billedUser: existingUser.billedUser === true,
          bugResolver: existingUser.bugResolver === true,
          isAdmin: existingUser.isAdmin === true
        })
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
        showError(t('authMessages.googleAccountExistsDifferentCred'))
        return
      }
      console.error('Google sign-in error:', error)
      showError(error.message || t('authMessages.googleSignInFailed'))
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitGoogleMobile() {
    if (!googlePendingFirebaseUser.value || isGoogleMobileSubmitting.value)
      return

    const mobile = normalizePhoneNumber(googleMobileInput.value)
    if (!mobile) return showError(t('authMessages.enterMobileNumber'))
    if (!isValidPhoneNumber(mobile)) {
      return showError(t('validation.mobilePattern'))
    }

    isGoogleMobileSubmitting.value = true
    try {
      const existingByMobile = await findUserByMobile(mobile)
      if (existingByMobile) {
        return showError(t('authMessages.mobileExists'))
      }

      const firebaseUser = googlePendingFirebaseUser.value
      const email = firebaseUser.email.trim().toLowerCase()
      const name = (firebaseUser.displayName || email.split('@')[0]).trim()
      const uid = firebaseUser.uid

      // isAdmin/billedUser/bugResolver intentionally omitted — they live in
      // the admin-only user-admin-flags/{uid} doc and default to false there.
      // email is likewise omitted — it lives in the self/admin-only
      // user-private/{uid} doc instead, since users/{uid} is readable by any
      // authenticated user.
      const userData = {
        uid,
        name,
        mobile,
        emailVerified: true,
        blocked: false
      }

      await setDoc(doc(database, DB_NODES.USERS, uid), userData)
      await setDoc(doc(database, DB_NODES.USER_PRIVATE, uid), { email })
      trackAnalyticsEvent('sign_up', { method: 'google' })

      googleMobileDialogVisible.value = false
      openFeatureSelectionDialog({ uid, name, mobile, email }, null, null)
    } catch (error) {
      console.error('Google mobile submit error:', error)
      showError(error.message || t('authMessages.saveDetailsFailed'))
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
