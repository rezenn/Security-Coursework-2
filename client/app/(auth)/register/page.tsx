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
import { Spinner, ErrorAlert, SuccessAlert, PageLoader } from "@/components/shared";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { validatePasswordPolicy } from "@/lib/utils/password";

const schema = z.object({
  email: z.string().email("Valid email required"),
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(30, "Max 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ - only"),
  password: z.string().min(12, "Minimum 12 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
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
        captchaToken = await (window as any).grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
          { action: "register" },
        );
      }
      await authApi.register({
        email: data.email,
        username: data.username,
        password: data.password,
        captchaToken,
      });
      setSuccess("Account created! Check your email to verify before logging in.");
      toast.success("Registration successful!");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
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
          <p className="text-slate-400 mt-2">Join GyanKosh and start learning today</p>
        </div>

        {error && <div className="mb-5"><ErrorAlert message={error} /></div>}
        {success && <div className="mb-5"><SuccessAlert message={success} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="label">Email address</label>
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
            <label className="label">Username</label>
            <input
              {...register("username")}
              type="text"
              placeholder="your_username"
              className="input"
              autoComplete="username"
            />
            {errors.username && <p className="field-error">{errors.username.message}</p>}
            <p className="text-xs text-slate-500 mt-1">Letters, numbers, hyphens and underscores only</p>
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
            {errors.password && <p className="field-error">{errors.password.message}</p>}
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
            className="btn-primary w-full h-11 flex items-center justify-center gap-2 text-base"
          >
            {loading ? <Spinner size={18} /> : null}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
