"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              G
            </div>
            <span className="font-semibold text-gray-900">GyanKosh</span>
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

        {/* Account Info */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Account information
          </h2>
          <dl className="mt-4 space-y-3">
            <Row label="Username" value={user.username} />
            <Row label="Email" value={user.email} />
            {/* <Row
              label="Email verified"
              value={
                user.emailVerified ? (
                  <span className="text-green-600 font-medium">Verified ✓</span>
                ) : (
                  <span className="text-red-600 font-medium">
                    Not verified —{" "}
                    <Link href="/verify" className="underline">
                      Verify now
                    </Link>
                  </span>
                )
              }
            /> */}
            {user.createdAt && (
              <Row
                label="Member since"
                value={new Date(user.createdAt).toLocaleDateString()}
              />
            )}
          </dl>
        </section>

        {/* Security */}
        <section className="mt-5 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Security
          </h2>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Two-factor authentication
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user.mfaEnabled
                  ? "Your account is protected with an authenticator app."
                  : "Add an extra layer of protection to your account."}
              </p>
            </div>
            {user.mfaEnabled ? (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Enabled
              </span>
            ) : (
              <Link
                href="/mfa-setup"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Enable MFA
              </Link>
            )}
          </div>

          <div className="mt-3">
            <Link
              href="/request-password-reset"
              className="text-sm text-blue-600 hover:underline"
            >
              Change password →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
