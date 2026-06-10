"use client";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { handleResetPassword } from "@/lib/actions/auth-action";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string()
      .min(6, "Confirm Password must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
  });

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export default function ResetPasswordForm({ token }: { token: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordDTO>({
    resolver: zodResolver(ResetPasswordSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const router = useRouter();
  const onSubmit = async (data: ResetPasswordDTO) => {
    try {
      const response = await handleResetPassword(token, data.password);
      if (response.success) {
        toast.success("Password reset successfully");
        router.replace("/login");
      } else {
        toast.error(response.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="py-4">
      <form className="max-w-md" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            {" "}
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="
        absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none text-gray-500 hover:text-gray-800"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword2 ? "text" : "password"}
              id="confirmPassword"
              {...register("confirmPassword")}
              className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword2((value) => !value)}
              className="
        absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none text-gray-500 hover:text-gray-800"
              aria-label={showPassword2 ? "Hide password" : "Show password"}
            >
              {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="mb-4 gap-y-2 flex  items-end flex-col ">
          <Link
            href="/login"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            Back to Login
          </Link>
          <Link
            href="/request-password-reset"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            Request another reset email
          </Link>
        </div>

        <button
          type="submit"
          className=" h-12 w-full mt-2 text-xl bg-purple-700  rounded-xl text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
