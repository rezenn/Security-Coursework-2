"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";
import { authApi } from "@/lib/api";
import {
  Spinner,
  ErrorAlert,
  SuccessAlert,
  PageLoader,
} from "@/components/shared";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { validatePasswordPolicy } from "@/lib/utils/password";

const schema = z
  .object({
    email: z.string().email("Valid email required"),
    username: z
      .string()
      .min(3, "Min 3 characters")
      .max(30, "Max 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ - only"),
    password: z.string().min(12, "Minimum 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
type Form = z.infer<typeof schema>;

// Google "G" icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
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

export default function RegisterPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [authLoading, isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const pw = watch("password") || "";
  const email = watch("email") || "";
  const policyErrors = validatePasswordPolicy(pw);

  const handleGoogleRegister = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/google`;
  };

  const onSubmit = async (data: Form) => {
    if (policyErrors.length > 0) {
      setError("Password does not meet all requirements");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let captchaToken: string | undefined;
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        captchaToken = await (window as any).grecaptcha
          .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, {
            action: "register",
          })
          .catch(() => undefined);
      }
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        captchaToken,
      });
      setSuccess(
        "Account created! Check your email to verify before logging in.",
      );
      toast.success("Registration successful!");
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Registration failed. Please try again.",
      );
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
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 mt-2">
            Join GyanKosh and start learning
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <ErrorAlert message={error} />
          </div>
        )}
        {success && (
          <div className="mb-5">
            <SuccessAlert message={success} />
          </div>
        )}

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
            />
            {errors.email && (
              <p className="field-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="label">Username</label>
            <input
              {...register("username")}
              type="text"
              placeholder="your_username"
              className="input"
              autoComplete="username"
            />
            {errors.username && (
              <p className="field-error">{errors.username.message}</p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Letters, numbers, hyphens and underscores only
            </p>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="At least 12 characters"
                className="input pr-11"
                autoComplete="new-password"
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
            <PasswordStrengthMeter password={pw} userInputs={[email]} />
          </div>

          <div>
            <label className="label">Confirm password</label>
            <input
              {...register("confirmPassword")}
              type={showPw ? "text" : "password"}
              placeholder="Repeat your password"
              className="input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="field-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || policyErrors.length > 0}
            className="btn-primary w-full h-11 text-base"
          >
            {loading ? <Spinner size={18} /> : null}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        {/* Divider */}
        <div className="relative m-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-900 px-3 text-slate-500">
              or register with email
            </span>
          </div>
        </div>

        {/* Google Sign-Up */}
        <button
          onClick={handleGoogleRegister}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium px-4 h-11 rounded-lg transition-colors border border-slate-200 mb-5"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <p className="text-center text-slate-400 text-sm mt-7">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
