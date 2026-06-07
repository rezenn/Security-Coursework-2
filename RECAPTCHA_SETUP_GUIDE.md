# Complete Setup Guide for reCAPTCHA & Email Verification

## Part 1: Get Google reCAPTCHA v3 Keys

### Step 1: Go to reCAPTCHA Admin Console

Visit: https://www.google.com/recaptcha/admin

### Step 2: Create New reCAPTCHA

1. Click **"Create"** or **"+"** button
2. Fill in the form:
   - **Label**: `GyanKosh` (or your app name)
   - **reCAPTCHA type**: Select **v3**
   - **Domains**: Add these:
     - `localhost` (for development)
     - `127.0.0.1` (for local testing)
     - Your production domain when deployed
3. Accept terms and click **Create**

### Step 3: Copy Your Keys

You will see two keys. **Save these carefully**:

```
Site Key (public): 6Lc....... (use in frontend)
Secret Key (private): 6Lc....... (use in backend)
```

---

## Part 2: Setup Backend Environment Variables

### File Location

`e:\semester 6\Security\CW2\server\.env`

Already created with template. **Update these values**:

```env
# ============================================================================
# RECAPTCHA (Google reCAPTCHA v3)
# ============================================================================
RECAPTCHA_SECRET_KEY=6Lc_YOUR_SECRET_KEY_FROM_GOOGLE_HERE
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc_YOUR_SITE_KEY_FROM_GOOGLE_HERE

# ============================================================================
# EMAIL / SMTP CONFIGURATION (for sending verification codes)
# ============================================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@gyankosh.com
EMAIL_SEND_IN_DEVELOPMENT=true
```

**For Gmail Users:**

1. Enable 2FA on your Google account
2. Generate an **App Password**: https://myaccount.google.com/apppasswords
3. Use that password in `EMAIL_PASS`

---

## Part 3: Setup Frontend Environment Variables

### File Location

`e:\semester 6\Security\CW2\client\.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc_YOUR_SITE_KEY_FROM_GOOGLE_HERE
```

---

## Part 4: How Email Codes Are Sent/Received

### When User Registers

1. User submits: email, username, password
2. Backend automatically:
   - Generates 6-digit **verification code** (e.g., `123456`)
   - Generates **verification token** (64-character string)
   - Stores both in database (hashed)
   - Sends email with:
     - Your 6-digit code
     - Link to click
3. Email received looks like:

   ```
   From: noreply@gyankosh.com
   Subject: Verify your Gyankosh account

   Welcome, john123!

   Please verify your email address to activate your account.

   Your verification code is 123456

   [VERIFY EMAIL ADDRESS BUTTON]

   Or copy this link: http://localhost:3000/verify?token=abc123...
   ```

### When User Verifies Email - Two Options

**Option A: Click Link**

- Click the link in email
- Automatically verified
- Redirected to verify success page

**Option B: Manual Code Entry**

- Go to `http://localhost:3000/verify`
- Enter email: `user@example.com`
- Enter code: `123456`
- Click Verify

---

## Part 5: How reCAPTCHA Token Works

### Frontend Flow

1. User fills login/register form
2. Clicks submit button
3. JavaScript automatically calls Google reCAPTCHA API
4. reCAPTCHA returns a token (invisible to user)
5. Token sent with form data to backend

### Backend Flow

1. Backend receives request with `captchaToken`
2. Sends token to Google API with secret key
3. Google verifies token
4. If valid: continue (score > 0.5)
5. If invalid: return 400 error "Captcha verification failed"

### Token Types

- **reCAPTCHA v3**: Invisible, returns score 0.1-1.0
  - 1.0 = human interaction
  - 0.1 = bot-like
  - Threshold: 0.5 (configurable)

---

## Part 6: Testing in Postman

### 1️⃣ Register

