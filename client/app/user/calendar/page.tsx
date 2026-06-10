"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  X,
  Calendar as CalIcon,
  Clock,
  Building2,
  Loader2,
} from "lucide-react";
import { handleGetUserAppointments } from "@/lib/actions/appointment/appointment";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

interface Appointment {
  _id: string;
  clientName: string;
  clientEmail: string;
  date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "noShow";
  timeslot?: { startTime: string; endTime: string };
  departmentName?: string;
  organizationId?: any;
  notes?: string;
  paymentAmount?: number;
  paymentMethod?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Appointment;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
  noShow: "#6b7280",
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  noShow: "bg-gray-100 text-gray-700",
};

function parseDateToLocal(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseTime(base: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function toCalendarEvents(appointments: Appointment[]): CalendarEvent[] {
  if (!appointments?.length) return [];
  return appointments.map((a) => {
    const base = parseDateToLocal(a.date);
    const start = a.timeslot?.startTime
      ? parseTime(base, a.timeslot.startTime)
      : new Date(new Date(base).setHours(9, 0));
    const end = a.timeslot?.endTime
      ? parseTime(base, a.timeslot.endTime)
      : new Date(new Date(base).setHours(9, 30));
    return {
      id: a._id,
      title: a.clientName || a.clientEmail || "Appointment",
      start,
      end,
      resource: a,
    };
  });
}

function EventModal({
  event,
  onClose,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
}) {
  if (!event) return null;
  const appt = event.resource;
  const orgName =
    typeof appt.organizationId === "object"
      ? appt.organizationId?.organizationName
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: STATUS_COLORS[appt.status] || "#6b7280" }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">
                {appt.clientName || "Unknown"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{appt.clientEmail}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BG[appt.status] || "bg-gray-100 text-gray-700"}`}
              >
                {appt.status}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <CalIcon size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">
                {format(event.start, "MMMM d, yyyy")}
              </span>
            </div>
            {appt.timeslot && (
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <span className="text-gray-700">
                  {appt.timeslot.startTime} – {appt.timeslot.endTime}
                </span>
              </div>
            )}
            {appt.departmentName && (
              <div className="flex items-center gap-2.5">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <span className="text-gray-700">{appt.departmentName}</span>
              </div>
            )}
            {orgName && (
              <div className="flex items-center gap-2.5">
                <Building2 size={14} className="text-gray-400 shrink-0" />
                <span className="text-gray-700">{orgName}</span>
              </div>
            )}
            {appt.paymentAmount !== undefined && (
              <p className="text-gray-600">
                Rs {appt.paymentAmount} ·{" "}
                <span className="capitalize">
                  {appt.paymentMethod || "cash"}
                </span>
              </p>
            )}
            {appt.notes && (
              <p className="text-gray-500 italic text-xs bg-gray-50 rounded p-2">
                "{appt.notes}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  useEffect(() => {
    handleGetUserAppointments()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setAppointments(res.data as Appointment[]);
        } else {
          setError(res.message || "Failed to load");
        }
      })
      .catch((e) => setError(e.message || "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => toCalendarEvents(appointments), [appointments]);

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: STATUS_COLORS[event.resource.status] || "#6b7280",
      borderRadius: "5px",
      border: "none",
      color: "white",
      fontSize: "12px",
      padding: "2px 6px",
    },
  });

  return (
    <>
      <EventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
      <div className="max-w-6xl mx-auto px-1 py-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading..."
              : `${appointments.length} appointment${appointments.length !== 1 ? "s" : ""} total`}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 flex-wrap">
            <span className="text-xs font-semibold text-gray-500">Legend:</span>
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <span
                key={status}
                className="flex items-center gap-1.5 text-xs text-gray-600 capitalize"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {status}
              </span>
            ))}
          </div>

          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ height: 620 }}
            >
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Loading appointments...</p>
              </div>
            </div>
          ) : (
            <div className="p-4" style={{ height: 620 }}>
              <Calendar
                localizer={localizer}
                events={events}
                view="month"
                views={["month"]}
                date={date}
                onNavigate={setDate}
                onSelectEvent={(event) =>
                  setSelectedEvent(event as CalendarEvent)
                }
                eventPropGetter={eventStyleGetter}
                style={{ height: "100%" }}
                popup
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
