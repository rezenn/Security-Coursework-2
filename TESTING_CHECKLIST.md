# GyanKosh Testing Checklist

## Pre-Testing Setup

- [ ] Backend running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] `.env` file configured in server
- [ ] `.env.local` file configured in client
- [ ] MongoDB connection working
- [ ] Gmail SMTP configured (or email sending disabled)

---

## ✅ Registration & Email Verification

### Test 1: Basic Registration

- [ ] Go to `http://localhost:3000/register`
- [ ] Enter: email, username, password (12+ chars, mixed case, number, special char)
- [ ] Click "Create Account"
- [ ] Check browser console for any errors
- [ ] Should see success message
- [ ] Should redirect to verify page

### Test 2: Email Verification via Code

- [ ] After registration, go to `http://localhost:3000/verify`
- [ ] Enter email and check server logs for 6-digit code (printed)
- [ ] Enter the 6-digit code
- [ ] Click "Verify Email"
- [ ] Should see success and redirect to login

### Test 3: Email Verification via Link

- [ ] Register a new account
- [ ] Check server logs for verification link token
- [ ] Copy token and paste into URL: `/verify?token=YOUR_TOKEN`
- [ ] Should verify automatically

### Test 4: Duplicate Email Prevention

- [ ] Try registering with same email
- [ ] Should see error message
- [ ] Email should not be duplicated in database

---

## 🔐 Login & MFA

### Test 5: Basic Login (No MFA)

- [ ] Go to `/login`
- [ ] Enter verified email and password
- [ ] Click "Sign In"
- [ ] Should redirect to profile page
- [ ] Should see access token in localStorage

### Test 6: Login with MFA

- [ ] Go to user's profile and enable MFA setup
- [ ] Scan QR code with authenticator app
- [ ] Enter TOTP code to confirm
- [ ] Save backup codes
- [ ] Logout
- [ ] Try login again
- [ ] Should see "Two-Factor Authentication" screen (MFA_REQUIRED status)
- [ ] Enter TOTP code from authenticator
- [ ] Should complete login and redirect to profile

### Test 7: Failed Login Attempts

- [ ] Try login with correct email, wrong password 5 times
- [ ] After 5 attempts, should see "Account locked" message
- [ ] Wait 30 minutes or check database for unlock
- [ ] Should be able to login again after timeout

### Test 8: Wrong MFA Code

- [ ] During MFA verification, enter wrong 6-digit code
- [ ] Should see error "Invalid MFA token"
- [ ] Should allow retry

### Test 9: Backup Code Usage

- [ ] During login after MFA_REQUIRED, enter a backup code instead of TOTP
- [ ] Should successfully authenticate
- [ ] Backup code should be marked as used (one-time only)

---

## 🔄 Password Reset

### Test 10: Password Reset Request

- [ ] Go to `/request-password-reset`
- [ ] Enter email
- [ ] Click "Send Reset Link"
- [ ] Should see success message
- [ ] Check server logs for reset token

### Test 11: Password Reset via Link

- [ ] Copy reset token from logs
- [ ] Go to `/reset-password/TOKEN`
- [ ] Enter new password
- [ ] Click "Reset Password"
- [ ] Should see success and redirect to login
- [ ] Login with new password should work
- [ ] Old password should NOT work

### Test 12: Password Reset via Code

- [ ] Request password reset
- [ ] Extract code from server logs (6-digit)
- [ ] Go to verify page with email and code
- [ ] Reset should work

### Test 13: Invalid Reset Token

- [ ] Try accessing `/reset-password/invalid-token`
- [ ] Should see "Invalid Reset Link" message
- [ ] Should show option to request new link

---

## 🤖 reCAPTCHA Protection

### Test 14: reCAPTCHA on Register

- [ ] Go to registration page
- [ ] Open browser DevTools → Network tab
- [ ] Register account
- [ ] Check network request for `captchaToken` in body
- [ ] Should see reCAPTCHA call (or "test-token" in dev)

### Test 15: reCAPTCHA on Login

- [ ] Go to login page
- [ ] Login
- [ ] Should include reCAPTCHA token
- [ ] Login should succeed with "test-token" in development

### Test 16: reCAPTCHA on Password Reset

- [ ] Go to password reset request page
- [ ] Submit
- [ ] Should include reCAPTCHA token
- [ ] Should work with "test-token" in development

---

## 🛡️ Security Features

### Test 17: Password Policy

- [ ] Try register with password < 12 chars
- [ ] Should see validation error
- [ ] Try password without uppercase
- [ ] Should see validation error
- [ ] Try password without number
- [ ] Should see validation error
- [ ] Try password without special character
- [ ] Should see validation error

### Test 18: HTTPS Enforcement (Production)

- [ ] In production, access via HTTP
- [ ] Should redirect to HTTPS
- [ ] Cookies should have `secure` flag

### Test 19: Session Management

