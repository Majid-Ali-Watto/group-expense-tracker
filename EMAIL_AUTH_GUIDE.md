# Email Authentication Feature - Implementation Guide

## Overview

This feature adds **email-based authentication** as an alternative to mobile-based authentication in the Group Expense Tracker application. Users can now register and login using either their mobile number or email address.

## Features Implemented

✅ **Dual Login Methods** - Users can login with:
  - Mobile number + Password
  - Email + Password

✅ **Dual Recovery Methods** - Users can reset forgotten passwords using:
  - Recovery passcodes (mobile-based)
  - Firebase password reset email (email-based)

✅ **Automatic Recovery Code Generation** - New recovery codes generated after email reset

✅ **Seamless Integration** - Works alongside existing mobile authentication

## How It Works

### 1. Registration

Users can register using their mobile number. During registration, they can optionally provide an email address:

```
Name: John Doe
Mobile: 03001234567
Email: john@example.com (optional)
Password: ****
```

The email field is optional during registration but required for email-based recovery.

### 2. Login Options

#### Option A: Mobile Login
1. Select "Mobile" as login method
2. Enter mobile number (03XXXXXXXXX)
3. Enter name and password
4. Click "Login / Continue"

#### Option B: Email Login
1. Select "Email" as login method
2. Enter email address
3. Enter name and password
4. Click "Login / Continue"

### 3. Password Recovery Options

When users click "Forgot Password?", they get two choices:

#### Option A: Use Recovery Passcodes (Mobile-based)
1. System prompts: "How would you like to reset your password?"
2. Click "Use Recovery Passcodes"
3. Enter mobile number
4. Enter one of the saved recovery passcodes
5. Set new password
6. Receive new set of recovery passcodes
7. Automatically logged in

#### Option B: Use Email Reset (Email-based)
1. System prompts: "How would you like to reset your password?"
2. Click "Use Email Reset"
3. Enter email address in dialog
4. Click "Send Reset Link"
5. Check email inbox for Firebase password reset link
6. Click link in email and follow instructions
7. System automatically:
   - Updates password in database
   - Generates new recovery passcodes
   - Logs user in

## File Structure

### Modified Files

```
src/
├── firebase.js                     # Added Firebase Auth exports
├── components/
│   └── Login.vue                   # Added email field and reset dialog
├── scripts/
│   └── login.js                    # Added email auth logic
└── assets/
    └── validation-rules.js         # Updated validation for email
```

## Code Changes

### 1. Firebase Configuration (`src/firebase.js`)

Added Firebase Authentication exports:

```javascript
import {
  getAuth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth'

const auth = getAuth(app)

export {
  // ... existing exports
  auth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
}
```

### 2. Login Component (`src/components/Login.vue`)

**Added:**
- Login method radio buttons (Mobile/Email)
- Email input field (conditional)
- Email reset dialog
- Loading states for email operations

**Key UI Elements:**
```vue
<!-- Login Method Selector -->
<el-radio-group v-model="loginMethod">
  <el-radio-button label="mobile">Mobile</el-radio-button>
  <el-radio-button label="email">Email</el-radio-button>
</el-radio-group>

<!-- Email Input (shown when email selected) -->
<el-form-item v-if="loginMethod === 'email'" label="Email">
  <el-input v-model="form.email" type="email" />
</el-form-item>
```

### 3. Login Script (`src/scripts/login.js`)

**Added State:**
```javascript
const loginMethod = ref('mobile') // 'mobile' or 'email'
const emailResetDialogVisible = ref(false)
const resetEmail = ref('')
const isEmailResetLoading = ref(false)
```

**Added Functions:**
- `validateEmail(email)` - Validates email format
- `findUserByEmail(email)` - Finds user by email in database
- `handleMobileLogin()` - Handles mobile-based login
- `handleEmailLogin()` - Handles email-based login
- `handlePasscodeRecovery()` - Handles passcode-based recovery
- `sendResetEmail()` - Sends Firebase password reset email

**Updated Functions:**
- `handleSubmit()` - Now routes to mobile or email login
- `handleForgotCode()` - Now shows choice dialog
- `confirmRecoveryCodes()` - Handles email field

## Database Structure

### User Object (Firebase Realtime Database)

```javascript
{
  "users": {
    "03001234567": {
      "name": "John Doe",
      "mobile": "03001234567",
      "email": "john@example.com",      // NEW FIELD (optional)
      "loginCode": "mypassword123",
      "recoveryCodes": [
        "ABCD-EFGH-JKLM",
        "NOPQ-RSTU-VWXY",
        // ... 10 codes total
      ]
    }
  }
}
```

**Notes:**
- `mobile` is still the primary key
- `email` is optional but recommended for recovery
- Both mobile and email can be used for login
- Recovery codes work the same way

## Security Considerations

### 1. Email Validation
- Email format validated using regex pattern
- Firebase authentication validates email exists

### 2. Password Reset Security
- Firebase handles password reset token generation
- Reset links expire after a set time (Firebase default: 1 hour)
- One-time use links

### 3. Recovery Code Regeneration
- All old recovery codes invalidated after email reset
- User forced to save new codes before continuing
- 10 new codes generated each time

### 4. Data Integrity
- Mobile number remains primary identifier
- Email stored separately but linked to mobile
- No duplicate email check (user responsibility)

