"use client";

import { useEffect, useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Loader2,
  FileText,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  handleGetUserAppointments,
  handleCancelAppointment,
} from "@/lib/actions/appointment/appointment";

type Status = "all" | "pending" | "confirmed" | "completed" | "cancelled";

interface Appointment {
  _id: string;
  clientName: string;
  clientEmail: string;
  clientPhoneNumber?: string;
  date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  timeslot?: { startTime: string; endTime: string };
  departmentName?: string;
  organizationId?: string | { organizationName?: string; _id?: string };
  notes?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  pending: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  loading: boolean;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !loading && onClose()}
      />
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-sm mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Cancel Appointment</h3>
            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to cancel your appointment for{" "}
              <span className="font-medium text-gray-700">{clientName}</span>?
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="w-full mb-4 border border-gray-200"></div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({
  appt,
  onCancel,
}: {
  appt: Appointment;
  onCancel: (id: string, name: string) => void;
}) {
  const orgName =
    typeof appt.organizationId === "object"
      ? appt.organizationId?.organizationName || "Organization"
      : "Organization";

  const apptDate = appt.date ? new Date(appt.date) : null;
  const isUpcoming =
    apptDate &&
    !isPast(apptDate) &&
    appt.status !== "cancelled" &&
    appt.status !== "completed";
  const isTodayAppt = apptDate && isToday(apptDate);

  const canCancel = appt.status !== "cancelled" && appt.status !== "completed";

  return (
    <div
      className={`bg-white border rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${isTodayAppt ? "border-blue-200 bg-blue-50/30" : "border-gray-200"}`}
    >
      {isTodayAppt && (
        <div className="mb-3">
          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
            Today
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 ">
        <div className="flex-1 min-w-0">
          {/* Department */}
          {appt.departmentName && (
            <p className="text-md text-gray-800 mb-3">{appt.departmentName}</p>
          )}

          {/* Date + Time */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-600" />
              {apptDate ? format(apptDate, "MMMM d, yyyy") : "—"}
            </span>
            {appt.timeslot && (
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-gray-600" />
                {appt.timeslot.startTime} – {appt.timeslot.endTime}
              </span>
            )}
          </div>

          {/* Payment */}
          {appt.paymentAmount !== undefined && (
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <span>
                Rs {appt.paymentAmount} · {appt.paymentMethod || "cash"}
              </span>
            </div>
          )}

          {/* Notes */}
          {appt.notes && (
            <p className="mt-2 text-sm text-gray-500 italic line-clamp-1">
              "{appt.notes}"
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <StatusBadge status={appt.status} />
          {canCancel && (
            <button
              onClick={() => onCancel(appt._id, appt.clientName)}
              className="flex p-1 rounded-2xl items-center gap-1 text-xs bg-red-500 text-white hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UserAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    appointmentId: string;
    clientName: string;
  }>({ open: false, appointmentId: "", clientName: "" });

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    applyFilter();
  }, [appointments, search, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await handleGetUserAppointments();
      if (res.success && Array.isArray(res.data)) {
        setAppointments(res.data as Appointment[]);
      } else {
        toast.error(res.message || "Failed to load appointments");
      }
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let result = [...appointments];
    if (statusFilter !== "all")
      result = result.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.departmentName?.toLowerCase().includes(q) ||
          (typeof a.organizationId === "object"
            ? a.organizationId?.organizationName?.toLowerCase().includes(q)
            : false) ||
          a.notes?.toLowerCase().includes(q),
      );
    }
    // Sort: upcoming first
    result.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      const now = Date.now();
      const aUpcoming = aDate >= now;
      const bUpcoming = bDate >= now;
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
      if (aUpcoming && bUpcoming) return aDate - bDate;
      return bDate - aDate;
    });
    setFiltered(result);
  };

  const openCancelModal = (appointmentId: string, clientName: string) => {
    setCancelModal({ open: true, appointmentId, clientName });
  };

  const closeCancelModal = () => {
    if (!cancelLoading) setCancelModal((m) => ({ ...m, open: false }));
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      const res = await handleCancelAppointment(cancelModal.appointmentId);
      if (res.success) {
        toast.success("Appointment cancelled");
        setAppointments((prev) =>
          prev.map((a) =>
            a._id === cancelModal.appointmentId
              ? { ...a, status: "cancelled" }
              : a,
          ),
        );
      } else {
        toast.error(res.message || "Failed to cancel");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCancelLoading(false);
      setCancelModal((m) => ({ ...m, open: false }));
    }
  };

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const upcoming = filtered.filter(
    (a) =>
      a.date &&
      !isPast(new Date(a.date)) &&
      a.status !== "cancelled" &&
      a.status !== "completed",
  );
  const past = filtered.filter((a) => !upcoming.includes(a));

  return (
    <>
      <CancelModal
        isOpen={cancelModal.open}
        onClose={closeCancelModal}
        onConfirm={handleConfirmCancel}
        clientName={cancelModal.clientName}
        loading={cancelLoading}
      />

      <div className="  mx-auto px-1 py-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your appointments
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["pending", "confirmed", "completed", "cancelled"] as const).map(
            (s) => (
              <div
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`bg-white border rounded-lg cursor-pointer  shadow-sm p-5 hover:shadow-md transition-shadow ${
                  statusFilter === s
                    ? "border-gray-900 ring-1 ring-gray-900"
                    : "border-gray-200"
                }`}
              >
                <p className="text-xl font-bold text-gray-900">{counts[s]}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{s}</p>
              </div>
            ),
          )}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search department or organization..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 shadow-sm p-5 hover:shadow-md transition-shadow"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 bg-white shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <option value="all">All ({counts.all})</option>
              <option value="pending">Pending ({counts.pending})</option>
              <option value="confirmed">Confirmed ({counts.confirmed})</option>
              <option value="completed">Completed ({counts.completed})</option>
              <option value="cancelled">Cancelled ({counts.cancelled})</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-purple-400" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <FileText size={40} strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-gray-400">
              No appointments found
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {statusFilter !== "all"
                ? "Try changing the filter"
                : "Book your first appointment"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Upcoming · {upcoming.length}
                </p>
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <AppointmentCard
                      key={appt._id}
                      appt={appt}
                      onCancel={openCancelModal}
                    />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Past · {past.length}
                </p>
                <div className="space-y-3">
                  {past.map((appt) => (
                    <AppointmentCard
                      key={appt._id}
                      appt={appt}
                      onCancel={openCancelModal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
