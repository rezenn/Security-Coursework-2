# GyanKosh — Secure Course Selling Platform

> **ST6005CEM Security Coursework 2**  
> Student: Rijen Khadgi | Softwarica College of IT & E-Commerce (Coventry University)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Running the App](#5-running-the-app)
6. [Creating an Admin](#6-creating-an-admin)
7. [Khalti Payment Setup](#7-khalti-payment-setup)
8. [Security Features](#8-security-features)
9. [Role-Based Access Control](#9-role-based-access-control)
10. [API Reference](#10-api-reference)
11. [Docker & CI/CD](#11-docker--cicd)
12. [Penetration Testing Guide](#12-penetration-testing-guide)
13. [Commit Strategy](#13-commit-strategy)
14. [References](#14-references)

---

## 1. Overview

**GyanKosh** (Nepali: *gyan* = knowledge, *kosh* = treasury) is a secure online course-selling platform where users can register, browse courses, pay via Khalti, and access learning content. Admins manage users, courses, transactions, and security logs through a dedicated panel.

**Security-first design decisions:**
- Every feature is threat-modelled (STRIDE)
- Zero-trust: no implicit trust between services or roles
- Payments verified server-side with HMAC integrity checks
- All sensitive data encrypted at rest (AES-256-GCM)

---

## 2. Tech Stack

| Layer | Choice | Security Reason |
|-------|--------|----------------|
| Frontend | Next.js 14 (App Router) | SSR reduces XSS surface; strict CSP |
| Backend | Express + TypeScript | Type safety eliminates runtime bugs |
| Database | MongoDB Atlas + Mongoose | `express-mongo-sanitize` blocks NoSQL injection |
| Auth | JWT HS256 + HttpOnly cookies | Short-lived access tokens + refresh rotation |
| MFA | TOTP (speakeasy) + backup codes | RFC 6238; secrets AES-256-GCM encrypted |
| Payments | Khalti (Nepal) + HMAC | Amount integrity verified server-side |
| Passwords | bcrypt cost 12 + zxcvbn | Adaptive hashing; real-time strength feedback |
| Rate limiting | express-rate-limit + IP allowlist | Brute-force prevention per endpoint |
| Logging | Winston daily-rotate | Structured JSON; sensitive data redacted |
| CI/CD | GitHub Actions | TypeScript + ESLint (SAST) + npm audit + Gitleaks |
| Containers | Docker + docker-compose | Reproducible; non-root users |

---

## 3. Folder Structure

```
gyankosh/
├── .github/
│   └── workflows/
│       └── ci.yml                        # TypeCheck → ESLint → npm audit → Gitleaks → Docker
├── client/                               # Next.js 14 frontend
│   ├── app/
│   │   ├── (auth)/                       # Auth pages (two-column layout, no sidebar)
│   │   │   ├── layout.tsx                # Branding left, form right
│   │   │   ├── login/page.tsx            # Login + MFA prompt + reCAPTCHA v3
│   │   │   ├── register/page.tsx         # Register + zxcvbn password meter
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/[token]/page.tsx
│   │   │   ├── verify-email/page.tsx     # Auto-verify on load
│   │   │   └── mfa-setup/page.tsx        # QR code + backup codes + confirm
│   │   ├── admin/                        # Admin panel (role=admin only)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                  # Stats + quick links
│   │   │   ├── users/page.tsx            # Search, activate/deactivate, delete
│   │   │   ├── courses/page.tsx          # Create, edit, publish/unpublish, delete
│   │   │   ├── transactions/page.tsx     # Khalti transactions + revenue
│   │   │   └── logs/page.tsx             # Live audit log viewer, filterable
│   │   ├── dashboard/                    # User dashboard (role=user)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                  # Stats, enrolled courses, recent payments
│   │   ├── courses/
│   │   │   └── page.tsx                  # Browse + filter + Khalti buy button
│   │   ├── payment/
│   │   │   └── verify/page.tsx           # Khalti callback — verify pidx → enrol
│   │   ├── profile/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                  # Edit profile, password, MFA, GDPR export
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                      # Landing page (redirects if logged in)
│   ├── components/
│   │   ├── shared/
│   │   │   ├── index.tsx                 # Spinner, ErrorAlert, Avatar, RoleBadge, StatCard
│   │   │   └── Sidebar.tsx               # Role-aware nav (user vs admin)
│   │   └── ui/
│   │       └── PasswordStrengthMeter.tsx # zxcvbn bar + policy checklist
│   ├── context/
│   │   └── authContext.tsx               # Auth state; fetches fresh /me after login
│   ├── hooks/
│   │   └── useRequireAuth.ts             # Route guard with role check
│   ├── lib/
│   │   ├── api/
│   │   │   ├── axios.ts                  # Axios instance + auto refresh interceptor
│   │   │   ├── endpoints.ts              # All API constants
│   │   │   └── index.ts                  # authApi, courseApi, profileApi, paymentApi, adminApi
│   │   └── utils/
│   │       └── password.ts               # Client-side policy + zxcvbn
│   ├── .env.local
│   ├── Dockerfile
│   ├── next.config.js                    # .js not .ts (Next.js 14 requirement)
│   ├── package.json
│   ├── postcss.config.js                 # CommonJS syntax (not ESM)
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── server/                               # Express + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.config.ts             # Typed env with Khalti config
│   │   │   └── database.config.ts        # Mongoose connect
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts        # Register, login, MFA, refresh, logout
│   │   │   ├── course.controller.ts      # CRUD + lesson management
│   │   │   ├── profile.controller.ts     # Update, change-password, export
│   │   │   ├── transaction.controller.ts # Khalti initiate + verify
│   │   │   └── admin.controller.ts       # Users, stats, audit logs
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts        # requireAuth, requireRole, requireAdmin
│   │   │   ├── error.middleware.ts       # Global — never leaks stack traces
│   │   │   ├── rateLimiter.middleware.ts # Global + login + payment limiters
│   │   │   ├── recaptcha.middleware.ts   # reCAPTCHA v3 (enabled in prod)
│   │   │   └── validation.middleware.ts  # express-validator result handler
│   │   ├── models/
│   │   │   ├── user.model.ts             # RBAC, MFA, password history, sessions
│   │   │   ├── course.model.ts           # ILesson extends Document (toObject fix)
│   │   │   └── transaction.model.ts      # pidx (Khalti), HMAC signature
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── index.ts                  # courses, profile, payments, admin
│   │   ├── services/
│   │   │   ├── email.service.ts          # Nodemailer — verify, reset, alerts
│   │   │   ├── mfa.service.ts            # speakeasy + AES-256-GCM secrets
│   │   │   ├── password.service.ts       # zxcvbn + policy validation
│   │   │   ├── token.service.ts          # JWT access/refresh
│   │   │   └── transaction.service.ts    # Khalti initiate + verify + HMAC
│   │   ├── types/express/index.d.ts      # req.user type augmentation
│   │   ├── utils/logger.utils.ts         # Winston + audit logger
│   │   └── server.ts                     # Bootstrap — inline XSS sanitizer
│   ├── .env                              # Secrets (never commit)
│   ├── .env.example                      # Template (safe to commit)
│   ├── .eslintrc.json
│   ├── Dockerfile
│   ├── nodemon.json                      # --transpile-only for fast dev
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 4. Environment Variables

### `server/.env`

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/gyankosh

# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<64-char-hex-different>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

COOKIE_SECRET=<32-char-random>
ENCRYPTION_KEY=<exactly-32-chars>

# Khalti (https://admin.khalti.com → Developer → Keys)
KHALTI_SECRET_KEY=your_khalti_live_secret_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM=GyanKosh <your@gmail.com>
EMAIL_SEND_IN_DEVELOPMENT=true

APP_NAME=GyanKosh
FRONTEND_URL=http://localhost:3000

RECAPTCHA_SECRET_KEY=6LeeMhEtAAAAAB45Kaw4H3t-ErYeGp9Hmu6AF7_J

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
LOGIN_RATE_LIMIT_WINDOW_MS=900000
IP_ALLOWLIST=127.0.0.1,::1
```

### `client/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6LeeMhEtAAAAAKAQL5QzxCH3doxoNLNlzfzOhvHa
```

---

## 5. Running the App

### Development

```bash
# Terminal 1 — Server
cd server
npm install
npm run dev          # nodemon → ts-node --transpile-only → :5000

# Terminal 2 — Client
cd client
npm install
npm run dev          # Next.js dev server → :3000
```

### Docker

```bash
# From project root
docker-compose up --build
# Server: http://localhost:5000/api/health
# Client: http://localhost:3000
```

---

## 6. Creating an Admin

There is no public admin registration — admins are set manually in MongoDB (zero-trust principle).

**Option A — MongoDB Atlas Data Explorer:**
```json
Find user by email → Edit → change "role" field from "user" to "admin" → Update
```

**Option B — mongosh:**
```js
db.users.updateOne({ email: "admin@yourdomain.com" }, { $set: { role: "admin" } })
```

After login, role=admin is redirected to `/admin` automatically.

---

## 7. Khalti Payment Setup

### Test Keys (development)
1. Go to [https://test-admin.khalti.com](https://test-admin.khalti.com)
2. Register a merchant account
3. Go to **Developer** → **Keys**
4. Copy **Live Secret Key** → paste into `server/.env` as `KHALTI_SECRET_KEY`

### Test Cards
Use Khalti test credentials:
- Mobile: `9800000000` through `9800000005`
- MPIN: `1111`
- OTP: `987654`

### How Payments Work

```
User clicks "Buy with Khalti"
  → POST /api/payments/initiate
    → Server calls Khalti API to create payment session
    → Server saves pending Transaction with HMAC signature
    → Returns payment_url
  → Browser redirects to Khalti hosted page
  → User pays with Khalti wallet/bank
  → Khalti redirects to /payment/verify?pidx=xxx&status=Completed
  → POST /api/payments/verify (with pidx)
    → Server calls Khalti lookup API to verify
    → Re-checks HMAC signature + amount integrity
    → Atomic DB transaction: marks complete + enrolls user
    → User redirected to dashboard with course access
```

**Free courses** are enrolled instantly without Khalti (no redirect needed).

### Price Storage
Prices are stored in **paisa** (1 NPR = 100 paisa), matching Khalti's API.
Example: Rs. 500 → stored as `50000` in `priceCents` field.

---

## 8. Security Features

### Password Security (§3.1)
| Feature | Implementation |
|---------|---------------|
| Min 12 chars | `validatePasswordPolicy()` — server + client |
| Complexity rules | Uppercase, lowercase, number, special char — regex |
| Real-time feedback | `zxcvbn` — `PasswordStrengthMeter.tsx` component |
| Last 5 history | `passwordHistory[]` in User model |
| 90-day expiry | `passwordExpiresAt` — banner shown 14 days before |
| Bcrypt cost 12 | Pre-save hook in `user.model.ts` |

### MFA (§2.2)
- TOTP via speakeasy (RFC 6238, 30-second codes)
- QR code generated server-side via `qrcode`
- 10 backup codes (bcrypt hashed), consumed on use
- MFA secret stored AES-256-GCM encrypted

### Brute-Force (§3.2)
- **Account lockout**: 5 failed → 15-min lock (`lockedUntil` field)
- **Rate limiting**: 10 login/15 min per IP (`express-rate-limit`)
- **IP allowlist**: bypass for localhost in dev
- **reCAPTCHA v3**: on login, register, password reset (enabled in prod)

### Session Management (§3.4)
- Access token: 15-min JWT (HS256, issuer/audience validated)
- Refresh token: 7-day JWT in `HttpOnly; Secure; SameSite=Strict` cookie
- Session binding: stores `userAgent` + `ip` per refresh token
- Rotation: new access token on every `/refresh` call
- Revocation: logout removes specific token hash from `activeRefreshTokens[]`

### Encryption (§3.5)
- Passwords: bcrypt (cost 12)
- MFA secrets: AES-256-GCM (IV + tag + ciphertext)
- Transaction integrity: HMAC-SHA256 with 32-byte key
- All sensitive fields stripped in `.toJSON()` transform

### Access Control (§3.3)
- `requireAuth`: verifies JWT, attaches `req.user`
- `requireRole(...roles)`: checks `req.user.role`
- `requireAdmin`: shorthand
- Profile updates: whitelist prevents mass-assignment
- IDOR prevention: all queries use `req.user.sub`

### Injection Prevention
- `express-mongo-sanitize`: strips `$`, `.` from body/query
- `hpp`: HTTP parameter pollution prevention
- Inline XSS sanitizer: escapes `< > & " '` in all string inputs
- `helmet`: CSP, HSTS, X-Frame-Options, and 8 more headers

### Payment Security (§2.4)
- Khalti: merchant never sees card details (PCI-DSS compliant)
- HMAC signature: computed before payment, re-verified on webhook
- Amount integrity: server compares Khalti's `total_amount` vs stored `amountCents`
- Atomic MongoDB session: enrolment only if all writes succeed

### Audit Logging (§2.5)
Events written to `logs/audit-YYYY-MM-DD.log` (90-day rotation):

```
login_success · login_failed · login_blocked_locked · logout
user_registered · email_verified
password_reset · password_changed · mfa_enabled
payment_intent_created · payment_completed · payment_verify_failed
profile_exported · admin_toggle_user · admin_delete_user
course_created · course_updated · course_deleted
webhook_signature_invalid · server_started
```

Logs are structured JSON. Sensitive fields (`password`, `token`, `secret`) are redacted automatically.

---

## 9. Role-Based Access Control

| Feature | `user` | `admin` |
|---------|--------|---------|
| Browse courses | ✅ | ✅ |
| Purchase with Khalti | ✅ | ✅ |
| View own dashboard | ✅ | — |
| Edit own profile | ✅ | ✅ |
| Admin overview | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| Create/publish courses | ❌ | ✅ |
| View all transactions | ❌ | ✅ |
| View audit logs | ❌ | ✅ |

Login redirects automatically:
- `role=user` → `/dashboard`
- `role=admin` → `/admin`

Logged-in users are redirected away from `/login` and `/register` automatically.

---

## 10. API Reference

### Auth (`/api/auth`)
| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/register` | Public | reCAPTCHA, email verification sent |
| GET | `/verify-email/:token` | Public | Link from email |
| POST | `/login` | Public | Returns `mfaRequired` if MFA on |
| POST | `/refresh` | Cookie | Rotates access token |
| POST | `/logout` | Bearer | Removes session |
| GET | `/me` | Bearer | Fresh user data |
| POST | `/request-password-reset` | Public | Anti-enumeration (always 200) |
| POST | `/reset-password/:token` | Public | History check |
| POST | `/mfa/setup` | Bearer | Returns QR + backup codes |
| POST | `/mfa/confirm` | Bearer | Enables MFA |

### Courses (`/api/courses`)
| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| GET | `/` | Public | Filter by category, level, search |
| GET | `/:slug` | Optional | Lessons gated — full if enrolled |

### Profile (`/api/profile`)
| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| GET | `/` | Bearer | Includes enrolled courses |
| PATCH | `/` | Bearer | Whitelisted fields only |
| POST | `/change-password` | Bearer | History + policy checked |
| GET | `/export` | Bearer | GDPR JSON export |

### Payments (`/api/payments`)
| Method | Route | Auth | Notes |
|--------|-------|------|-------|
| POST | `/initiate` | Bearer | Creates Khalti session, returns paymentUrl |
| POST | `/verify` | Bearer | Verifies pidx, enrols user atomically |
| GET | `/my-transactions` | Bearer | Own history |

### Admin (`/api/admin`) — all require `role=admin`
| Method | Route | Notes |
|--------|-------|-------|
| GET | `/stats` | Users, courses, revenue |
| GET | `/users` | Paginated, searchable |
| PATCH | `/users/:id/toggle-active` | Cannot deactivate self |
| DELETE | `/users/:id` | Cannot delete self |
| GET | `/logs` | Today's audit log, last 200 events |
| GET | `/courses` | All (published + drafts) |
| POST | `/courses` | Create (starts as draft) |
| PATCH | `/courses/:id` | Edit + `isPublished: true` to publish |
| DELETE | `/courses/:id` | |
| POST | `/courses/:id/lessons` | Add lesson to course |
| GET | `/transactions` | All payments |

---

## 11. Docker & CI/CD

### Docker

```bash
docker-compose up --build
```

Services: `gyankosh-mongo` (MongoDB 7) · `gyankosh-server` (Express, non-root) · `gyankosh-client` (Next.js, non-root)

Both containers run as non-root users with health checks.

### GitHub Actions (`.github/workflows/ci.yml`)

Triggers on push to `main`/`develop` and PRs to `main`:

| Job | What it does |
|-----|-------------|
| `server-checks` | TypeScript typecheck → ESLint SAST → `npm audit --audit-level=high` → build |
| `client-checks` | TypeScript typecheck → ESLint → `npm audit` |
| `secret-scan` | Gitleaks scans all git history for leaked secrets |
| `docker-build` | Builds both Docker images (main branch only) |

---

## 12. Penetration Testing Guide

**Scope:** All `/api/*` endpoints on localhost, web UI on `:3000`  
**Methodology:** OWASP WSTG v4.2 + NIST SP 800-115. White-box testing (source available).  
**Tools:** Burp Suite (primary, white-box), ZAP (black-box supplement)

### Test Cases

#### AUTHN — Authentication
```
AUTHN-01: NoSQL injection in login
  Payload: {"email":{"$gt":""},"password":"x"}
  Expected: 400 (mongo-sanitize strips $)
  Tool: Burp Repeater

AUTHN-02: Brute-force login
  Tool: Burp Intruder — 10+ wrong passwords same IP
  Expected: 423 Locked after 5 attempts

AUTHN-03: JWT alg:none
  Modify header: {"alg":"none","typ":"JWT"}, remove signature
  Expected: 401 — server enforces HS256 only

AUTHN-04: Refresh token reuse after logout
  1. Login → capture refreshToken cookie
  2. POST /api/auth/logout
  3. POST /api/auth/refresh with old cookie
  Expected: 401 — hash removed from activeRefreshTokens

AUTHN-05: MFA bypass
  Login with correct creds → returns mfaRequired:true
  Attempt to call protected endpoint with partial tempToken
  Expected: 403 — tempToken has 3-min expiry, no role access
```

#### ATHZ — Access Control
```
ATHZ-01: IDOR — access another user profile
  GET /api/profile with user A token, try to get user B data
  Expected: 200 — only own data (bound to req.user.sub)

ATHZ-02: Privilege escalation — user to admin
  GET /api/admin/users with user-role JWT
  Expected: 403 Insufficient permissions

ATHZ-03: Mass assignment — inject role via profile
  PATCH /api/profile {"role":"admin","firstName":"x"}
  Expected: role ignored — only whitelisted fields updated
```

#### INPV — Input Validation
```
INPV-01: NoSQL injection in course search
  GET /api/courses?search[$regex]=.*
  Expected: safe (mongo-sanitize + express-validator)

INPV-02: Stored XSS via course title
  POST /api/admin/courses {"title":"<script>alert(1)</script>"}
  Expected: inline sanitizer escapes to &lt;script&gt;

INPV-03: HTTP Parameter Pollution
  POST /api/auth/login body: email=a@a.com&email=b@b.com
  Expected: hpp keeps last value only
```

#### Payment Security
```
PAY-01: Khalti amount tampering
  Initiate payment → intercept Khalti callback → modify pidx or amount
  Expected: server re-fetches from Khalti API — tampered amount fails HMAC check

PAY-02: Double purchase
  POST /api/payments/initiate twice for same course
  Expected: second returns 409 Already enrolled

PAY-03: Replay pidx from another user
  User A's pidx used with User B's JWT
  Expected: 404 Transaction not found (user mismatch)
```

#### SESS — Session
```
SESS-01: Cookie attributes
  Inspect Set-Cookie on POST /api/auth/login
  Expected: HttpOnly; Secure; SameSite=Strict

SESS-02: CSRF protection
  Send cross-origin POST from evil.com
  Expected: CORS blocks (origin not in allowlist)
```

---

## 13. Commit Strategy

Minimum 40 commits required. Format:

```
<type>(<scope>): <description> [OWASP ref]
```

Example commits to make:
```
feat(auth): implement bcrypt password hashing cost 12 [OWASP A2]
feat(auth): add TOTP MFA with AES-256-GCM secret storage [OWASP A7]
feat(auth): add account lockout after 5 failed attempts [OWASP A7]
feat(session): HttpOnly+Secure+SameSite refresh token cookie [OWASP A7]
feat(session): refresh token rotation with session binding [OWASP A7]
feat(rbac): add requireRole middleware for admin endpoints [OWASP A1]
feat(rbac): role-based login redirect (admin→/admin, user→/dashboard) [OWASP A1]
security(input): add express-mongo-sanitize against NoSQL injection [OWASP A3]
security(input): inline XSS sanitizer replacing deprecated xss-clean [OWASP A3]
security(headers): configure helmet CSP + HSTS + X-Frame-Options [OWASP A5]
feat(rate-limit): IP-based login throttle 10 req/15 min [OWASP A7]
feat(rate-limit): payment endpoint rate limiter 10 req/hr [OWASP A7]
feat(payment): Khalti payment initiation with HMAC signature [OWASP A8]
feat(payment): Khalti verify endpoint with amount integrity check [OWASP A8]
feat(payment): atomic MongoDB transaction for enrolment [OWASP A8]
feat(payment): free course direct enrolment without payment gateway [OWASP A8]
feat(audit): Winston daily-rotate structured audit logging [OWASP A9]
feat(audit): admin audit log viewer with event filtering [OWASP A9]
feat(password): zxcvbn real-time strength meter on register page [OWASP A7]
feat(password): enforce 90-day expiry + last-5 history check [OWASP A7]
feat(profile): GDPR data export endpoint [privacy compliance]
refactor(mass-assign): whitelist profile update fields [OWASP A8]
fix(idor): bind all queries to req.user.sub [OWASP A1]
fix(ts): ILesson extends Document to resolve .toObject() type error
fix(config): postcss CommonJS syntax for Next.js 14 compatibility
fix(config): rename next.config.ts→.js (Next.js 14 requirement)
fix(server): replace deprecated xss-clean with inline sanitizer
fix(mfa): fetch fresh /me after login to avoid stale mfaEnabled state
fix(auth): redirect authenticated users away from login/register
feat(docker): server Dockerfile with non-root gyankosh user
feat(docker): client Dockerfile with non-root nextjs user
feat(docker): docker-compose with health checks for all services
feat(ci): GitHub Actions TypeScript typecheck + ESLint SAST
feat(ci): npm audit dependency vulnerability scanning
feat(ci): Gitleaks secret scanning on full git history
feat(admin): publish/unpublish course with clear labelled button
feat(admin): admin overview with stats and quick links
feat(courses): show NPR prices (paisa → rupees conversion)
feat(pentest): documented AUTHN, ATHZ, INPV, SESS, PAY test cases
```

---

## 14. References

1. OWASP (2021). *OWASP Top Ten*. https://owasp.org/www-project-top-ten/
2. OWASP (2021). *OWASP API Security Top 10*. https://owasp.org/www-project-api-security/
3. OWASP (2021). *Web Security Testing Guide v4.2*. https://owasp.org/www-project-web-security-testing-guide/
4. NIST (2020). *SP 800-115: Technical Guide to Information Security Testing*. https://csrc.nist.gov/publications/detail/sp/800-115/final
5. NIST (2017). *SP 800-63B: Digital Identity Guidelines*. https://pages.nist.gov/800-63-3/sp800-63b.html
6. Khalti (2024). *Khalti ePay API Documentation*. https://docs.khalti.com/khalti-epay/
7. M'Raihi, D. et al. (2011). *TOTP: Time-Based One-Time Password Algorithm*. RFC 6238.
8. PortSwigger (2024). *Web Security Academy — Authentication*. https://portswigger.net/web-security/authentication
9. PortSwigger (2024). *Web Security Academy — JWT Attacks*. https://portswigger.net/web-security/jwt
10. PortSwigger (2024). *Burp Suite Documentation*. https://portswigger.net/burp/documentation
11. MongoDB (2024). *Security Checklist*. https://www.mongodb.com/docs/manual/administration/security-checklist/
12. Mozilla (2024). *MDN Web Security*. https://developer.mozilla.org/en-US/docs/Web/Security
13. Helme, S. (2024). *Security Headers*. https://securityheaders.com
14. Goodman, D. (2023). *Practical Node.js Security*. O'Reilly Media.
15. IEEE (2022). *Survey on Session Management Vulnerabilities in Web Applications*. IEEE Access.
16. Wyrzykowski, A. (2023). *Zero Trust Architecture in Modern Web Applications*. ACM Digital Library.
17. Percival, C. & Josefsson, S. (2016). *The scrypt Password-Based Key Derivation Function*. RFC 7914.
