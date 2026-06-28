"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { Spinner, ErrorAlert } from "@/components/shared";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
  mfaToken: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setError("");
    setLoading(true);
    try {
      // Get reCAPTCHA token
      let captchaToken: string | undefined;
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        captchaToken = await (window as any).grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          { action: "login" },
        );
      }
      const result = await login(data.email, data.password, captchaToken, data.mfaToken);
      if (result.mfaRequired) {
        setMfaRequired(true);
        toast.info("Enter your 6-digit MFA code to continue");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setError(msg);
      if (msg.includes("locked")) {
        toast.error("Account locked. Try again after 15 minutes.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* reCAPTCHA v3 */}
      <script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        async
        defer
      />

      <div className="card">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <LogIn className="text-blue-400" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 text-sm">Sign in to your account</p>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="label mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                className="input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {/* MFA field — shown only after first step */}
          {mfaRequired && (
            <div>
              <label className="label">
                <ShieldCheck size={14} className="inline mr-1 text-blue-400" />
                6-digit MFA Code
              </label>
              <input
                {...register("mfaToken")}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="input tracking-[0.3em] text-center text-lg"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                Open your authenticator app and enter the current code. Or use a backup code (XX-XX format).
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? <Spinner size={16} /> : <LogIn size={16} />}
            {mfaRequired ? "Verify & Sign In" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
            Create one
          </Link>
        </p>

        <p className="text-center text-xs text-slate-600 mt-4">
          Protected by reCAPTCHA v3 — rate limiting and account lockout active
        </p>
      </div>
    </>
  );
}