- [ ] Login to get access token
- [ ] Use access token to fetch profile
- [ ] Should work
- [ ] Wait 15+ minutes (access token expiry)
- [ ] Try accessing profile again
- [ ] Should fail with 401
- [ ] Call refresh endpoint
- [ ] Should get new access token
- [ ] Profile access should work again

### Test 20: CORS Protection

- [ ] From browser console on different domain:

```javascript
fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "...", password: "..." }),
});
```

- [ ] Should fail with CORS error

---

## 📝 API Testing (Postman/curl)

### Test 21: Register via API

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "username":"testuser",
    "password":"SecurePass123!",
    "captchaToken":"test-token"
  }'
```

- [ ] Should return user data with `id`, `email`, `username`

### Test 22: Login via API

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "password":"SecurePass123!",
    "captchaToken":"test-token"
  }'
```

- [ ] Should return `accessToken`, `expiresIn`, `user`

### Test 23: Verify Email via Code

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "code":"123456"
  }'
```

- [ ] Should return success message

### Test 24: Request Password Reset

```bash
curl -X POST http://localhost:5000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "captchaToken":"test-token"
  }'
```

- [ ] Should return success message

### Test 25: Reset Password

```bash
curl -X POST http://localhost:5000/api/auth/reset-password/TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "password":"NewPass123!",
    "captchaToken":"test-token"
  }'
```

- [ ] Should return success message

---

## 🎨 UI/UX Testing

### Test 26: Responsive Design

- [ ] Open app on mobile device (or mobile DevTools)
- [ ] All forms should be readable
- [ ] Buttons should be clickable
- [ ] No horizontal scrolling

### Test 27: Error Messages

- [ ] Try invalid email format
- [ ] Should show clear error message
- [ ] Try submitting empty form
- [ ] Should show validation errors
- [ ] Try duplicate email on register
- [ ] Should show "Email already exists"

### Test 28: Loading States

- [ ] During login, button should show "Signing in..."
- [ ] Should be disabled during submission
- [ ] After completion, should return to normal state

### Test 29: Success Messages

- [ ] After registration, should show success alert
- [ ] After email verification, should show success and redirect
- [ ] After password reset, should show success and redirect

### Test 30: Navigation

- [ ] From login page, can access register via link
- [ ] From register page, can access login via link
- [ ] From login page, can access password reset via link
- [ ] All navigation links work correctly

---

## 📊 Database Verification

### Test 31: User Record Created

```bash
# In MongoDB
db.users.findOne({ email: "test@test.com" })
```

- [ ] Should have `email`, `username`, `password_hash`
- [ ] Password should be hashed (bcryptjs)
- [ ] Should have `isEmailVerified: true/false`
- [ ] Should have `createdAt` timestamp

### Test 32: Session Records

```bash
# In MongoDB
db.sessions.find({ userId: "..." })
```

- [ ] Should have record for active session
- [ ] Should have `refreshTokenHash`, `ipAddress`, `userAgent`
- [ ] Should have `expiresAt` timestamp

### Test 33: Security Logs

```bash
# In MongoDB or log files
```

- [ ] Should have login attempt logged
- [ ] Should have IP address tracked
- [ ] Should have failed attempts tracked
- [ ] Should have password reset logged

---

## 🔍 Production Checklist

- [ ] NODE_ENV set to `production`
- [ ] JWT secrets are 64+ characters
- [ ] MongoDB Atlas connection string configured
- [ ] Real reCAPTCHA keys configured
- [ ] HTTPS enabled
- [ ] Cookies marked as `secure` and `httpOnly`
- [ ] CORS configured for production domain only
- [ ] Email service configured (not in dev mode)
- [ ] Logs stored and rotated properly
- [ ] Error tracking (Sentry/similar) configured

---

## 🚀 Performance Testing

### Test 34: Response Time

- [ ] Login request should complete < 1 second
- [ ] Register request should complete < 2 seconds
- [ ] Profile fetch should complete < 500ms

### Test 35: Load Testing

- [ ] Send 100 concurrent requests
- [ ] Rate limiter should activate
- [ ] Server should not crash
- [ ] Graceful error responses

---

## ✨ Final Validation

- [ ] All tests passed
- [ ] No console errors
- [ ] No network errors
- [ ] All security features working
- [ ] UI matches design mockup
- [ ] Performance acceptable
- [ ] Ready for deployment

---

## 📝 Notes

**Common Issues & Solutions:**

| Issue             | Solution                                                   |
| ----------------- | ---------------------------------------------------------- |
| Email not sending | Check SMTP credentials, verify Gmail app password          |
| reCAPTCHA failing | Use "test-token" in dev, verify keys in production         |
| Account locked    | Wait 30 min or manually update `lockedUntil` in DB         |
| MFA not working   | Ensure authenticator app time is synced, check server logs |
| CORS errors       | Verify `FRONTEND_URL` matches actual frontend URL          |
| Database errors   | Check MongoDB connection string, network access            |

---

Last Updated: 2026-06-07
Test Suite Version: 1.0