**Endpoint**: `POST http://localhost:5000/api/auth/register`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "testuser@example.com",
  "username": "testuser",
  "password": "SecurePassword123!",
  "captchaToken": "test-token-or-real-token"
}
```

**What Happens**:

- ✅ User created
- 📧 Email sent with code (check your email or logs)
- 📝 Response includes verification code in logs/email

---

### 2️⃣ Get Verification Code

**Where to find it**:

**Option A: Check Logs**

```
If you set EMAIL_SEND_IN_DEVELOPMENT=true, code printed to server logs
[DEV EMAIL] To: testuser@example.com | Code: 123456
```

**Option B: Check Your Email**

- Open inbox for `testuser@example.com`
- Find email from `noreply@gyankosh.com`
- Look for: "Your verification code is **123456**"

**Option C: Database Query** (if you have MongoDB access)

```javascript
db.users.findOne(
  { email: "testuser@example.com" },
  { emailVerificationCode: 1 },
);
```

---

### 3️⃣ Verify Email with Code

**Endpoint**: `POST http://localhost:5000/api/auth/verify-email`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "testuser@example.com",
  "code": "123456"
}
```

**Response** (success):

```json
{
  "message": "Email successfully verified."
}
```

---

### 4️⃣ Login

**Endpoint**: `POST http://localhost:5000/api/auth/login`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!",
  "captchaToken": "test-token-or-real-token"
}
```

**Response** (success):

```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "expiresIn": "15m",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "username": "testuser",
    "role": "user",
    "isEmailVerified": true
  }
}
```

---

### 5️⃣ Request Password Reset

**Endpoint**: `POST http://localhost:5000/api/auth/request-password-reset`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "testuser@example.com",
  "captchaToken": "test-token-or-real-token"
}
```

**What Happens**:

- 📧 Email sent with:
  - 6-digit reset code (e.g., `654321`)
  - Reset link

---

### 6️⃣ Get Reset Code

**Where to find it**: Same as verification code

- Check server logs
- Check email inbox
- Database if you have access

---

### 7️⃣ Reset Password with Code

**Endpoint**: `POST http://localhost:5000/api/auth/reset-password`

**Headers**:

```
Content-Type: application/json
```

**Body** (raw JSON):

```json
{
  "email": "testuser@example.com",
  "code": "654321",
  "password": "NewSecurePassword456!",
  "captchaToken": "test-token-or-real-token"
}
```

**Response** (success):

```json
{
  "message": "Password reset successfully"
}
```

---

## Part 7: Testing reCAPTCHA

### During Development

**reCAPTCHA is DISABLED** if:

- `RECAPTCHA_SECRET_KEY` is not set in `.env`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is not set

**To Test reCAPTCHA**:

1. Set both keys in `.env`
2. Restart server: `npm run dev`
3. Try requests WITHOUT `captchaToken` → Should fail with 400
4. Try requests WITH `captchaToken` → Should work

### Real vs Test Tokens

**Test Token** (always passes):

```
Use any string when reCAPTCHA is enabled but Google returns mock response
```

**Real Token** (from Google):

```javascript
// Generated by the hook automatically in frontend
window.grecaptcha.execute(siteKey, { action: "submit" });
```

---

## Part 8: Troubleshooting

### Problem: "Captcha token is required"

- ✅ Solution: Make sure you include `captchaToken` in request body

### Problem: "Captcha verification failed"

- ✅ Check `RECAPTCHA_SECRET_KEY` is correct
- ✅ Check token is not expired (tokens expire after ~120 seconds)
- ✅ Check frontend has correct `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

### Problem: Email not arriving

- ✅ Check `EMAIL_SEND_IN_DEVELOPMENT=true` in `.env`
- ✅ Check SMTP credentials (host, port, user, pass)
- ✅ Check server logs for email sending status
- ✅ Gmail requires app-specific password, not regular password

### Problem: Code not showing in logs

- ✅ Make sure `EMAIL_SEND_IN_DEVELOPMENT=true`
- ✅ Check server terminal output
- ✅ Code format: 6 digits (e.g., `123456`)

### Problem: Frontend reCAPTCHA script not loading

- ✅ Check browser console for errors
- ✅ Make sure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in `.env.local`
- ✅ Restart frontend dev server: `npm run dev` in `client` folder

---

## Quick Start Checklist

- [ ] Get reCAPTCHA keys from Google
- [ ] Create `server/.env` with reCAPTCHA keys
- [ ] Create `client/.env.local` with site key
- [ ] Set up Gmail app password (if using Gmail)
- [ ] Start backend: `npm run dev` in `server` folder
- [ ] Start frontend: `npm run dev` in `client` folder
- [ ] Test register endpoint
- [ ] Check email/logs for verification code
- [ ] Verify email with code
- [ ] Test login
- [ ] Test password reset flow

---

## Architecture Summary

```
User Register
    ↓
[Frontend] - captchaToken generated by reCAPTCHA hook
    ↓
POST /api/auth/register
    ↓
[Backend] - verifyRecaptcha middleware
    ↓
Google API - verify captchaToken
    ↓
Create user + generate code + send email
    ↓
Email contains: code + link
    ↓
User clicks link OR enters code manually
    ↓
Email verified ✅
    ↓
User can now login
```

---

Need help? Check:

- Server logs: `e:\semester 6\Security\CW2\server\logs\`
- Frontend console: Browser DevTools > Console
- `.env` files for typos or missing values
