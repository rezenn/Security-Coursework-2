"use client";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

// ── Spinner ────────────────────────────────────────────────────────────────────
export const Spinner = ({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) => <Loader2 size={size} className={clsx("animate-spin", className)} />;

// ── Full-page loader ───────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <Spinner size={32} className="text-blue-500" />
  </div>
);

// ── Error alert ────────────────────────────────────────────────────────────────
export const ErrorAlert = ({ message }: { message: string }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
    {message}
  </div>
);

// ── Success alert ──────────────────────────────────────────────────────────────
export const SuccessAlert = ({ message }: { message: string }) => (
  <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">
    {message}
  </div>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────
export const Avatar = ({
  name,
  size = "md",
  imageUrl,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  imageUrl?: string | null;
}) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={clsx(
          "rounded-full object-cover flex-shrink-0 bg-slate-700",
          sizes[size],
        )}
      />
    );
  }
  return (
    <div
      className={clsx(
        "rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0",
        sizes[size],
      )}
    >
      {initials}
    </div>
  );
};

// ── Badge ──────────────────────────────────────────────────────────────────────
export const RoleBadge = ({ role }: { role: string }) => (
  <span className={role === "admin" ? "badge-admin" : "badge-user"}>
    {role}
  </span>
);

// ── Stat card ──────────────────────────────────────────────────────────────────
export const StatCard = ({
  label,
  value,
  icon,
  color = "blue",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) => (
  <div className="card flex items-center gap-4">
    <div
      className={`w-12 h-12 rounded-xl bg-${color}-600/20 flex items-center justify-center text-${color}-400 flex-shrink-0`}
    >
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

// ── Empty state ────────────────────────────────────────────────────────────────
export const EmptyState = ({
  message,
  icon,
  title,
  description,
}: {
  message?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-500">
    {icon && <div className="mb-3 text-slate-600">{icon}</div>}
    <p className="text-sm font-medium text-white">{title || message}</p>
    {description && (
      <p className="text-xs text-slate-400 mt-1 max-w-md text-center">
        {description}
      </p>
    )}
  </div>
);
