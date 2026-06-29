"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { Spinner, ErrorAlert, PageLoader } from "@/components/shared";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
  mfaToken: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    setError("");
    setLoading(true);
    try {
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
        toast.info("Enter your 6-digit authenticator code");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Invalid email or password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <PageLoader />;
  if (isAuthenticated) return <PageLoader />;

  return (
    <>
      <script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        async defer
      />
      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sign in</h1>
          <p className="text-slate-400 mt-2">Enter your credentials to access GyanKosh</p>
        </div>

        {error && <div className="mb-5"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="label">Email address</label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="label mb-0">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="••••••••••••"
                className="input pr-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>

          {mfaRequired && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-blue-400" />
                <p className="text-sm font-medium text-blue-300">Two-factor authentication</p>
              </div>
              <input
                {...register("mfaToken")}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="input tracking-[0.4em] text-center text-xl font-mono"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Open your authenticator app and enter the 6-digit code.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Spinner size={18} /> : null}
            {loading ? "Signing in..." : mfaRequired ? "Verify & Sign In" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8">
          New to GyanKosh?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </>
  );
}
