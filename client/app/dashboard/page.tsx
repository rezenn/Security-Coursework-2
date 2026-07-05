"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { profileApi, paymentApi } from "@/lib/api";
import { PageLoader, EmptyState } from "@/components/shared";
import {
  BookOpen,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function DashboardPage() {
  const { loading } = useRequireAuth("user");
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    Promise.all([profileApi.get(), paymentApi.myTransactions()])
      .then(([p, t]) => {
        setProfile(p.user);
        setTransactions(t.transactions);
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [loading]);

  if (loading || fetching) return <PageLoader />;

  const enrolled: any[] = profile?.enrolledCourses ?? [];
  const mfaEnabled: boolean = profile?.mfa?.enabled ?? false;
  const displayName =
    profile?.profile?.firstName || profile?.username || "there";
  const totalSpentCents = transactions
    .filter((t) => t.status === "completed")
    .reduce((s: number, t: any) => s + (t.amountCents || 0), 0);

  const recentTx = transactions.slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm mb-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl font-bold text-white capitalize">
          Good {getGreeting()}, {displayName}
        </h1>
      </div>

      {/* MFA warning — only shown when truly disabled, pulled from fresh /profile */}
      {!mfaEnabled && (
        <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/25 rounded-xl p-4 mb-7">
          <ShieldAlert
            size={17}
            className="text-amber-400 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 text-sm font-medium">
              Your account is not fully secured
            </p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Enable two-factor authentication to protect against unauthorised
              access.
            </p>
          </div>
          <Link
            href="/mfa-setup"
            className="flex-shrink-0 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Enable MFA
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Courses
            </p>
            <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <BookOpen size={13} className="text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{enrolled.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">enrolled</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Spent
            </p>
            <div className="w-7 h-7 bg-emerald-600/20 rounded-lg flex items-center justify-center">
              <CreditCard size={13} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            Rs. {(totalSpentCents / 100).toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">via Stripe</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Security
            </p>
            <div
              className={clsx(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                mfaEnabled ? "bg-emerald-600/20" : "bg-amber-600/20",
              )}
            >
              <ShieldCheck
                size={13}
                className={mfaEnabled ? "text-emerald-400" : "text-amber-400"}
              />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">
            {mfaEnabled ? "On" : "Off"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">two-factor auth</p>
        </div>
      </div>

      {/* My Courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">My Courses</h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Browse all <ArrowRight size={12} />
          </Link>
        </div>

        {enrolled.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 border-dashed rounded-xl p-10 text-center">
            <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">
              You haven&apos;t enrolled in any courses yet.
            </p>
            <Link
              href="/courses"
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Browse Courses <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((course: any) => (
              <Link
                key={course._id}
                href={`/courses/${course.slug || course._id}`}
                className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group"
              >
                <div className="aspect-video bg-slate-700 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-slate-700">
                      <BookOpen size={28} className="text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-1">
                    {course.category}
                  </p>
                  <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {recentTx.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">
            Recent Transactions
          </h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {recentTx.map((tx: any, i: number) => (
              <div
                key={tx._id}
                className={clsx(
                  "flex items-center gap-4 px-5 py-3.5",
                  i < recentTx.length - 1 && "border-b border-slate-700/60",
                )}
              >
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard size={14} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {tx.course?.title || "Unknown course"}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock size={10} />
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">
                    {tx.amountCents === 0
                      ? "Free"
                      : `$${(tx.amountCents / 100).toFixed(2)}`}
                  </p>
                  <span
                    className={clsx(
                      "text-xs font-medium px-1.5 py-0.5 rounded-md",
                      tx.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : tx.status === "failed"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-amber-500/15 text-amber-400",
                    )}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
