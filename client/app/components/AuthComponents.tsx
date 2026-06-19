"use client";
import React, { useState } from "react";

type AlertType = "error" | "success" | "info" | "warning";

export function Alert({
  type,
  message,
}: {
  type: AlertType;
  message: string;
}) {
  const styles: Record<AlertType, string> = {
    error: "bg-red-50 border-red-300 text-red-800",
    success: "bg-green-50 border-green-300 text-green-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
  };
  const icons: Record<AlertType, string> = {
    error: "✕",
    success: "✓",
    info: "ℹ",
    warning: "⚠",
  };
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
    >
      <span className="mt-0.5 font-bold">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          disabled:cursor-not-allowed disabled:bg-gray-50
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PasswordInput({ label, error, id, ...props }: InputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition
            focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            disabled:cursor-not-allowed disabled:bg-gray-50
            ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "12+ characters", ok: password.length >= 12 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.ok).length;
  const labels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const colors = [
    "bg-gray-200",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-400",
    "bg-emerald-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-1 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? colors[score] : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Strength:{" "}
        <span className="font-medium">{score > 0 ? labels[score] : "—"}</span>
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1 text-xs ${
              c.ok ? "text-green-600" : "text-gray-400"
            }`}
          >
            <span>{c.ok ? "✓" : "○"}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({
  children,
  loading,
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50",
    ghost:
      "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-400",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white text-lg font-bold shadow-md">
            G
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GyanKosh</h1>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function OTPInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (val: string) => void;
  length?: number;
}) {
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      const newDigits = [...digits];
      if (newDigits[idx]) {
        newDigits[idx] = "";
        onChange(newDigits.join(""));
      } else if (idx > 0) {
        const prev = document.getElementById(`otp-${idx - 1}`) as HTMLInputElement;
        prev?.focus();
        newDigits[idx - 1] = "";
        onChange(newDigits.join(""));
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[idx] = char;
    onChange(newDigits.join(""));
    if (char && idx < length - 1) {
      const next = document.getElementById(`otp-${idx + 1}`) as HTMLInputElement;
      next?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length));
    e.preventDefault();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      ))}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <hr className="flex-1 border-gray-200" />
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <hr className="flex-1 border-gray-200" />
    </div>
  );
}
