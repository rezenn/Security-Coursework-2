"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Spinner, ErrorAlert } from "@/components/shared";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { validatePasswordPolicy } from "@/lib/utils/password";

const schema = z.object({
  password: z.string().min(12, "At least 12 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors }, watch } = useForm<Form>({ resolver: zodResolver(schema) });
  const pw = watch("password") || "";
  const policyErrors = validatePasswordPolicy(pw);

  const onSubmit = async (data: Form) => {
    if (policyErrors.length > 0) { setError("Password doesn't meet requirements"); return; }
    setLoading(true);
    setError("");
    try {
      let captchaToken: string | undefined;
      if (typeof window !== "undefined" && (window as any).grecaptcha) {
        captchaToken = await (window as any).grecaptcha.execute(
          process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: "reset_password" },
        );
      }
      await authApi.resetPasswordToken(token, data.password, captchaToken);
      toast.success("Password reset! Please log in.");
      router.push("/login");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Reset failed. The link may have expired.");
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
            <KeyRound className="text-blue-400" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Set new password</h1>
            <p className="text-slate-400 text-sm">Choose a strong password</p>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPw ? "text" : "password"}
                placeholder="Min 12 chars, mixed case, numbers, symbols"
                className="input pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="field-error">{errors.password.message}</p>}
            <PasswordStrengthMeter password={pw} />
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              {...register("confirmPassword")}
              type={showPw ? "text" : "password"}
              placeholder="Repeat password"
              className="input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading || policyErrors.length > 0} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Spinner size={16} /> : <KeyRound size={16} />}
            Reset Password
          </button>
        </form>
      </div>
    </>
  );
}
