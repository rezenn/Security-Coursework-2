"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Building2,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { handleGetAllUsers } from "@/lib/actions/admin/user-action";
import { handleGetAllOrganizations } from "@/lib/actions/organization/organization-action";
import { handleGetAllAppointments } from "@/lib/actions/appointment/appointment";
import { format, isThisMonth } from "date-fns";

interface Stats {
  totalUsers: number;
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  totalOrgs: number;
  orgsWithDetails: number;
  totalAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  appointmentsThisMonth: number;
}

interface RecentUser {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  imageUrl?: string;
}

interface RecentAppointment {
  _id: string;
  clientName: string;
  clientEmail: string;
  date: string;
  status: string;
  organizationId?: { organizationName?: string };
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function StatCard({
  title,
  value,
  sub,
  growth,
  loading,
}: {
  title: string;
  value: number | string;
  sub?: string;
  growth?: number;
  loading: boolean;
}) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800  mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-100 animate-pulse rounded-lg mt-1" />
          ) : (
            <p className="text-3xl font-black text-gray-900 tabular-nums">
              {value}
            </p>
          )}
          {sub && !loading && (
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          )}
        </div>
      </div>

      {growth !== undefined && !loading && (
        <div className="mt-4 flex items-center gap-1.5">
          {growth >= 0 ? (
            <TrendingUp size={14} className="text-emerald-500" />
          ) : (
            <TrendingDown size={14} className="text-red-400" />
          )}
          <span
            className={`text-xs font-bold ${
              growth >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {growth >= 0 ? "+" : ""}
            {growth}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    newUsersLastMonth: 0,
    totalOrgs: 0,
    orgsWithDetails: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    appointmentsThisMonth: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<
    RecentAppointment[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      setError(null);

      const [usersRes, orgsRes, apptRes, orgUsersRes] = await Promise.all([
        handleGetAllUsers(1, 1000, "", "user"),
        handleGetAllOrganizations(),
        handleGetAllAppointments(),
        handleGetAllUsers(1, 1000, "", "organization"),
      ]);

      const users: any[] = usersRes.success ? usersRes.users || [] : [];
      const newThisMonth = users.filter((u) =>
        isThisMonth(new Date(u.createdAt)),
      ).length;
      const newLastMonth = users.filter((u) =>
        isThisMonth(new Date(u.createdAt)),
      ).length;
      const recent5Users = [...users]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

      const orgsWithDetails: any[] =
        orgsRes.success && Array.isArray(orgsRes.data) ? orgsRes.data : [];
      const orgUsers: any[] = orgUsersRes.success
        ? orgUsersRes.users || []
        : [];
      const totalOrgs = orgUsers.length;

      const appts: any[] =
        apptRes.success && Array.isArray(apptRes.data) ? apptRes.data : [];
      const pending = appts.filter((a) => a.status === "pending").length;
      const completed = appts.filter((a) => a.status === "completed").length;
      const cancelled = appts.filter((a) => a.status === "cancelled").length;
      const apptThisMonth = appts.filter((a) =>
        isThisMonth(new Date(a.date || a.createdAt)),
      ).length;
      const recent5Appts = [...appts]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

      setStats({
        totalUsers: users.length,
        newUsersThisMonth: newThisMonth,
        newUsersLastMonth: newLastMonth,
        totalOrgs,
        orgsWithDetails: orgsWithDetails.length,
        totalAppointments: appts.length,
        pendingAppointments: pending,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        appointmentsThisMonth: apptThisMonth,
      });
      setRecentUsers(recent5Users);
      setRecentAppointments(recent5Appts);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-1 sm:px-6 py-1 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 ">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          sub={`${stats.newUsersThisMonth} joined this month`}
          loading={loading}
        />
        <StatCard
          title="Organizations"
          value={stats.totalOrgs}
          sub={`${stats.orgsWithDetails} with full profile`}
          loading={loading}
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalAppointments}
          sub={`${stats.appointmentsThisMonth} this month`}
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={stats.pendingAppointments}
          sub={`${stats.completedAppointments} completed · ${stats.cancelledAppointments} cancelled`}
          loading={loading}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-gray-800  mb-5">
          Appointment Breakdown
        </h2>
        {loading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-1 h-20 bg-gray-100 animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Completed",
                value: stats.completedAppointments,
                icon: CheckCircle,
                cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
                iconCls: "text-emerald-500",
              },
              {
                label: "Pending",
                value: stats.pendingAppointments,
                icon: Clock,
                cls: "bg-amber-50 text-amber-700 border-amber-100",
                iconCls: "text-amber-500",
              },
              {
                label: "Cancelled",
                value: stats.cancelledAppointments,
                icon: XCircle,
                cls: "bg-red-50 text-red-700 border-red-100",
                iconCls: "text-red-400",
              },
            ].map(({ label, value, icon: Icon, cls, iconCls }) => (
              <div
                key={label}
                className={`flex items-center gap-4 p-5 rounded-xl border ${cls}`}
              >
                <Icon size={28} className={iconCls} />
                <div>
                  <p className="text-2xl font-black tabular-nums">{value}</p>
                  <p className="text-xs font-semibold opacity-70 mt-0.5">
                    {label}
                  </p>
                </div>
                {stats.totalAppointments > 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold">
                      {Math.round((value / stats.totalAppointments) * 100)}%
                    </p>
                    <p className="text-xs opacity-60">of total</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Recent Users
            </h2>
            <button
              onClick={() => router.push("/admin/users")}
              className="text-xs font-semibold text-black/70 hover:text-black/50 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-32" />
                    <div className="h-2.5 bg-gray-100 animate-pulse rounded w-48" />
                  </div>
                </div>
              ))
            ) : recentUsers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No users yet
              </p>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {user.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.fullName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xs font-bold text-violet-600">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate capitalize">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <p className="text-xs text-gray-600 whitespace-nowrap">
                    {format(new Date(user.createdAt), "MMM d")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              Recent Appointments
            </h2>
            <button
              onClick={() => router.push("/admin/appointments")}
              className="text-xs font-semibold text-black/70 hover:text-black/50 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-36" />
                    <div className="h-2.5 bg-gray-100 animate-pulse rounded w-52" />
                  </div>
                  <div className="h-5 w-16 bg-gray-100 animate-pulse rounded-full" />
                </div>
              ))
            ) : recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                No appointments yet
              </p>
            ) : (
              recentAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {appt.clientName || appt.clientEmail || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {appt.date
                        ? format(new Date(appt.date), "MMM d, yyyy")
                        : "No date"}
                      {appt.organizationId?.organizationName
                        ? ` · ${appt.organizationId.organizationName}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                      statusColor[appt.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
