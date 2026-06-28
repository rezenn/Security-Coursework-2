"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Spinner, ErrorAlert, SuccessAlert } from "@/components/shared";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { validatePasswordPolicy } from "@/lib/utils/password";

const schema = z.object({
  email: z.string().email("Valid email required"),
  username: z.string().min(3, "Min 3 chars").max(30, "Max 30 chars").regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ - only"),
  password: z.string().min(12, "Minimum 12 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [watchedPw, setWatchedPw] = useState("");
  const [watchedEmail, setWatchedEmail] = useState("");
  const [policyErrors, setPolicyErrors] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<Form>({ resolver: zodResolver(schema) });
  const pw = watch("password");
  const email = watch("email");

  useEffect(() => {
    setWatchedPw(pw || "");
    if (pw) setPolicyErrors(validatePasswordPolicy(pw));
  }, [pw]);

  useEffect(() => { setWatchedEmail(email || ""); }, [email]);

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
      await authApi.register({ email: data.email, username: data.username, password: data.password, captchaToken });
      setSuccess("Account created! Check your email to verify your address before logging in.");
      toast.success("Registration successful!");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <script
        src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
        async
        defer
      />
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <UserPlus className="text-blue-400" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Create account</h1>
            <p className="text-slate-400 text-sm">Start learning on GyanKosh</p>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
        {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label">Email</label>
            <input {...register("email")} type="email" placeholder="you@example.com" className="input" autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Username</label>
            <input {...register("username")} type="text" placeholder="your_username" className="input" autoComplete="username" />
            {errors.username && <p className="field-error">{errors.username.message}</p>}
            <p className="text-xs text-slate-500 mt-1">Letters, numbers, hyphens, underscores only</p>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Create a strong password"
                className="input pr-10"
                autoComplete="new-password"
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
            {/* Real-time password strength meter */}
            <PasswordStrengthMeter password={watchedPw} userInputs={[watchedEmail]} />
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <input
              {...register("confirmPassword")}
              type={showPw ? "text" : "password"}
              placeholder="Repeat your password"
              className="input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || policyErrors.length > 0}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Spinner size={16} /> : <UserPlus size={16} />}
            Create Account
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </>
  );
}
