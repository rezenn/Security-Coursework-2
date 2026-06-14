// "use client";
// // MFA Setup — GyanKosh
// // NIST SP 800-63B §5.1.3: TOTP (RFC 6238) with authenticator app binding
// // Backup codes are single-use and shown only once (OWASP WSTG-AUTHN-06)
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { authApi } from "@/app/lib/api";

// export default function MfaSetupPage() {
//   const router = useRouter();
//   const [step, setStep] = useState<"idle" | "scan" | "done">("idle");
//   const [qrCode, setQrCode] = useState("");
//   const [backupCodes, setBackupCodes] = useState<string[]>([]);
//   const [token, setToken] = useState("");
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const startSetup = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const data = await authApi.setupMfa();
//       setQrCode(data.qrCodeDataUrl);
//       setBackupCodes(data.backupCodes);
//       setStep("scan");
//     } catch (e: unknown) {
//       const err = e as { error?: string; message?: string };
//       setError(err.error || err.message || "Failed to start MFA setup.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const confirmSetup = async () => {
//     if (token.length !== 6) {
//       setError("Enter the 6-digit code from your app.");
//       return;
//     }
//     setLoading(true);
//     setError("");
//     try {
//       await authApi.confirmMfa({ token });
//       setStep("done");
//     } catch (e: unknown) {
//       const err = e as { error?: string; message?: string };
//       setError(err.error || err.message || "Invalid code. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-md px-4">
//       <div
//         style={{
//           background: "var(--vw-card)",
//           border: "1px solid var(--vw-border)",
//         }}
//         className="rounded-2xl p-8 shadow-2xl"
//       >
//         {step === "idle" && (
//           <>
//             <div className="flex items-center gap-2 mb-8">
//               <div
//                 style={{ background: "var(--vw-accent)" }}
//                 className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
//               >
//                 G
//               </div>
//               <span
//                 style={{ color: "var(--vw-text)" }}
//                 className="font-semibold text-sm tracking-wide"
//               >
//                 GyanKosh
//               </span>
//             </div>
//             <h1
//               style={{ color: "var(--vw-text)" }}
//               className="text-2xl font-semibold mb-2"
//             >
//               Two-factor authentication
//             </h1>
//             <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-6">
//               Add an extra layer of security using an authenticator app (Google
//               Authenticator, Authy, etc.).
//             </p>
//             {error && (
//               <div
//                 style={{
//                   background: "var(--vw-error-bg)",
//                   border: "1px solid var(--vw-error-border)",
//                   color: "var(--vw-error-text)",
//                 }}
//                 className="mb-5 p-3 rounded-lg text-sm"
//               >
//                 {error}
//               </div>
//             )}
//             <button
//               onClick={startSetup}
//               disabled={loading}
//               style={{ background: "var(--vw-accent)" }}
//               className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
//             >
//               {loading ? "Setting up…" : "Set up authenticator"}
//             </button>
//           </>
//         )}

//         {step === "scan" && (
//           <>
//             <h1
//               style={{ color: "var(--vw-text)" }}
//               className="text-xl font-semibold mb-2"
//             >
//               Scan QR code
//             </h1>
//             <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-5">
//               Open your authenticator app and scan this code.
//             </p>
//             {qrCode && (
//               <div
//                 style={{
//                   background: "var(--vw-input-bg)",
//                   border: "1px solid var(--vw-border)",
//                 }}
//                 className="rounded-xl p-4 flex items-center justify-center mb-5"
//               >
//                 {/* eslint-disable-next-line @next/next/no-img-element */}
//                 <img
//                   src={qrCode}
//                   alt="MFA QR Code"
//                   className="rounded-lg w-40 h-40"
//                 />
//               </div>
//             )}
//             {error && (
//               <div
//                 style={{
//                   background: "var(--vw-error-bg)",
//                   border: "1px solid var(--vw-error-border)",
//                   color: "var(--vw-error-text)",
//                 }}
//                 className="mb-4 p-3 rounded-lg text-sm"
//               >
//                 {error}
//               </div>
//             )}
//             <label
//               style={{ color: "var(--vw-muted)" }}
//               className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
//             >
//               Confirmation code
//             </label>
//             <input
//               type="text"
//               inputMode="numeric"
//               maxLength={6}
//               value={token}
//               onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
//               onKeyDown={(e) => e.key === "Enter" && confirmSetup()}
//               placeholder="000000"
//               autoComplete="one-time-code"
//               style={{
//                 background: "var(--vw-input-bg)",
//                 border: "1px solid var(--vw-border)",
//                 color: "var(--vw-text)",
//               }}
//               className="w-full px-3.5 py-2.5 rounded-lg text-center text-xl font-semibold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:tracking-normal placeholder:text-gray-600 mb-5"
//             />
//             <button
//               onClick={confirmSetup}
//               disabled={loading}
//               style={{ background: "var(--vw-accent)" }}
//               className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
//             >
//               {loading ? "Verifying…" : "Activate 2FA"}
//             </button>
//           </>
//         )}

//         {step === "done" && (
//           <>
//             <div className="text-center mb-6">
//               <div
//                 style={{
//                   background: "var(--vw-success-bg)",
//                   border: "1px solid var(--vw-success-border)",
//                 }}
//                 className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
//               >
//                 <svg
//                   className="w-5 h-5"
//                   style={{ color: "var(--vw-success-text)" }}
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M5 13l4 4L19 7"
//                   />
//                 </svg>
//               </div>
//               <h1
//                 style={{ color: "var(--vw-text)" }}
//                 className="text-xl font-semibold"
//               >
//                 2FA enabled
//               </h1>
//             </div>
//             <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-3">
//               Save these backup codes — each can only be used once. Store them
//               somewhere safe.
//             </p>
//             <div
//               style={{
//                 background: "var(--vw-input-bg)",
//                 border: "1px solid var(--vw-border)",
//               }}
//               className="rounded-lg p-4 grid grid-cols-2 gap-2 mb-5"
//             >
//               {backupCodes.map((c, i) => (
//                 <code
//                   key={i}
//                   style={{ color: "var(--vw-text)" }}
//                   className="text-xs font-mono"
//                 >
//                   {c}
//                 </code>
//               ))}
//             </div>
//             <button
//               onClick={() => router.push("/dashboard")}
//               style={{ background: "var(--vw-accent)" }}
//               className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-all"
//             >
//               Done — go to dashboard
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
