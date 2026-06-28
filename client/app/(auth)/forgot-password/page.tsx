"use client";
import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { Spinner, ErrorAlert, SuccessAlert } from "@/components/shared";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      let captchaToken: string | undefined;
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        captchaToken = await (window as any).grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          { action: "forgot_password" },
        );
      }
      await authApi.requestReset(email, captchaToken);
      setSuccess("If that email exists, a reset link has been sent. Check your inbox.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} async defer />
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Mail className="text-blue-400" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reset password</h1>
            <p className="text-slate-400 text-sm">We'll send a reset link to your email</p>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
        {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Spinner size={16} /> : <Mail size={16} />}
              Send Reset Link
            </button>
          </form>
        )}

        <Link href="/login" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mt-6">
          <ArrowLeft size={14} /> Back to login
        </Link>
      </div>
    </>
  );
}
