# GyanKosh - Modern Authentication System

## 📋 Overview

A complete, secure, and modern authentication system built with Next.js (frontend) and Express + Node.js (backend). Features include:

- ✅ **Email Verification** (via 6-digit codes and token links)
- ✅ **reCAPTCHA v3** (bot protection)
- ✅ **Multi-Factor Authentication (MFA)** (TOTP + Backup codes)
- ✅ **Password Reset** (with email verification)
- ✅ **Rate Limiting & Account Lockout** (after 5 failed attempts)
- ✅ **JWT Tokens** (with refresh token rotation)
- ✅ **Modern UI** (GitHub/Google-style design)
- ✅ **Security Headers** (Helmet, CORS, CSRF)
- ✅ **Comprehensive Logging** (security events)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas connection string)
- Gmail account with App Password (for email sending)
- reCAPTCHA v3 keys from Google

### Backend Setup

```bash
cd server
npm install

# Create .env file with the following:
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/gyankosh

JWT_ACCESS_SECRET=your-secret-key-min-64-chars
JWT_REFRESH_SECRET=your-secret-key-min-64-chars
ENCRYPTION_KEY=32-character-encryption-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

FRONTEND_URL=http://localhost:3000
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install

# Create .env.local file:
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔐 Security Features

### 1. Email Verification

Users must verify their email before logging in:

- **6-digit OTP code** sent to email (expires in 24 hours)
- **64-character token** generated simultaneously
- Users can verify via email link OR by entering the code manually

### 2. reCAPTCHA v3

Protects against automated bot attacks on:

- Registration (`POST /api/auth/register`)
- Login (`POST /api/auth/login`)
- Password reset (`POST /api/auth/request-password-reset`)

**Testing**: Use `captchaToken: "test-token"` in development mode.

### 3. Multi-Factor Authentication (MFA)

Optional but recommended:

- **TOTP** (Time-based One-Time Password) via authenticator apps
- **Backup codes** (10 codes per account, hashed with bcryptjs)
- **MFA flow**: Login returns `MFA_REQUIRED` status with tempToken, user enters code on separate screen

### 4. Password Security

- Minimum **12 characters** required
- Must include: uppercase, lowercase, number, special character
- Previous passwords tracked (no reuse within 5 previous passwords)
- Password expires after **90 days**
- Bcryptjs hashing with **12 salt rounds**

### 5. Account Lockout

- **5 failed login attempts** trigger 30-minute lockout
- IP address and user agent tracked
- Security alert email sent on suspicious activity

### 6. Token Security

- **Access tokens**: 15-minute expiry
- **Refresh tokens**: 7-day expiry (httpOnly, secure, SameSite=strict)
- **Session tracking**: Active refresh token list maintained per user
- **Token rotation**: New refresh token issued on each refresh

### 7. CORS Protection

- Frontend domain whitelisted
- Credentials restricted to same-site
- Methods whitelist applied (GET, POST, PATCH, DELETE)

### 8. CSRF Protection

- Enabled in production environment
- Tokens validated on state-changing requests

### 9. Security Headers

- Helmet.js configured
- Content-Security-Policy enabled
- X-Frame-Options: DENY
- Strict-Transport-Security configured

---

## 📱 API Endpoints

### Authentication Routes

#### Register User

```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "captchaToken": "recaptcha-token"
}
Response: { message, user: { id, email, username } }
```

#### Login

```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "SecurePass123!",
  "mfaToken": "123456" (optional, required if MFA enabled),
  "captchaToken": "recaptcha-token"
}
Response:
- If MFA required: { error: "MFA_REQUIRED", tempToken, mfaRequired: true }
- If successful: { accessToken, expiresIn, user: { ...} }
```

#### Verify Email (via link)

```
GET /api/auth/verify-email/:token
Response: { message: "Email verified" }
```

#### Verify Email (via code)

```
POST /api/auth/verify-email
Body: {
  "email": "user@example.com",
  "code": "123456"
}
Response: { message: "Email verified" }
```

#### Request Password Reset

```
POST /api/auth/request-password-reset
Body: {
  "email": "user@example.com",
  "captchaToken": "recaptcha-token"
}
Response: { message: "Reset link sent" }
```

#### Reset Password

```
POST /api/auth/reset-password/:token
Body: {
  "password": "NewSecurePass123!",
  "captchaToken": "recaptcha-token"
}
Response: { message: "Password updated" }
```

#### Setup MFA

```
POST /api/auth/mfa/setup
Headers: Authorization: Bearer <access-token>
Response: { secret, qrCode, backupCodes }
```

#### Confirm MFA

```
POST /api/auth/mfa/confirm
Body: { "token": "123456" }
Headers: Authorization: Bearer <access-token>
Response: { message: "MFA enabled", backupCodes: [] }
```

#### Refresh Token

```
POST /api/auth/refresh
Cookies: refreshToken=<token>
Response: { accessToken, expiresIn }
```

#### Logout

```
POST /api/auth/logout
Headers: Authorization: Bearer <access-token>
Response: { message: "Logged out" }
```

---

## 🧪 Testing Guide

### 1. Test Email Verification

**Scenario**: Register and verify via email code

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePass123!",
    "captchaToken": "test-token"
  }'

# 2. Check email for 6-digit code (e.g., 123456)

# 3. Verify with code
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "code": "123456"
  }'

# Expected: { message: "Email verified successfully" }
```

### 2. Test reCAPTCHA (Development Mode)

