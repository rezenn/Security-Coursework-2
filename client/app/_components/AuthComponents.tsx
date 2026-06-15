// "use client";
// import React, { useState } from "react";

// // ─── Alert ────────────────────────────────────────────────────────────────────
// type AlertType = "error" | "success" | "info" | "warning";

// export function Alert({ type, message }: { type: AlertType; message: string }) {
//   const styles: Record<AlertType, string> = {
//     error: "bg-red-50 border-red-300 text-red-800",
//     success: "bg-green-50 border-green-300 text-green-800",
//     info: "bg-blue-50 border-blue-300 text-blue-800",
//     warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
//   };
//   const icons: Record<AlertType, string> = {
//     error: "✕",
//     success: "✓",
//     info: "ℹ",
//     warning: "⚠",
//   };
//   return (
//     <div
//       className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles[type]}`}
//     >
//       <span className="mt-0.5 font-bold shrink-0">{icons[type]}</span>
//       <span>{message}</span>
//     </div>
//   );
// }

// // ─── Input ────────────────────────────────────────────────────────────────────
// interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
//   label: string;
//   error?: string;
// }

// export function Input({
//   label,
//   error,
//   id,
//   className = "",
//   ...props
// }: InputProps) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label htmlFor={id} className="text-sm font-medium text-gray-700">
//         {label}
//       </label>
//       <input
//         id={id}
//         className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition
//           focus:border-blue-500 focus:ring-2 focus:ring-blue-100
//           disabled:cursor-not-allowed disabled:bg-gray-50
//           ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"} ${className}`}
//         {...props}
//       />
//       {error && <p className="text-xs text-red-600">{error}</p>}
//     </div>
//   );
// }

// // ─── Textarea ─────────────────────────────────────────────────────────────────
// interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
//   label: string;
//   error?: string;
// }

// export function Textarea({
//   label,
//   error,
//   id,
//   className = "",
//   ...props
// }: TextareaProps) {
//   return (
//     <div className="flex flex-col gap-1">
//       <label htmlFor={id} className="text-sm font-medium text-gray-700">
//         {label}
//       </label>
//       <textarea
//         id={id}
//         className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition resize-none
//           focus:border-blue-500 focus:ring-2 focus:ring-blue-100
//           disabled:cursor-not-allowed disabled:bg-gray-50
//           ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"} ${className}`}
//         {...props}
//       />
//       {error && <p className="text-xs text-red-600">{error}</p>}
//     </div>
//   );
// }

// // ─── PasswordInput ────────────────────────────────────────────────────────────
// export function PasswordInput({ label, error, id, ...props }: InputProps) {
//   const [show, setShow] = useState(false);
//   return (
//     <div className="flex flex-col gap-1">
//       <label htmlFor={id} className="text-sm font-medium text-gray-700">
//         {label}
//       </label>
//       <div className="relative">
//         <input
//           id={id}
//           type={show ? "text" : "password"}
//           className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition
//             focus:border-blue-500 focus:ring-2 focus:ring-blue-100
//             disabled:cursor-not-allowed disabled:bg-gray-50
//             ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
//           {...props}
//         />
//         <button
//           type="button"
//           onClick={() => setShow((s) => !s)}
//           className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//           tabIndex={-1}
//           aria-label={show ? "Hide password" : "Show password"}
//         >
//           {show ? (
//             <svg
//               className="h-4 w-4"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
//               />
//             </svg>
//           ) : (
//             <svg
//               className="h-4 w-4"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//               />
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//               />
//             </svg>
//           )}
//         </button>
//       </div>
//       {error && <p className="text-xs text-red-600">{error}</p>}
//     </div>
//   );
// }

// // ─── PasswordStrength ─────────────────────────────────────────────────────────
// export function PasswordStrength({ password }: { password: string }) {
//   const checks = [
//     { label: "12+ characters", ok: password.length >= 12 },
//     { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
//     { label: "Lowercase letter", ok: /[a-z]/.test(password) },
//     { label: "Number", ok: /[0-9]/.test(password) },
//     { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
//   ];
//   const score = checks.filter((c) => c.ok).length;
//   const labels = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
//   const colors = [
//     "bg-gray-200",
//     "bg-red-400",
//     "bg-orange-400",
//     "bg-yellow-400",
//     "bg-green-400",
//     "bg-emerald-500",
//   ];
//   if (!password) return null;
//   return (
//     <div className="mt-2 space-y-2">
//       <div className="flex gap-1">
//         {[1, 2, 3, 4, 5].map((i) => (
//           <div
//             key={i}
//             className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-gray-200"}`}
//           />
//         ))}
//       </div>
//       <p className="text-xs text-gray-500">
//         Strength:{" "}
//         <span className="font-medium">{score > 0 ? labels[score] : "—"}</span>
//       </p>
//       <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
//         {checks.map((c) => (
//           <li
//             key={c.label}
//             className={`flex items-center gap-1 text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}
//           >
//             <span>{c.ok ? "✓" : "○"}</span> {c.label}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// // ─── Button ───────────────────────────────────────────────────────────────────
// interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
//   loading?: boolean;
//   variant?: "primary" | "secondary" | "ghost" | "danger";
//   size?: "sm" | "md";
// }

