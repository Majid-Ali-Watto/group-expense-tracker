import { onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import useFireBase from '../../api/firebase-apis'
import { useAuthStore } from '../../stores/authStore'
import { DB_NODES } from '../../constants/db-nodes'
import { useGroupStore } from '../../stores/groupStore'
import { showError, showSuccess } from '../../utils/showAlerts'
import { encryptForSession, encryptForStore } from '../../utils/sessionCrypto'
import { generateUUID } from '../../utils/uuid'
import {
  auth,
  sendPasswordResetEmail,
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from '../../firebase'

export const Login = () => {
  const authStore = useAuthStore()
  const groupStore = useGroupStore()
  const { read, updateData } = useFireBase()

  const form = ref({
    name: '',
    mobile: '',
    email: '',
    loginCode: '',
    rememberMe: false
  })

  const loginForm = ref(null)
  const mode = ref('login') // 'login' or 'register'

  // Email reset dialog state
  const emailResetDialogVisible = ref(false)
  const resetEmail = ref('')
  const isEmailResetLoading = ref(false)

  // Email verification state
  const lastRegisteredEmail = ref('')
  const showResendVerification = ref(false)

  onMounted(async () => {
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

  function validateEmail(email) {
    // More strict email validation:
    // - At least 3 characters before @
    // - Domain must have at least 2 characters
    // - TLD must have at least 2 characters
    const emailPattern = /^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/
    return emailPattern.test(email)
  }

  async function findUserByEmail(email) {
    try {
      const usersSnapshot = await read(DB_NODES.USERS)
      if (!usersSnapshot) return null

      // Find user with matching email
      const userEntries = Object.entries(usersSnapshot)
      for (const [mobile, userData] of userEntries) {
        if (userData.email?.toLowerCase() === email.toLowerCase()) {
          return { ...userData, mobile }
        }
      }
      return null
    } catch (error) {
      console.error('Error finding user by email:', error)
      return null
    }
  }

  function activateUserGroup(mobileKey) {
    const groups = groupStore.getGroups || []
    const myGroup = groups.find((g) =>
      (g.members || []).some((m) => m.mobile === mobileKey)
    )
    if (myGroup) groupStore.setActiveGroup(myGroup.id)
  }

  async function completeLogin(payload, message) {
    const token = generateUUID()
    const [encryptedSession, encryptedStore] = await Promise.all([
      encryptForSession({ ...payload, token }),
      encryptForStore({ ...payload, token })
    ])

    sessionStorage.setItem('_session', encryptedSession)
    authStore.setActiveUser(payload.mobile)
    authStore.setSessionToken(encryptedStore)
    authStore.setActiveLoginCode(payload.loginCode)
    activateUserGroup(payload.mobile)
    showSuccess(message || 'Login successful!')
  }

  // ── Main handlers ─────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!loginForm.value) return

    try {
      await loginForm.value.validate()
    } catch {
      return showError('Please fill in all required fields correctly')
    }

    if (mode.value === 'register') {
      await handleRegistration()
    } else {
      await handleLogin()
    }
  }

  // ── Registration ──────────────────────────────────────────────────────────

  async function handleRegistration() {
    const { name, mobile, email, loginCode, rememberMe } = form.value

    const normalizedName = name.trim().replace(/\s+/g, ' ')
    const emailValue = email.trim().toLowerCase()
    const mobileValue = mobile.trim()

    if (!normalizedName || !mobileValue || !emailValue || !loginCode) {
      return showError('All fields are required for registration')
    }

    if (!validateEmail(emailValue)) {
      return showError('Please enter a valid email address')
    }

    if (loginCode.length < 6 || loginCode.length > 15) {
      return showError('Password must be between 6 and 15 characters')
    }

    try {
      // Check if email already exists in database
      const existingUserByEmail = await findUserByEmail(emailValue)
      if (existingUserByEmail) {
        return showError('An account with this email already exists')
      }

      // Check if mobile already exists in database
      const existingUserByMobile = await read(`${DB_NODES.USERS}/${mobileValue}`)
      if (existingUserByMobile) {
        return showError('An account with this mobile number already exists')
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailValue,
        loginCode
      )

      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: normalizedName
      })

      // Send email verification
      const actionCodeSettings = {
        url: `${window.location.origin}${window.location.pathname}`,
        handleCodeInApp: false
      }

      await sendEmailVerification(userCredential.user, actionCodeSettings)

      // Save user data to Realtime Database (without loginCode - it's only in Firebase Auth)
      const userData = {
        name: normalizedName,
        mobile: mobileValue,
        email: emailValue,
        uid: userCredential.user.uid,
        emailVerified: false // Will be set to true on first successful login
      }

      await updateData(`${DB_NODES.USERS}/${mobileValue}`, () => userData, '')

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
      form.value.loginCode = ''
      showResendVerification.value = true
    } catch (error) {
      console.error('Registration error:', error)

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
    const { email, loginCode, rememberMe } = form.value

    const emailValue = email.trim().toLowerCase()

    if (!emailValue || !loginCode) {
      return showError('Email and password are required')
    }

    if (!validateEmail(emailValue)) {
      return showError('Please enter a valid email address')
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
        loginCode
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

      // Find user in database
      const user = await findUserByEmail(emailValue)

      if (!user) {
        return showError(
          'User data not found in database. Please contact support.'
        )
      }

      // Always sync uid and emailVerified on login (backfills existing users without uid)
      if (!user.emailVerified || !user.uid) {
        const verifiedUserData = {
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          uid: userCredential.user.uid,
          emailVerified: true,
          ...(user.addedBy ? { addedBy: user.addedBy } : {})
        }
        await updateData(`${DB_NODES.USERS}/${user.mobile}`, () => verifiedUserData, '')
      }

      // Hide resend verification option on successful login
      showResendVerification.value = false

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', emailValue)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      // Complete login
      await completeLogin(
        { name: user.name, mobile: user.mobile, loginCode },
        'Login successful!'
      )
    } catch (error) {
      console.error('Login error:', error)

      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        showError('Incorrect password')
      } else if (error.code === 'auth/user-not-found') {
        showError('No account found with this email')
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
        form.value.loginCode
      )

      const actionCodeSettings = {
        url: `${window.location.origin}${window.location.pathname}`,
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
      // Find user by email
      const user = await findUserByEmail(email)

      if (!user) {
        isEmailResetLoading.value = false
        return showError(
          'No account found with this email address. Please check and try again.'
        )
      }

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

  return {
    form,
    loginForm,
    mode,
    emailResetDialogVisible,
    resetEmail,
    isEmailResetLoading,
    showResendVerification,
    handleSubmit,
    handleForgotCode,
    sendResetEmail,
    handleResendVerification
  }
}
