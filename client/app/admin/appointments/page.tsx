"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  ChevronDown,
  Loader2,
  FileText,
  AlertTriangle,
  Trash2,
  Building2,
  RefreshCw,
} from "lucide-react";
import {
  handleGetAllAppointments,
  handleCancelAppointment,
  handleCompleteAppointment,
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
  userId?: string | { fullName?: string; email?: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmClass,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
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
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="w-full mb-4 border border-gray-200"></div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            No, keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors ${confirmClass}`}
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    type: "complete" | "cancel";
    appointmentId: string;
    clientName: string;
  }>({ open: false, type: "complete", appointmentId: "", clientName: "" });

  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [appointments, search, statusFilter]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await handleGetAllAppointments();
      if (res.success && Array.isArray(res.data)) {
        setAppointments(res.data as Appointment[]);
      } else {
        toast.error(res.message || "Failed to load appointments");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
          a.clientName?.toLowerCase().includes(q) ||
          a.clientEmail?.toLowerCase().includes(q) ||
          a.clientPhoneNumber?.includes(q) ||
          a.departmentName?.toLowerCase().includes(q) ||
          getOrgName(a.organizationId)?.toLowerCase().includes(q),
      );
    }
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setFiltered(result);
    setPage(1);
  };

  const getOrgName = (orgId: any): string => {
    if (!orgId) return "—";
    if (typeof orgId === "object") return orgId.organizationName || "—";
    return String(orgId).substring(0, 8) + "...";
  };

  const openModal = (
    type: "complete" | "cancel",
    appointmentId: string,
    clientName: string,
  ) => {
    setModal({ open: true, type, appointmentId, clientName });
  };

  const closeModal = () => {
    if (!actionLoading) setModal((m) => ({ ...m, open: false }));
  };

  const updateStatus = (id: string, status: "completed" | "cancelled") => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status } : a)),
    );
    setSelectedAppt((prev) => (prev?._id === id ? { ...prev, status } : prev));
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      if (modal.type === "complete") {
        const res = await handleCompleteAppointment(modal.appointmentId);
        if (res.success) {
          toast.success("Marked as completed");
          updateStatus(modal.appointmentId, "completed");
        } else {
          toast.error(res.message || "Failed");
        }
      } else {
        const res = await handleCancelAppointment(modal.appointmentId);
        if (res.success) {
          toast.success("Appointment cancelled");
          updateStatus(modal.appointmentId, "cancelled");
        } else {
          toast.error(res.message || "Failed");
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setActionLoading(false);
      setModal((m) => ({ ...m, open: false }));
    }
  };

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <>
      <ConfirmModal
        isOpen={modal.open}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        title={
          modal.type === "complete"
            ? "Complete Appointment"
            : "Cancel Appointment"
        }
        message={
          modal.type === "complete"
            ? `Mark the appointment for ${modal.clientName} as completed?`
            : `Cancel the appointment for ${modal.clientName}? This cannot be undone.`
        }
        confirmLabel={
          modal.type === "complete" ? "Yes, Complete" : "Yes, Cancel"
        }
        confirmClass={
          modal.type === "complete"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }
      />

      <div className="max-w-7xl mx-auto px-1 py-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              All Appointments
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage every appointment across all organizations
            </p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(["pending", "confirmed", "completed", "cancelled"] as const).map(
            (s) => (
              <div
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={`bg-white border rounded-lg  cursor-pointer shadow-sm p-5 hover:shadow-md transition-shadow ${
                  statusFilter === s
                    ? "border-gray-900 ring-1 ring-gray-900"
                    : "border-gray-200"
                }`}
              >
                <p className="text-2xl font-bold text-gray-900">{counts[s]}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{s}</p>
              </div>
            ),
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Table */}
          <div className="flex-1 min-w-0">
            {/* Search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search Client, email, phone, organization..."
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
                  <option value="confirmed">
                    Confirmed ({counts.confirmed})
                  </option>
                  <option value="completed">
                    Completed ({counts.completed})
                  </option>
                  <option value="cancelled">
                    Cancelled ({counts.cancelled})
                  </option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText size={32} strokeWidth={1.5} />
                  <p className="mt-3 text-sm">No appointments found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-200 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                            Client
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell whitespace-nowrap">
                            Organization
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell whitespace-nowrap">
                            Date & Time
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell whitespace-nowrap">
                            Department
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginated.map((appt) => (
                          <tr
                            key={appt._id}
                            className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                              selectedAppt?._id === appt._id ? "bg-blue-50" : ""
                            }`}
                            onClick={() =>
                              setSelectedAppt(
                                selectedAppt?._id === appt._id ? null : appt,
                              )
                            }
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate max-w-[130px]">
                                {appt.clientName || "Unknown"}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[130px]">
                                {appt.clientEmail}
                              </p>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <div className="flex items-center">
                                <span className="text-gray-600 text-xs ">
                                  {getOrgName(appt.organizationId)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <p className="text-gray-800 whitespace-nowrap">
                                {appt.date
                                  ? format(new Date(appt.date), "MMM d, yyyy")
                                  : "—"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {appt.timeslot?.startTime || "—"}
                                {appt.timeslot?.endTime
                                  ? ` - ${appt.timeslot.endTime}`
                                  : ""}
                              </p>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <p className="text-gray-800 text-md">
                                {appt.departmentName || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                                  STATUS_COLORS[appt.status] ||
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {appt.status}
                              </span>
                            </td>
                            <td
                              className="px-4 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {appt.status !== "completed" &&
                                appt.status !== "cancelled" && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        openModal(
                                          "complete",
                                          appt._id,
                                          appt.clientName,
                                        )
                                      }
                                      className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
                                      title="Mark completed"
                                    >
                                      <CheckCircle size={14} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        openModal(
                                          "cancel",
                                          appt._id,
                                          appt.clientName,
                                        )
                                      }
                                      className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
                                      title="Cancel"
                                    >
                                      <XCircle size={14} />
                                    </button>
                                  </div>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-100 text-sm text-gray-800">
                      <span>
                        {" "}
                        Showing &nbsp;
                        {(page - 1) * PER_PAGE + 1}&nbsp;to&nbsp;
                        {Math.min(page * PER_PAGE, filtered.length)}
                        &nbsp;of&nbsp;
                        {filtered.length} appointments
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-2 text-sm font-medium text-gray-900">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedAppt && (
            <div className="lg:w-80 shrink-0">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-4">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-fuchsia-600 text-sm">
                    Appointment Details
                  </h3>
                  <button
                    onClick={() => setSelectedAppt(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Status</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        STATUS_COLORS[selectedAppt.status]
                      }`}
                    >
                      {selectedAppt.status}
                    </span>
                  </div>

                  {/* Organization */}
                  <div>
                    <p className="text-xs font-semibold text-gray-800  mb-1.5">
                      Organization
                    </p>
                    <div className="flex items-center gap-2">
                      <Building2 size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-800">
                        {getOrgName(selectedAppt.organizationId)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-800 ">
                      Client
                    </p>
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-800">
                        {selectedAppt.clientName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-600 break-all">
                        {selectedAppt.clientEmail}
                      </span>
                    </div>
                    {selectedAppt.clientPhoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600">
                          {selectedAppt.clientPhoneNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-800 ">
                      Schedule
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-800">
                        {selectedAppt.date
                          ? format(new Date(selectedAppt.date), "MMMM d, yyyy")
                          : "—"}
                      </span>
                    </div>
                    {selectedAppt.timeslot && (
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-800">
                          {selectedAppt.timeslot.startTime} –{" "}
                          {selectedAppt.timeslot.endTime}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  {selectedAppt.departmentName && (
                    <div>
                      <p className="text-xs font-semibold text-gray-800  mb-1">
                        Department
                      </p>
                      <p className="text-sm text-gray-800">
                        {selectedAppt.departmentName}
                      </p>
                    </div>
                  )}

                  {/* Payment */}
                  {selectedAppt.paymentAmount !== undefined && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-800 ">
                        Payment
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-medium">
                            Rs {selectedAppt.paymentAmount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Method</span>
                          <span className="capitalize">
                            {selectedAppt.paymentMethod || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status</span>
                          <span
                            className={`capitalize text-xs font-medium px-1.5 py-0.5 rounded ${
                              selectedAppt.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {selectedAppt.paymentStatus || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedAppt.notes && (
                    <div>
                      <p className="text-xs font-semibold text-gray-800  mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {selectedAppt.notes}
                      </p>
                    </div>
                  )}

                  {/* Admin actions */}
                  {selectedAppt.status !== "completed" &&
                    selectedAppt.status !== "cancelled" && (
                      <div className="pt-2 space-y-2 border-t border-gray-100">
                        <button
                          onClick={() =>
                            openModal(
                              "complete",
                              selectedAppt._id,
                              selectedAppt.clientName,
                            )
                          }
                          className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                        >
                          <CheckCircle size={14} />
                          Mark as Completed
                        </button>
                        <button
                          onClick={() =>
                            openModal(
                              "cancel",
                              selectedAppt._id,
                              selectedAppt.clientName,
                            )
                          }
                          className="w-full py-2 border border-red-300 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition-colors"
                        >
                          <XCircle size={14} />
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
