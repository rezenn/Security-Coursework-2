import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/50">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
              GyanKosh Secure App
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">
              Secure authentication demo
            </h1>
            <p className="mt-3 text-slate-600">
              Register, verify email, enable MFA, and access your profile with a
              secure Next.js frontend.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/register"
            >
              <h2 className="text-xl font-semibold">Register</h2>
              <p className="mt-2 text-slate-600">
                Create a new account and verify your email.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/login"
            >
              <h2 className="text-xl font-semibold">Login</h2>
              <p className="mt-2 text-slate-600">
                Sign in with email and optionally MFA.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/verify"
            >
              <h2 className="text-xl font-semibold">Verify Email</h2>
              <p className="mt-2 text-slate-600">
                Use the token from your verification email.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/mfa"
            >
              <h2 className="text-xl font-semibold">Enable MFA</h2>
              <p className="mt-2 text-slate-600">
                Setup two-factor authentication for your account.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/profile"
            >
              <h2 className="text-xl font-semibold">My Profile</h2>
              <p className="mt-2 text-slate-600">
                View account details and manage MFA.
              </p>
            </Link>
            <Link
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 text-left transition hover:border-slate-300 hover:bg-slate-100"
              href="/request-password-reset"
            >
              <h2 className="text-xl font-semibold">Reset Password</h2>
              <p className="mt-2 text-slate-600">
                Request a reset link by email.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
