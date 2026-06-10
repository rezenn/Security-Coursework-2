"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Users,
  AlertCircle,
  Edit3,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { format, isThisMonth, isThisWeek, isToday } from "date-fns";
import { handleGetMyOrganizationDetails } from "@/lib/actions/organization/organization-action";
import {
  handleGetAllAppointments,
  handleGetOrganizationAppointments,
} from "@/lib/actions/appointment/appointment";

interface OrgData {
  organizationName?: string;
  organizationType?: string;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  contactEmail?: string;
  contactPhone?: string;
  fees?: number;
  appointmentDuration?: number;
  advanceBookingDays?: number;
  isActive?: boolean;
  isVerified?: boolean;
  departments?: any[];
  workingHours?: any;
}

interface Appointment {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber?: string;
  date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  timeslot?: { startTime: string; endTime: string };
  notes?: string;
  departmentId?: { name?: string };
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    label: "Pending",
  },
  confirmed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
    label: "Confirmed",
  },
  completed: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-400",
    label: "Completed",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-600",
    dot: "bg-red-400",
    label: "Cancelled",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: status,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,

  loading,
}: {
  title: string;
  value: number | string;
  sub?: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-bold text-black/80  ">{title}</p>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-gray-100 animate-pulse rounded-lg" />
      ) : (
        <p className="text-3xl font-black text-gray-900 tabular-nums">
          {value}
        </p>
      )}
      {sub && !loading && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function OrganizationDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [org, setOrg] = useState<OrgData | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      const orgRes = await handleGetMyOrganizationDetails();

      if (orgRes.success && orgRes.data) {
        const orgData = orgRes.data as any;
        setOrg(orgData as OrgData);
        setProfileIncomplete(
          !orgData.organizationName || !orgData.contactEmail,
        );

        if (orgData._id) {
          const apptRes = await handleGetOrganizationAppointments(orgData._id);
          if (apptRes.success && Array.isArray(apptRes.data)) {
            setAppointments(apptRes.data as Appointment[]);
          }
        }
      } else {
        setProfileIncomplete(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const total = appointments.length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const todayCount = appointments.filter(
    (a) => a.date && isToday(new Date(a.date)),
  ).length;
  const thisWeek = appointments.filter(
    (a) => a.date && isThisWeek(new Date(a.date)),
  ).length;
  const thisMonth = appointments.filter(
    (a) => a.date && isThisMonth(new Date(a.date)),
  ).length;

  const recentAppointments = [...appointments]
    .sort(
      (a, b) =>
        new Date(b.date || b._id).getTime() -
        new Date(a.date || a._id).getTime(),
    )
    .slice(0, 6);

  const upcomingToday = appointments
    .filter(
      (a) =>
        a.date &&
        isToday(new Date(a.date)) &&
        a.status !== "cancelled" &&
        a.status !== "completed",
    )
    .sort((a, b) =>
      (a.timeslot?.startTime || "").localeCompare(b.timeslot?.startTime || ""),
    );

  return (
    <div className="max-w-7xl mx-auto  sm:px-6 py-1 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 ">
            Organization Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/organization/profile/update-profile")}
            className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl text-sm font-semibold hover:bg-fuchsia-700 transition-colors shadow-sm"
          >
            <Edit3 size={14} />
            Edit Profile
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle className="text-red-500 shrink-0" size={18} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={total}
          sub="all time"
          icon={CalendarCheck}
          iconBg="bg-fuchsia-50"
          iconColor="text-fuchsia-600"
          loading={loading}
        />
        <StatCard
          title="Today"
          value={todayCount}
          sub={`${thisWeek} this week`}
          icon={Calendar}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={pending}
          sub="waiting"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="Completed"
          value={completed}
          sub={`${cancelled} cancelled`}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
              <h2 className="font-bold text-fuchsia-800 flex items-center gap-2">
                Today's Schedule
                {todayCount > 0 && (
                  <span className="ml-1 bg-fuchsia-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {todayCount}
                  </span>
                )}
              </h2>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : upcomingToday.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <CalendarCheck size={36} strokeWidth={1.5} />
                <p className="text-sm mt-3 font-medium">
                  No appointments today
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingToday.map((appt) => (
                  <div
                    key={appt._id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-center shrink-0 w-14">
                      <p className="text-xs font-bold text-fuchsia-600">
                        {appt.timeslot?.startTime || "--:--"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appt.timeslot?.endTime || ""}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {appt.clientName || appt.clientEmail || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {appt.clientEmail}
                        {appt.departmentId?.name
                          ? ` · ${appt.departmentId.name}`
                          : ""}
                      </p>
                    </div>

                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
              <h2 className="font-bold text-fuchsia-600 flex items-center gap-2">
                Recent Appointments
              </h2>
              <button
                onClick={() => router.push("/organization/appointments")}
                className="text-xs font-semibold text-black/70 hover:text-black/50  flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-gray-100 animate-pulse rounded-xl"
                  />
                ))}
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <Users size={36} strokeWidth={1.5} />
                <p className="text-sm mt-3 font-medium">No appointments yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentAppointments.map((appt) => (
                  <div
                    key={appt._id}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {appt.clientName || appt.clientEmail || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {appt.date
                          ? format(new Date(appt.date), "MMM d, yyyy")
                          : "No date"}
                        {appt.timeslot?.startTime
                          ? ` · ${appt.timeslot.startTime}`
                          : ""}
                      </p>
                    </div>

                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Org Profile Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 pt-2 pb-6">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 bg-gray-100 animate-pulse rounded w-40" />
                  <div className="h-3.5 bg-gray-100 animate-pulse rounded w-28" />
                </div>
              ) : (
                <>
                  <p className="font-black text-gray-900 text-lg leading-tight">
                    {org?.organizationName || "Organization Name"}
                  </p>
                  {org?.organizationType && (
                    <p className="text-xs font-semibold text-fuchsia-600  tracking-wide mt-0.5 capitalize">
                      {org.organizationType}
                    </p>
                  )}
                  {org?.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {org.description}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 space-y-2.5">
                {[
                  {
                    icon: Mail,
                    value: org?.contactEmail,
                    placeholder: "No email set",
                  },
                  {
                    icon: Phone,
                    value: org?.contactPhone,
                    placeholder: "No phone set",
                  },
                  {
                    icon: MapPin,
                    value:
                      [org?.street, org?.city, org?.state]
                        .filter(Boolean)
                        .join(", ") || null,
                    placeholder: "No address set",
                  },
                ].map(({ icon: Icon, value, placeholder }, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon size={13} className="text-gray-300 mt-0.5 shrink-0" />
                    <span
                      className={`text-xs ${value ? "text-gray-600" : "text-gray-300 italic"}`}
                    >
                      {loading ? (
                        <span className="inline-block h-3 w-32 bg-gray-100 animate-pulse rounded" />
                      ) : (
                        value || placeholder
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("/organization/details/edit")}
                className="mt-4 w-full py-2.5 rounded-xl border-2 border-fuchsia-100 bg-fuchsia-600 text-white text-xs font-bold hover:bg-fuchsia-500 transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit3 size={12} />
                Edit Organization Profile
              </button>
            </div>
          </div>

          {/* Appointment Settings */}
          {!loading && org && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-bold text-fuchsia-400 mb-4">
                Appointment Settings
              </h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Duration",
                    value: org.appointmentDuration
                      ? `${org.appointmentDuration} min`
                      : "Not set",
                  },
                  {
                    label: "Advance Booking",
                    value: org.advanceBookingDays
                      ? `${org.advanceBookingDays} days`
                      : "Not set",
                  },
                  {
                    label: "Fee",
                    value:
                      org.fees !== undefined ? `Rs ${org.fees}` : "Not set",
                  },
                  {
                    label: "Departments",
                    value: org.departments?.length
                      ? `${org.departments.length} department${org.departments.length > 1 ? "s" : ""}`
                      : "None",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-600">{label}</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
