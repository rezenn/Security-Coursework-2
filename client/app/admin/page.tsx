"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, StatCard } from "@/components/shared";
import { Users, BookOpen, CreditCard, DollarSign } from "lucide-react";

export default function AdminPage() {
  const { loading } = useRequireAuth("admin");
  const [stats, setStats] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    adminApi.stats().then(setStats).catch(console.error).finally(() => setFetching(false));
  }, [loading]);

  if (loading || fetching) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="text-slate-400 mt-1">Platform statistics and management</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={<Users size={20} />} color="blue" />
        <StatCard label="Total Courses" value={stats?.totalCourses ?? 0} icon={<BookOpen size={20} />} color="purple" />
        <StatCard label="Transactions" value={stats?.totalTransactions ?? 0} icon={<CreditCard size={20} />} color="yellow" />
        <StatCard label="Total Revenue" value={`$${((stats?.totalRevenueCents ?? 0) / 100).toFixed(2)}`} icon={<DollarSign size={20} />} color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: "/admin/users", label: "Manage Users", desc: "View, activate, or deactivate accounts", icon: Users, color: "blue" },
          { href: "/admin/courses", label: "Manage Courses", desc: "Create, edit and publish courses", icon: BookOpen, color: "purple" },
          { href: "/admin/logs", label: "Audit Logs", desc: "Review security and activity events", icon: CreditCard, color: "yellow" },
        ].map(({ href, label, desc, icon: Icon, color }) => (
          <a key={href} href={href} className="card hover:border-blue-500/50 transition-colors group">
            <div className={`w-10 h-10 bg-${color}-600/20 rounded-xl flex items-center justify-center mb-3 text-${color}-400`}>
              <Icon size={18} />
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{label}</h3>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
