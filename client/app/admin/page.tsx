"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader } from "@/components/shared";
import { Users, BookOpen, CreditCard, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalTransactions: number;
  totalRevenueCents: number;
}

export default function AdminPage() {
  const { loading } = useRequireAuth("admin");
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    adminApi.stats().then(setStats).catch(console.error).finally(() => setFetching(false));
  }, [loading]);

  if (loading || fetching) return <PageLoader />;

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "blue", href: "/admin/users" },
    { label: "Total Courses", value: stats?.totalCourses ?? 0, icon: BookOpen, color: "purple", href: "/admin/courses" },
    { label: "Completed Orders", value: stats?.totalTransactions ?? 0, icon: CreditCard, color: "amber", href: "/admin/transactions" },
    { label: "Revenue (NPR)", value: `Rs. ${((stats?.totalRevenueCents ?? 0) / 100).toFixed(0)}`, icon: TrendingUp, color: "emerald", href: "/admin/transactions" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Platform statistics and quick actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link key={label} href={href}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 bg-${color}-600/20 rounded-lg flex items-center justify-center`}>
                <Icon size={15} className={`text-${color}-400`} />
              </div>
              <ArrowRight size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/admin/courses", label: "Manage courses", desc: "Create, edit and publish course content", icon: BookOpen },
            { href: "/admin/users", label: "Manage users", desc: "View accounts, toggle status, remove users", icon: Users },
            { href: "/admin/logs", label: "Audit logs", desc: "Review security events and login activity", icon: CreditCard },
            { href: "/admin/transactions", label: "Transactions", desc: "Track Khalti payments and revenue", icon: TrendingUp },
          ].map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-start gap-4 bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors group">
              <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/20 transition-colors">
                <Icon size={16} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