## Firebase Setup Required

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### 2. Configure Email Templates (Optional)

Customize the password reset email template:

1. Go to **Authentication** → **Templates**
2. Select **Password reset**
3. Customize:
   - **Sender name**
   - **Sender email**
   - **Subject**
   - **Email body**

### 3. Add Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add your domains (e.g., `localhost`, `yourdomain.com`)

## Usage Examples

### Example 1: Register with Email

```
User Flow:
1. Enter name: "Jane Smith"
2. Select "Mobile" method
3. Enter mobile: "03331234567"
4. Enter email: "jane@example.com"
5. Enter password: "jane2024"
6. Click "Login / Continue"
7. System creates account with mobile + email
8. Shows 10 recovery passcodes
9. User saves codes and continues
```

### Example 2: Login with Email

```
User Flow:
1. Select "Email" method
2. Enter name: "Jane Smith"
3. Enter email: "jane@example.com"
4. Enter password: "jane2024"
5. Click "Login / Continue"
6. System finds user by email
7. Validates credentials
8. Logs user in successfully
```

### Example 3: Reset via Email

```
User Flow:
1. Click "Forgot Password?"
2. System shows: "How would you like to reset?"
3. Click "Use Email Reset"
4. Enter email: "jane@example.com"
5. Click "Send Reset Link"
6. Check email inbox
7. Click reset link in email
8. System:
   - Updates password in database
   - Generates 10 new recovery codes
   - Shows codes in dialog
9. User saves codes
10. Automatically logged in
```

### Example 4: Reset via Passcode

```
User Flow:
1. Click "Forgot Password?"
2. System shows: "How would you like to reset?"
3. Click "Use Recovery Passcodes"
4. Enter mobile: "03331234567"
5. Enter passcode: "ABCD-EFGH-JKLM"
6. System validates passcode
7. Enter new password
8. If last passcode:
   - System generates 10 new codes
   - Shows codes in dialog
   - User saves codes
9. Automatically logged in
```

## Error Handling

### Email Login Errors

| Error | User Message |
|-------|--------------|
| Email not found | "No account found with this email" |
| Invalid email format | "Please enter a valid email address" |
| Wrong password | "Incorrect password" |
| Name mismatch | "Name does not match the registered user" |

### Email Reset Errors

| Firebase Error Code | User Message |
|---------------------|--------------|
| `auth/user-not-found` | "No account found with this email address" |
| `auth/invalid-email` | "Invalid email address format" |
| `auth/too-many-requests` | "Too many requests. Please try again later" |

## Testing Checklist

- [ ] Register new user with mobile and email
- [ ] Login using mobile number
- [ ] Login using email address
- [ ] Forgot password → Use recovery passcodes
- [ ] Forgot password → Use email reset
- [ ] Verify email reset link received
- [ ] Verify new recovery codes generated
- [ ] Verify automatic login after reset
- [ ] Test validation errors (invalid email, etc.)
- [ ] Test with Remember Me enabled
- [ ] Test with Remember Me disabled

## Troubleshooting

### Issue: Email reset link not received

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Check Firebase email quota
4. Verify Email/Password auth is enabled in Firebase Console

### Issue: "No account found with this email"

**Solutions:**
1. Verify email was added during registration
2. Check email spelling
3. Try logging in with mobile instead
4. Register a new account if needed

### Issue: Reset link expired

**Solutions:**
1. Request a new reset link
2. Links expire after 1 hour (Firebase default)
3. Complete reset process quickly

## API Reference

### New Functions in `login.js`

```javascript
// Validate email format
validateEmail(email: string): boolean

// Find user by email address
findUserByEmail(email: string): Promise<User | null>

// Handle mobile-based login
handleMobileLogin(mobile: string, name: string, code: string): Promise<void>

// Handle email-based login  
handleEmailLogin(email: string, name: string, code: string): Promise<void>

// Handle passcode recovery flow
handlePasscodeRecovery(): Promise<void>

// Send password reset email
sendResetEmail(): Promise<void>
```

### New State Variables

```javascript
loginMethod: ref('mobile' | 'email')
emailResetDialogVisible: ref(boolean)
resetEmail: ref(string)
isEmailResetLoading: ref(boolean)
```

## Future Enhancements

Potential improvements:

1. **Email Verification** - Require email verification before use
2. **Duplicate Email Check** - Prevent multiple accounts with same email
3. **Social Login** - Google, Facebook, etc.
4. **Two-Factor Authentication** - SMS + Email verification
5. **Account Linking** - Link multiple mobile numbers to one email
6. **Email Change** - Allow users to update their email
7. **Notification Preferences** - Send alerts via email

## Migration Notes

### For Existing Users

- Existing users (registered with mobile only) can continue logging in with mobile
- They can add an email to their profile later
- Recovery passcodes still work for all users
- No data migration required

### For New Deployments

- Users can choose mobile or email during registration
- Email is optional but recommended for recovery
- All recovery methods available from day one

## Support

For issues or questions:
- Check Firebase Console logs
- Review browser console errors
- Verify Firebase Email/Password authentication is enabled
- Test with Firebase email template preview

## License

This implementation follows the same license as the main project.

---

**Last Updated**: February 24, 2026
**Version**: 2.0.0
