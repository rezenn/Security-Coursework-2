"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function DashboardPage() {
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
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              G
            </div>
            <span className="font-semibold text-gray-900">GyanKosh</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Hi, {user.username}</span>
            <Link
              href="/profile"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">
          You are securely signed in.
        </p>

        {/* Status cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Email"
            value={user.emailVerified ? "Verified ✓" : "Not verified ✗"}
            ok={user.emailVerified}
          />
          <StatusCard
            label="MFA"
            value={user.mfaEnabled ? "Enabled ✓" : "Not enabled"}
            ok={user.mfaEnabled}
            action={
              !user.mfaEnabled ? (
                <Link
                  href="/mfa-setup"
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  Enable now →
                </Link>
              ) : null
            }
          />
          <StatusCard
            label="Account"
            value={user.username}
            ok
          />
        </div>

        {/* Security notice */}
        {!user.mfaEnabled && (
          <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4">
            <p className="text-sm font-medium text-yellow-800">
              🔒 Strengthen your account
            </p>
            <p className="mt-1 text-sm text-yellow-700">
              Enable two-factor authentication to protect your account from
              unauthorised access.
            </p>
            <Link
              href="/mfa-setup"
              className="mt-3 inline-block rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
            >
              Set up MFA
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusCard({
  label,
  value,
  ok,
  action,
}: {
  label: string;
  value: string;
  ok: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${
          ok ? "text-green-700" : "text-red-600"
        }`}
      >
        {value}
      </p>
      {action}
    </div>
  );
}
