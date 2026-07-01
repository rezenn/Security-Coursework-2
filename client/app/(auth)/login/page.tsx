"use client";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

// Google "G" SVG icon
const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Show error from Google OAuth failure redirect
  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "google_failed") {
      setError(
        "Google sign-in failed. Please try again or use email/password.",
      );
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth route
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`;
  };

  const onSubmit = async (data: Form) => {
    setError("");
    setLoading(true);
    try {
      let captchaToken: string | undefined;
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        captchaToken = await (window as any).grecaptcha
          .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
            action: "login",
          })
          .catch(() => undefined);
      }
      const result = await login(
        data.email,
        data.password,
        captchaToken,
        data.mfaToken,
      );
      if (result.mfaRequired) {
        setMfaRequired(true);
        toast.info("Enter the 6-digit code from your authenticator app");
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
        async
        defer
      />

      <div className="w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Sign in</h1>
          <p className="text-slate-400 mt-2">Access your GyanKosh account</p>
        </div>

        {error && (
          <div className="mb-5">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Email / Password form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
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
            {errors.email && (
              <p className="field-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
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
            {errors.password && (
              <p className="field-error">{errors.password.message}</p>
            )}
          </div>

          {/* MFA step */}
          {mfaRequired && (
            <div className="bg-blue-500/8 border border-blue-500/25 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={15} className="text-blue-400" />
                <p className="text-sm font-medium text-blue-300">
                  Two-factor authentication
                </p>
              </div>
              <input
                {...register("mfaToken")}
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="000000"
                className="input tracking-[0.4em] text-center text-xl font-mono"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the 6-digit code from your authenticator app, or a backup
                code (XX-XX format).
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 text-base"
          >
            {loading ? <Spinner size={18} /> : null}
            {loading
              ? "Signing in..."
              : mfaRequired
                ? "Verify & Sign In"
                : "Sign In"}
          </button>
        </form>
        {/* Divider */}
        <div className="relative m-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500">
              or sign in with email
            </span>
          </div>
        </div>
        {/* Google Sign-In */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium px-4 h-11 rounded-lg transition-colors border border-slate-200 mb-5"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="text-center text-slate-400 text-sm mt-7">
          No account?{" "}
          <Link
            href="/register"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Create one for free
          </Link>
        </p>
      </div>
    </>
  );
}
