# GyanKosh — Secure Course Selling Platform

**GyanKosh** ("treasury of knowledge") is a full-stack, security-hardened online course platform built for **ST6005CEM — Secure Web Application Design, Implementation, and Internal Penetration Testing**. It lets an instructor publish courses with free preview lessons and paid full access, and lets learners register, enroll, pay securely with Stripe, and track their progress — all behind a defence-in-depth security architecture designed and implemented from scratch (JWT auth, TOTP MFA, RBAC, rate limiting, CSRF, audit logging, HMAC-signed transactions), extended with risk-based adaptive authentication, intrusion detection, and SSRF-safe outbound requests beyond the taught syllabus.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables](#4-environment-variables)
5. [Running the App](#5-running-the-app)
6. [Creating an Admin](#6-creating-an-admin)
7. [Stripe Payment Setup](#7-stripe-payment-setup)
8. [Security Features](#8-security-features)
9. [Advanced Security Extensions](#9-advanced-security-extensions)
10. [Role-Based Access Control](#10-role-based-access-control)
11. [API Reference](#11-api-reference)
12. [Docker & CI/CD](#12-docker--cicd)
13. [Internal Penetration Testing](#13-internal-penetration-testing)
14. [Commit Strategy](#14-commit-strategy)
15. [Known Limitations](#15-known-limitations)
---

## 1. Overview

**Problem:** Independent instructors in Nepal (e.g. security trainers, language tutors) have no lightweight, trustworthy platform to sell course access directly, with free previews to build trust before a learner pays.

**Solution:** GyanKosh lets an admin publish a course with a mix of free preview lessons and gated paid lessons, and lets a learner browse, preview, and purchase full access via Stripe, in NPR, with the entire flow secured against the OWASP Top 10 and common business-logic abuse (enrollment bypass, IDOR, price tampering).

This is not a generic CRUD app — the core design constraint is **secure-by-design payment and content-gating logic**, not just "add auth to a course list."

---

## 2. Tech Stack

| Layer               | Technology                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------- |
| Frontend            | Next.js 14 (App Router), React, TypeScript, Tailwind CSS                                        |
| Backend             | Node.js, Express, TypeScript                                                                    |
| Database            | MongoDB (Atlas), Mongoose                                                                       |
| Auth                | JWT (access + refresh), Passport.js (Google OAuth), Speakeasy (TOTP MFA)                        |
| Payments            | Stripe (PaymentIntents + Payment Element, embedded in-page)                                     |
| Security middleware | Helmet, CORS, `express-rate-limit`, `express-mongo-sanitize`, `hpp`, double-submit CSRF cookies |
| Password            | bcrypt (hashing), zxcvbn (strength scoring)                                                     |
| Encryption          | AES-256-GCM (MFA secrets), HMAC-SHA256 (transaction integrity)                                  |
| Logging             | Winston + daily rotating file transport, structured audit log                                   |
| Email               | Nodemailer (SMTP)                                                                               |
| CI/CD               | GitHub Actions (typecheck, lint/SAST, `npm audit`, Gitleaks secret scan, Docker build)          |
| Containerization    | Docker, Docker Compose                                                                          |

---

## 3. Folder Structure

```
Security-Coursework-2/
├── .github/workflows/ci.yml        # CI: typecheck, lint, audit, secret scan, docker build
├── docker-compose.yml
├── SECURITY-TESTING-PAYLOADS.md    # Burp Suite payloads + expected results, all 15 vuln classes
├── server/
│   ├── src/
│   │   ├── config/                 # env, database, passport config
│   │   ├── controllers/            # auth, course, profile, transaction, admin, security
│   │   ├── middleware/             # auth, csrf, rateLimiter, recaptcha, upload, honeytoken, validation
│   │   ├── models/                 # user, course, transaction (Mongoose schemas)
│   │   ├── routes/                 # auth.routes.ts, security.routes.ts, index.ts
│   │   ├── services/                # password, mfa, token, email, transaction, deviceRisk, ssrfSafeFetch
│   │   ├── types/                   # Express type augmentation (req.user)
│   │   ├── utils/                   # winston logger, sanitize, fileSignature
│   │   └── server.ts                # app bootstrap, middleware ordering
│   └── Dockerfile
├── client/
│   ├── app/                        # Next.js App Router pages
│   ├── components/                 # payment, admin, course, shared UI
│   ├── context/                    # auth context
│   ├── lib/api/                    # typed API client (axios)
│   └── Dockerfile
└── README.md
```

---

## 4. Environment Variables

Copy these into `server/.env` and `client/.env.local`. **Never commit real values** — this repo's `.gitignore` excludes `.env*`, and CI runs Gitleaks on every push to catch accidental leaks.

### `server/.env`

```dotenv
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/gyankosh

# JWT - generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=15d

COOKIE_SECRET=<random-secret>
ENCRYPTION_KEY=<32-byte-key-for-AES-256-GCM>

# Stripe (https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from `stripe listen`, see section 7

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail-address>
SMTP_PASS=<gmail-app-password>
EMAIL_FROM=GyanKosh <no-reply@example.com>
EMAIL_SEND_IN_DEVELOPMENT=true
ADMIN_ALERT_EMAIL=<security-team-inbox>   # honeytoken/intrusion alerts; falls back to SMTP_USER if unset

APP_NAME=GyanKosh
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

RECAPTCHA_SECRET_KEY=<key>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<key>

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX=10
LOGIN_RATE_LIMIT_WINDOW_MS=900000
AUTH_IP_RATE_LIMIT_MAX=30

IP_ALLOWLIST=127.0.0.1,::1

GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### `client/.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<key>
```

> **If you've ever pasted real secrets from this `.env` into a chat, ticket, or public place: rotate them.** Treat anything typed outside your local `.env` as compromised — especially `MONGO_URI` and `SMTP_PASS`.

---

## 5. Running the App

### Development

```bash
# Terminal 1 - Server
cd server
npm install
npm run dev          # nodemon, http://localhost:5000

# Terminal 2 - Client
cd client
npm install
npm run dev           # http://localhost:3000

# Terminal 3 - Stripe webhook forwarding (required for local payment testing)
stripe listen --forward-to localhost:5000/api/payments/webhook
# copy the printed whsec_... into server/.env as STRIPE_WEBHOOK_SECRET
```

### Docker

```bash
docker compose up --build
# Server: http://localhost:5000/api/health
# Client: http://localhost:3000
```

---

## 6. Creating an Admin

Register a normal account through the UI, then promote it directly in MongoDB (there is intentionally no "become admin" API — that would be a privilege-escalation vector):

```js
// mongosh
use gyankosh
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

---

## 7. Stripe Payment Setup

### How payments actually work

The app uses **Stripe PaymentIntents + the embedded Payment Element** (`@stripe/react-stripe-js`), not hosted Stripe Checkout — the whole flow stays in-page inside `PaymentModal`.

1. Client calls `POST /api/payments/create-checkout` → server creates a Stripe `PaymentIntent`, stores a `pending` `Transaction` keyed by the real `PaymentIntent` id, and returns `clientSecret` + the Stripe publishable key. The amount charged is read entirely from `course.priceCents` server-side — the client never supplies a price.
2. Client mounts `<Elements><PaymentElement /></Elements>` with that `clientSecret` and calls `stripe.confirmPayment({ elements, redirect: "if_required" })`.
3. On success, the client **immediately** calls `POST /api/payments/complete-payment-intent` with the returned PaymentIntent id — this is the guaranteed finalizer, independent of webhook delivery.
4. The `payment_intent.succeeded` **webhook** also finalizes the same transaction as a second, idempotent path (whichever arrives first "wins"; the second call is a no-op because it only matches `status: "pending"` transactions).
5. Both paths verify an **HMAC-SHA256 signature** over `userId|courseId|amountCents|timestamp` before marking anything `completed` — this stops a tampered PaymentIntent metadata blob or a replayed webhook from crediting the wrong course or amount.

Free courses (`priceCents: 0`) skip Stripe entirely and enroll atomically via a Mongo transaction.

### Test keys (development)

Use your Stripe test-mode keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). Test card: `4242 4242 4242 4242`, any future expiry, any CVC, any postal code.

### Webhook secret

`STRIPE_WEBHOOK_SECRET` **must** be the value printed by `stripe listen` (or your dashboard-configured endpoint secret) — a placeholder value will make every webhook fail HMAC verification silently and leave transactions stuck `pending` (the client-side finalizer in step 3 above is what saves you here in dev).

---

## 8. Security Features

### Password Security

- Minimum 12 / maximum 128 characters, requires upper, lower, digit, special character (`password.service.ts`).
- Real-time strength feedback via `zxcvbn`.
- Last 5 password hashes stored (`passwordHistory`) and checked on change/reset to block reuse.
- 90-day password expiry (`passwordExpiresAt`, set on every successful change).

### Brute-Force Prevention

- Per-route rate limiters: global, login-specific, and payment-specific (`rateLimiter.middleware.ts`), each with an IP allow-list bypass for trusted dev/admin IPs.
- Account lockout after `MAX_LOGIN_ATTEMPTS` failed logins for `LOCKOUT_DURATION_MINUTES`.
- Google reCAPTCHA on high-risk endpoints (registration, login).

### Multi-Factor Authentication

- TOTP via `speakeasy`, QR-code enrollment, 10 single-use backup codes (bcrypt-hashed at rest).
- MFA secrets encrypted with **AES-256-GCM** before storage — authenticated encryption, so tampering with the ciphertext is detected via the GCM auth tag, not just confidentiality.

### Access Control - RBAC

- Two roles (`user`, `admin`) enforced via `requireRole` / `requireAdmin` middleware, applied router-wide on every admin route (`adminRouter.use(requireAuth, requireAdmin)`), not just hidden in the UI.
- Course lesson content is filtered **server-side** by enrollment status — a non-enrolled user's API response never contains gated lesson data in the first place, rather than relying on the client to hide it.

### Session Management

- Access tokens: short-lived JWT (15 min), sent as `Authorization: Bearer`.
- Refresh tokens: long-lived, `httpOnly` + `Secure` (prod) + `SameSite=Strict` cookie, hashed before storage, rotated on every use, tracked per-device in `activeRefreshTokens`, so a stolen refresh token can be revoked individually via logout without killing every other session.

### CSRF (double-submit cookie)

- `issueCsrfToken` / `verifyCsrfToken` middleware issue a non-`httpOnly` cookie the client must echo back in an `x-csrf-token` header on state-changing requests, explicitly skipped only for routes that authenticate another way (the Stripe webhook via signature, the CSP report endpoint since it's fired by the browser itself).

### Encryption & Data Protection

- Passwords: bcrypt. MFA secrets: AES-256-GCM. Transaction integrity: HMAC-SHA256. TLS/HTTPS enforced in production via `helmet`'s HSTS header.

### Injection & Business-Logic Prevention

- `express-mongo-sanitize` + a custom `sanitizeValue` walker strip `$`/`.` operator injection from `req.body`/`req.query`/`req.params`.
- `hpp` blocks HTTP parameter pollution.
- `sanitize.utils.ts` escapes regex metacharacters and caps search-input length before it reaches `RegExp()`, closing a ReDoS/injection gap.
- Every `findByIdAndUpdate` call uses an explicit field allowlist — no controller ever passes `req.body` directly into a Mongoose write, preventing mass assignment of `role`/`isAdmin`/`enrolledCourses`.
- Checkout price is read from the database, never the request body (see section 7).

### File Upload Validation

- MIME type + extension allowlist at upload time (`upload.middleware.ts`).
- **Magic-byte verification** (`fileSignature.utils.ts`) reads each file's actual binary signature after upload and rejects any mismatch between declared and real content, closing the gap left by relying on client-declared type alone. Applied uniformly to direct uploads and to URL-imported images (section 9).

### Activity & Audit Logging

- Structured Winston audit log (`logSecurityEvent`) on every security-relevant action — written to daily-rotating files, queryable via `GET /api/admin/logs`. Logged payloads intentionally exclude password/token/secret values.

### Data Export

- `GET /api/profile/export` returns the authenticated user's own profile/account data as a portable JSON export.

---

## 9. Advanced Security Extensions

Four controls beyond the module syllabus, each closing a gap baseline OWASP Top 10 coverage doesn't address:

- **Risk-based adaptive authentication** (`deviceRisk.service.ts`) — logins from an unrecognised IP+User-Agent fingerprint on an MFA-disabled account pause session issuance and require a one-time emailed code bound to that specific device, mitigating account takeover from credentials leaked elsewhere (NIST SP 800-63B §6.1.2.3).
- **Honeytoken intrusion detection** (`honeytoken.middleware.ts`) — decoy routes shaped like common recon targets (`/api/admin/backup-export`, `/.env.bak`, `/.git/config`, etc.) that no legitimate request ever reaches; a hit auto-blocks the source IP for 30 minutes and alerts `ADMIN_ALERT_EMAIL`, while returning an identical 404 so the attacker gets no signal.
- **CSP violation reporting** (`security.controller.ts`, `POST /api/security/csp-report`) — the browser auto-reports every blocked script/style/connect attempt, turning the existing Content-Security-Policy from purely preventive into a detective control as well.
- **SSRF-safe outbound fetching** (`ssrfSafeFetch.service.ts`) — the admin thumbnail-from-URL import feature resolves DNS itself, rejects private/reserved IP ranges before connecting, and pins the TCP connection to the validated IP rather than the hostname, closing the DNS-rebinding gap left by naive URL fetchers.

See `SECURITY-TESTING-PAYLOADS.md` for exact attack payloads and expected responses for all of the above plus the full CVSS-scored vulnerability set.

---

## 10. Role-Based Access Control

| Role    | Can                                                                                                                                                      |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`  | Register, log in, enable MFA, browse courses, preview free lessons, purchase/enroll, view own transactions, export own data                              |
| `admin` | Everything a `user` can, plus: create/edit/publish/delete courses and lessons, manage users, view all transactions, view audit logs, view platform stats |

Enforced with `requireAuth` (valid JWT required) composed with `requireRole(...)` / `requireAdmin` on the Express router — checked on the server for every request, not inferred from the UI.

---

## 11. API Reference

### Auth (`/api/auth`)

| Method   | Path                                                                   | Notes                                                    |
| -------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| POST     | `/register`                                                            | reCAPTCHA + rate-limited                                   |
| GET/POST | `/verify-email/:token`, `/verify-email`                                |                                                             |
| POST     | `/login`                                                               | rate-limited, lockout-aware; may return `mfaRequired` or `deviceVerificationRequired` requiring a follow-up `mfaToken`/`deviceCode` |
| POST     | `/refresh`                                                             | rotates refresh token                                       |
| POST     | `/logout`                                                              | requires auth                                               |
| GET      | `/me`                                                                  | requires auth                                               |
| POST     | `/request-password-reset`, `/reset-password/:token`, `/reset-password` |                                                             |
| POST     | `/mfa/setup`, `/mfa/confirm`                                           | requires auth                                               |
| GET      | `/google`, `/google/callback`, `/google/failure`                       | OAuth                                                       |

### Courses (`/api/courses`)

| Method | Path     | Notes                                                                     |
| ------ | -------- | ------------------------------------------------------------------------- |
| GET    | `/`      | published courses, paginated, filterable                                  |
| GET    | `/:slug` | free lessons for anonymous/non-enrolled users, full content once enrolled |

### Profile (`/api/profile`)

| Method      | Path               | Notes                        |
| ----------- | ------------------ | ----------------------------- |
| GET / PATCH | `/`                | requires auth                 |
| POST        | `/change-password` | enforces reuse/length policy  |
| GET         | `/export`          | JSON data export              |
| POST        | `/avatar`          | multipart upload, magic-byte verified |

### Payments (`/api/payments`)

| Method | Path                       | Notes                                      |
| ------ | --------------------------- | ------------------------------------------- |
| POST   | `/create-checkout`          | creates Stripe PaymentIntent, rate-limited  |
| POST   | `/complete-payment-intent`  | client-side finalize fallback               |
| POST   | `/webhook`                  | Stripe signature-verified, raw body         |
| GET    | `/my-transactions`          | requires auth                               |

### Security (`/api/security`)

| Method | Path          | Notes                                                    |
| ------ | -------------- | --------------------------------------------------------- |
| POST   | `/csp-report`  | browser-fired CSP violation reports, no auth/CSRF required |

### Admin (`/api/admin`) — all require `role=admin`

`GET /stats`, `GET /users`, `PATCH/DELETE /users/:id`, `GET /logs`, full course/lesson CRUD, `POST /courses/:id/thumbnail` (multipart), `POST /courses/:id/thumbnail-url` (SSRF-safe URL import, rate-limited), `GET /transactions`.

Additionally, a set of undocumented honeytoken routes (see `honeytoken.middleware.ts`) intentionally exist outside this table — listing them would defeat their purpose.

---

## 12. Docker & CI/CD

### Docker

`server/Dockerfile`, `client/Dockerfile`, and root `docker-compose.yml` provide a reproducible dev/prod-like environment. `docker compose up --build` runs both services with the client's public env vars baked in as build args.

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on every push/PR to `main`/`develop`:

1. **Server checks** — TypeScript typecheck, ESLint (SAST), `npm audit --audit-level=critical`, production build.
2. **Client checks** — TypeScript typecheck, ESLint, `npm audit`.
3. **Secret scan** — Gitleaks over full git history, catches committed credentials before merge.
4. **Docker build check** — verifies both images build cleanly on `main`.

---

## 13. Internal Penetration Testing

A white-box internal penetration test was performed against this codebase, covering **15 CVSS-scored vulnerability classes**: brute force, stored/reflected XSS, CSRF, IDOR, mass assignment, NoSQL injection, ReDoS/regex injection, unrestricted file upload, broken access control/RBAC, session/cookie security, insufficient session expiry, weak password policy, CORS misconfiguration, SSRF, and price/parameter tampering — plus the four advanced extensions in section 9.

- **Authentication & authorization** — JWT tampering, refresh-token replay, MFA bypass attempts, account lockout evasion, new-device step-up bypass attempts.
- **Business logic** — enrollment bypass, price manipulation (client-sent `amountCents`), free-course abuse, duplicate enrollment.
- **Injection** — NoSQL operator injection, HPP, ReDoS payloads against search endpoints.
- **Session & CSRF** — cookie flag verification, double-submit token forgery attempts.
- **SSRF** — cloud metadata / internal-service targeting via the thumbnail-URL-import feature, DNS-rebinding attempts.
- **Payment integrity** — HMAC tampering, webhook replay, PaymentIntent/Transaction ID mismatch (an actual bug found and fixed during development, not just a theoretical test case).

Exact Burp Suite payloads and expected (blocked) responses for every class above are documented in `SECURITY-TESTING-PAYLOADS.md`. Formal methodology (OWASP WSTG v4.2 mapping), CVSS v3.1 ratings, Burp evidence, and remediation/retest evidence belong in the coursework report deliverable — this README summarizes what's implemented, not the formal test log.

---

## 14. Commit Strategy

Development followed small, security-decision-mapped commits (40+ across the project) — e.g. "fix: Stripe webhook registered after express.json() destroyed raw body," "fix: PaymentIntent/CheckoutSession ID mismatch left transactions pending," "feat: AES-256-GCM encryption for MFA secrets," "feat: SSRF-safe fetcher for thumbnail URL import," "feat: magic-byte file signature verification." Commit messages name the vulnerability/bug and the mechanism of the fix, not just "fix bug."

---

## 15. Known Limitations

Documented honestly rather than hidden, per good security-reporting practice:

- **No password-less/passkey option** — listed as an advanced/optional item in the brief; not implemented.
- **No automated regression suite** for the documented Burp Suite payloads — they're run and verified manually; converting `SECURITY-TESTING-PAYLOADS.md` into an integration-test suite that runs in CI is a natural next step.
- **Accessibility** has not been formally tested with a screen reader / axe-core audit.
- **Magic-byte verification covers four image formats** (JPEG/PNG/GIF/WEBP) — sufficient for this application's upload surface, but not a general-purpose file-type sniffer.
- **Honeytoken routes are static**, not dynamically randomized per deployment — an attacker with prior knowledge of this specific codebase could avoid them; acceptable for a coursework threat model, not for a real production deployment.
- **Third-party dependency risk** is mitigated (CI `npm audit`) but not eliminated — no runtime SCA/WAF layer.
