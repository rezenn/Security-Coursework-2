"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { profileApi, paymentApi } from "@/lib/api";
import { PageLoader, StatCard, EmptyState } from "@/components/shared";
import { BookOpen, CreditCard, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth("user");
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    Promise.all([profileApi.get(), paymentApi.myTransactions()])
      .then(([p, t]) => { setProfile(p.user); setTransactions(t.transactions); })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user, loading]);

  if (loading || fetching) return <PageLoader />;

  const enrolled = profile?.enrolledCourses ?? [];
  const totalSpent = transactions
    .filter((t) => t.status === "completed")
    .reduce((s: number, t: any) => s + t.amountCents, 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.profile?.firstName || user?.username} 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your learning journey.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Enrolled Courses" value={enrolled.length} icon={<BookOpen size={20} />} color="blue" />
        <StatCard label="Total Spent" value={`$${(totalSpent / 100).toFixed(2)}`} icon={<CreditCard size={20} />} color="green" />
        <StatCard
          label="Security Status"
          value={user?.mfaEnabled ? "MFA On" : "MFA Off"}
          icon={<ShieldCheck size={20} />}
          color={user?.mfaEnabled ? "green" : "yellow"}
        />
      </div>

      {/* MFA reminder */}
      {!user?.mfaEnabled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <ShieldCheck className="text-yellow-400 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <p className="text-yellow-300 font-medium text-sm">Secure your account</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Two-factor authentication is not enabled.{" "}
              <Link href="/mfa-setup" className="underline hover:text-yellow-300">Enable MFA now</Link>
            </p>
          </div>
        </div>
      )}

      {/* Enrolled courses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">My Courses</h2>
          <Link href="/courses" className="text-sm text-blue-400 hover:text-blue-300">Browse more →</Link>
        </div>

        {enrolled.length === 0 ? (
          <EmptyState
            message="You haven't enrolled in any courses yet."
            icon={<BookOpen size={36} />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolled.map((course: any) => (
              <Link
                key={course._id}
                href={`/courses/${course.slug || course._id}`}
                className="card hover:border-blue-500/50 transition-colors group"
              >
                <div className="aspect-video bg-slate-700 rounded-lg mb-3 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="text-slate-500" size={32} />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{course.category}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="px-4 py-3 text-slate-400 font-medium">Course</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Amount</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx: any) => (
                  <tr key={tx._id} className="border-b border-slate-700/50 last:border-0">
                    <td className="px-4 py-3 text-white">{tx.course?.title || "—"}</td>
                    <td className="px-4 py-3 text-white">${(tx.amountCents / 100).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        tx.status === "completed" ? "bg-green-500/20 text-green-400" :
                        tx.status === "failed" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400",
                      )}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