// export function Button({
//   children,
//   loading,
//   variant = "primary",
//   size = "md",
//   className = "",
//   disabled,
//   ...props
// }: ButtonProps) {
//   const base =
//     "inline-flex w-full items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed";
//   const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm" };
//   const variants = {
//     primary:
//       "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
//     secondary:
//       "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50",
//     ghost: "bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-400",
//     danger:
//       "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
//   };
//   return (
//     <button
//       disabled={disabled || loading}
//       className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
//       {...props}
//     >
//       {loading && (
//         <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//           <circle
//             className="opacity-25"
//             cx="12"
//             cy="12"
//             r="10"
//             stroke="currentColor"
//             strokeWidth="4"
//           />
//           <path
//             className="opacity-75"
//             fill="currentColor"
//             d="M4 12a8 8 0 018-8v8H4z"
//           />
//         </svg>
//       )}
//       {children}
//     </button>
//   );
// }

// // ─── AuthCard ─────────────────────────────────────────────────────────────────
// export function AuthCard({
//   title,
//   subtitle,
//   children,
// }: {
//   title: string;
//   subtitle?: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
//       <div className="w-full max-w-md">
//         <div className="mb-8 text-center">
//           <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white text-xl font-bold shadow-lg shadow-blue-200">
//             G
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900">GyanKosh</h1>
//           <p className="mt-1 text-xs text-gray-400">Secure Learning Platform</p>
//         </div>
//         <div className="rounded-2xl border border-gray-200 bg-white px-8 py-8 shadow-sm">
//           <div className="mb-6">
//             <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
//             {subtitle && (
//               <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
//             )}
//           </div>
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── OTPInput ─────────────────────────────────────────────────────────────────
// export function OTPInput({
//   value,
//   onChange,
//   length = 6,
// }: {
//   value: string;
//   onChange: (val: string) => void;
//   length?: number;
// }) {
//   const digits = value
//     .split("")
//     .concat(Array(length).fill(""))
//     .slice(0, length);

//   const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
//     if (e.key === "Backspace") {
//       const newDigits = [...digits];
//       if (newDigits[idx]) {
//         newDigits[idx] = "";
//         onChange(newDigits.join(""));
//       } else if (idx > 0) {
//         const prev = document.getElementById(
//           `otp-${idx - 1}`,
//         ) as HTMLInputElement;
//         prev?.focus();
//         newDigits[idx - 1] = "";
//         onChange(newDigits.join(""));
//       }
//     }
//   };

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     idx: number,
//   ) => {
//     const char = e.target.value.replace(/\D/g, "").slice(-1);
//     const newDigits = [...digits];
//     newDigits[idx] = char;
//     onChange(newDigits.join(""));
//     if (char && idx < length - 1) {
//       const next = document.getElementById(
//         `otp-${idx + 1}`,
//       ) as HTMLInputElement;
//       next?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     const pasted = e.clipboardData
//       .getData("text")
//       .replace(/\D/g, "")
//       .slice(0, length);
//     onChange(pasted.padEnd(length, "").slice(0, length));
//     e.preventDefault();
//   };

//   return (
//     <div className="flex gap-2 justify-center" onPaste={handlePaste}>
//       {digits.map((d, i) => (
//         <input
//           key={i}
//           id={`otp-${i}`}
//           type="text"
//           inputMode="numeric"
//           maxLength={1}
//           value={d}
//           onChange={(e) => handleChange(e, i)}
//           onKeyDown={(e) => handleKey(e, i)}
//           className="h-12 w-12 rounded-lg border border-gray-300 text-center text-lg font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//         />
//       ))}
//     </div>
//   );
// }

// // ─── Divider ──────────────────────────────────────────────────────────────────
// export function Divider({ label }: { label?: string }) {
//   return (
//     <div className="flex items-center gap-3">
//       <hr className="flex-1 border-gray-200" />
//       {label && <span className="text-xs text-gray-400">{label}</span>}
//       <hr className="flex-1 border-gray-200" />
//     </div>
//   );
// }

// // ─── RecaptchaBadge ───────────────────────────────────────────────────────────
// export function RecaptchaBadge() {
//   return (
//     <p className="text-center text-xs text-gray-400">
//       Protected by reCAPTCHA v3.{" "}
//       <a
//         href="https://policies.google.com/privacy"
//         className="underline hover:text-gray-600"
//         target="_blank"
//         rel="noreferrer"
//       >
//         Privacy
//       </a>{" "}
//       &amp;{" "}
//       <a
//         href="https://policies.google.com/terms"
//         className="underline hover:text-gray-600"
//         target="_blank"
//         rel="noreferrer"
//       >
//         Terms
//       </a>
//     </p>
//   );
// }

// // ─── Spinner ──────────────────────────────────────────────────────────────────
// export function Spinner({ className = "" }: { className?: string }) {
//   return (
//     <div
//       className={`flex min-h-screen items-center justify-center ${className}`}
//     >
//       <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
//     </div>
//   );
// }
