"use client";

import { FC, ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const AuthCard: FC<AuthCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
};

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const AuthInput: FC<AuthInputProps> = ({
  label,
  error,
  icon,
  className,
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`w-full rounded-lg border border-slate-300 bg-white px-4 py-3 ${
            icon ? "pl-10" : ""
          } outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-100"
              : ""
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary";
}

export const AuthButton: FC<AuthButtonProps> = ({
  loading,
  variant = "primary",
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={`w-full rounded-lg px-4 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "primary"
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

interface AuthAlertProps {
  type: "error" | "success" | "info";
  message: string;
}

export const AuthAlert: FC<AuthAlertProps> = ({ type, message }) => {
  const styles = {
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
  };

  return (
    <div className={`rounded-lg border ${styles[type]} px-4 py-3 text-sm mb-4`}>
      {message}
    </div>
  );
};