**Note**: In development, use `"captchaToken": "test-token"` to bypass real reCAPTCHA verification.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "captchaToken": "test-token"
  }'
```

### 3. Test MFA Flow

```bash
# 1. Login (will return MFA_REQUIRED if MFA is enabled)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "captchaToken": "test-token"
  }'

# Response: { error: "MFA_REQUIRED", tempToken: "...", mfaRequired: true }

# 2. Get TOTP code from authenticator app (or generate via endpoint)

# 3. Login with MFA token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "mfaToken": "123456",
    "captchaToken": "test-token"
  }'

# Expected: { accessToken: "...", expiresIn: 900, user: {...} }
```

### 4. Test Account Lockout

```bash
# Make 5 failed login attempts with wrong password
for i in {1..5}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "WrongPassword123!",
      "captchaToken": "test-token"
    }'
done

# 6th attempt: { error: "Account locked due to repeated failed login attempts" }
```

### 5. Test Password Reset

```bash
# 1. Request password reset
curl -X POST http://localhost:5000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "captchaToken": "test-token"
  }'

# 2. Check email for reset token (extract from link)

# 3. Reset password
curl -X POST http://localhost:5000/api/auth/reset-password/RESET_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "password": "NewSecurePass123!",
    "captchaToken": "test-token"
  }'
```

---

## 🎨 Modern UI Design

The authentication screens now follow modern design patterns (similar to GitHub/Google):

### Pages Included

1. **Sign In** - Clean login form with email/password
2. **Sign Up** - Registration with validation
3. **Verify Email** - Email verification with code input
4. **Forgot Password** - Request password reset
5. **Reset Password** - New password input with validation
6. **MFA Verification** - TOTP code input (appears after login if MFA enabled)
7. **Profile** - User profile and settings

### Design Features

- ✅ Clean white cards with rounded corners
- ✅ Blue accent color (#2563eb)
- ✅ Responsive layout (mobile-first)
- ✅ Smooth transitions and hover effects
- ✅ Error/success/info alert messages
- ✅ Loading states on buttons
- ✅ Accessible form inputs

---

## 🔒 Security Audit Results

See [SECURITY_REPORT.md](./SECURITY_REPORT.md) for comprehensive security assessment including:

- ✅ OWASP Top 10 protections
- ✅ Vulnerability prevention matrix
- ✅ API endpoint security checklist
- ✅ Production deployment checklist
- ✅ Testing commands for security features

---

## 📁 Project Structure

```
CW2/
├── client/                          # Next.js frontend
│   ├── app/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify/page.tsx
│   │   ├── request-password-reset/page.tsx
│   │   ├── reset-password/[token]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── mfa/page.tsx
│   │   ├── components/
│   │   │   ├── AuthComponents.tsx   # Reusable auth UI components
│   │   │   ├── AppShell.tsx
│   │   ├── hooks/
│   │   │   ├── useRecaptcha.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── .env.local                   # Frontend env variables
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.config.ts
│   │   │   └── database.config.ts
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── recaptcha.middleware.ts
│   │   ├── models/
│   │   │   └── user.model.ts
│   │   ├── services/
│   │   │   ├── token.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── mfa.service.ts
│   │   │   ├── password.service.ts
│   │   └── routes/
│   │   │   └── auth.routes.ts
│   │   ├── types/
│   │   ├── utils/
│   │   │   └── logger.utils.ts
│   │   └── index.ts
│   ├── .env                         # Backend env variables
│   ├── .env.example                 # Environment template
│   └── package.json
│
├── SECURITY_REPORT.md               # Security audit report
└── README.md                        # This file
```

---

## 🛠️ Configuration

### Environment Variables

**Backend (.env)**

```
NODE_ENV=development|production
PORT=5000
DATABASE_URL=mongodb+srv://...

JWT_ACCESS_SECRET=min-64-chars
JWT_REFRESH_SECRET=min-64-chars
ENCRYPTION_KEY=32-char-key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

---

## 🚀 Deployment (Production)

### Backend

1. Set `NODE_ENV=production`
2. Use strong JWT secrets (64+ characters)
3. Enable HTTPS (set `secure` flag on cookies)
4. Use MongoDB Atlas connection string
5. Configure real reCAPTCHA keys
6. Set up email service credentials
7. Deploy to Heroku, Vercel, or AWS

### Frontend

1. Build: `npm run build`
2. Deploy to Vercel, Netlify, or static host
3. Ensure API_URL points to production backend

---

## 🧑‍💻 Troubleshooting

### Email not sending?

- Check SMTP credentials
- Verify Gmail App Password is set
- Enable EMAIL_SEND_IN_DEVELOPMENT flag

### reCAPTCHA verification failing?

- In development: Use `captchaToken: "test-token"`
- In production: Verify reCAPTCHA keys are correct
- Check domain is registered in reCAPTCHA console

### Database connection issues?

- Verify MongoDB connection string
- Check network access rules (Atlas)
- Ensure MongoDB service is running (local)

### MFA not working?

- Ensure authenticator app is synced with server time
- Verify TOTP secret was properly scanned
- Check backup codes are available

---

## 📚 Dependencies

### Backend

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT signing
- **bcryptjs** - Password hashing
- **speakeasy** - TOTP generation
- **express-validator** - Input validation
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **nodemailer** - Email sending

### Frontend

- **next** - React framework
- **react** - UI library
- **typescript** - Type safety
- **tailwindcss** - CSS utilities

---

## 📝 License

Confidential - Educational Project

---

## 👤 Author

Security CW2 Project
