# Email Verification Guide

## Overview

This application uses Firebase Authentication with email verification to ensure all users have valid, accessible email addresses.

## How It Works

### Registration Flow

1. **User Registration**
   - User enters: name, mobile, email, login code
   - System validates email format (minimum 3 chars before @, valid domain)
   - Firebase Auth account is created immediately
   - Verification email is automatically sent
   - User data is saved to Realtime Database

2. **Email Verification**
   - User receives email from Firebase
   - Email contains verification link
   - User clicks link → email becomes verified in Firebase
   - **Deadline: 48 hours recommended**

3. **Login Attempt**
   - User enters email and login code
   - System checks if email is verified
   - If NOT verified: Login is blocked with helpful message
   - "Resend Verification Email" button appears
   - If verified: Login proceeds normally

### Password Reset Flow

- User clicks "Forgot Login Code?"
- Enters email address
- Firebase sends password reset link
- User resets password on Firebase secure page
- Redirected back to app with success message

## Important Behaviors

### Verified User Filtering

**Implementation:** Users are marked as verified in the Realtime Database upon successful login.

**How it works:**
1. During registration, user data is saved with `emailVerified: false`
2. User verifies email via link (Firebase Auth updates `emailVerified` status)
3. On first successful login (after email verification), `emailVerified: true` is written to database
4. Only users with `emailVerified: true` appear in:
   - Users list (Users page)
   - Group member selection
   - Any user listings

**Benefits:**
- Prevents unverified users from being added to groups
- No server-side code needed (Cloud Functions)
- Simple and reliable
- Self-healing (unverified users become visible once they verify and login)

### Unverified Accounts

**Issue:** Anyone can register with any email address (even if they don't own it)

**Impact:**
- Unverified accounts are created but cannot login
- Email becomes "reserved" until verified or manually cleaned up
- Random/fake emails will have unused accounts

**Current Solution:**
- Unverified accounts exist but are completely unusable
- They cannot login
- They take up the email "slot"

**Mitigation:**
1. Clear messaging during registration about 48-hour requirement
2. If real owner tries to register later, they see helpful error message
3. Manual cleanup by admin if needed

**Future Enhancement:**
Consider implementing a Cloud Function to automatically delete unverified accounts older than 48 hours:

```javascript
// Example Cloud Function (not implemented)
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.cleanupUnverifiedUsers = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const listUsersResult = await admin.auth().listUsers();
    const now = Date.now();
    const maxAge = 48 * 60 * 60 * 1000; // 48 hours

    const deletePromises = listUsersResult.users
      .filter(user => !user.emailVerified)
      .filter(user => now - new Date(user.metadata.creationTime).getTime() > maxAge)
      .map(user => admin.auth().deleteUser(user.uid));

    await Promise.all(deletePromises);
  });
```

## Security Features

### Email Validation
- Minimum 3 characters before @
- Valid domain (min 2 chars)
- Valid TLD (min 2 chars)
- Pattern: `/^[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9.-]{2,}\.[a-zA-Z]{2,}$/`

Examples:
- ✅ `user@example.com`
- ✅ `john.doe@company.co`
- ❌ `m@m.com` (too short)
- ❌ `ab@test.com` (local part too short)

### Login Code Requirements
- Minimum: 6 characters
- Maximum: 15 characters
- Stored securely in Firebase Auth (not in Realtime Database)

### Verification Security
- Verification links work via Firebase secure domain
- Links expire after set time
- Rate limiting on resend attempts
- Requires login code to resend verification

## User Messages

### Registration Success
```
Account created successfully!

A verification email has been sent to your-email@example.com.

Important: You must verify your email within 48 hours by clicking
the link in the email. After verification, you can login.

If you don't verify within 48 hours, you may need to contact
support to complete registration.
```

### Login - Unverified Email
```
Your email is not verified. Please check your inbox and click
the verification link. Use "Resend Verification Email" if needed.
```

### Email Already Registered
```
This email is already registered. If you registered recently but
haven't verified, check your email for the verification link.
If the email doesn't belong to you or you need help, please
contact support.
```

## Troubleshooting

### User Can't Find Verification Email
1. Check spam/junk folder
2. Use "Resend Verification Email" button (appears after failed login)
3. Verify email address spelling
4. Wait a few minutes and check again

### Email Already Taken
1. If you registered recently, check email for verification link
2. If email doesn't belong to you, contact support
3. Admin can manually delete unverified accounts

### Verification Link Expired
1. Try to login (will fail)
2. Click "Resend Verification Email"
3. Enter login code when prompted
4. New email will be sent

## Admin Tasks

### Manual Cleanup of Unverified Accounts
Currently requires Firebase Console access:
1. Go to Firebase Console → Authentication
2. Filter by "Email not verified"
3. Sort by creation date
4. Delete accounts older than 48 hours with unverified emails

### Future: Automated Cleanup
Implement the Cloud Function shown above to automatically delete old unverified accounts.

## Related Files

- `src/scripts/login.js` - Main authentication logic, sets `emailVerified: true` on successful login
- `src/components/Login.vue` - Login/registration UI
- `src/scripts/users.js` - User management, filters to show only verified users
- `src/scripts/groups.js` - Group management, filters to show only verified users for member selection
- `src/firebase.js` - Firebase configuration
- `src/assets/validation-rules.js` - Form validation rules

## Database Schema

### User Object in Realtime Database

```json
{
  "users": {
    "03001234567": {
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "03001234567",
      "emailVerified": true,
      "addedBy": "03009876543"
    }
  }
}
```

**Note:** Login codes are NOT stored in the database. They are only stored in Firebase Authentication for security.
