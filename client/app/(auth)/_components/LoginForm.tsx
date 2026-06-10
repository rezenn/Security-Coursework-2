"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginData, loginSchema } from "../../schema/schema";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { handleLogin } from "@/lib/actions/auth-action";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { checkAuth, setUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
  });

  const submit = async (values: LoginData) => {
    try {
      const response = await handleLogin(values);

      if (!response.success) {
        toast.error(response.message || "Login failed!");
        return;
      }

      toast.success("Successfully logged in!");
      await checkAuth();

      const userData = response.data;

      switch (userData.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "organization":
          router.push("/organization/dashboard");
          break;
        case "user":
        default:
          router.push("/user/dashboard");
          break;
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed!");
    }
  };

  return (
    <div className=" w-full max-w-md px-5 ">
      <form onSubmit={handleSubmit(submit)} className="space-y-5 ">
        {/* Email  */}
        <div>
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
            aria-invalid={!!errors.email}
            {...register("email")}
            placeholder="example@mail.com"
            // onChange={(e) => setEmail(e.target.value)}
          />
          {errors.email?.message && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        {/* password */}
        <div>
          <label className="block text-md text-black/60 font-semibold mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
              aria-invalid={!!errors.password}
              {...register("password")}
              placeholder="••••••••"
              // onChange={(e) => setPassword(e.target.value)}
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
          {errors.password?.message && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* forgot password */}
        <div className="flex items-end justify-end text-sm  ">
          <Link
            href="/forgot-password"
            className="text-blue-400 hover:text-blue-600 hover:underline"
          >
            Forgot Password ?
          </Link>
        </div>

        {/* submit button */}
        <button
          type="submit"
          // onClick={HandleLogin}
          disabled={isSubmitting}
          className=" h-12 w-full mt-2 text-xl bg-purple-700  rounded-xl text-white"
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
        {/* register */}
        <div className="flex justify-center text-sm ">
          <p className=" text-gray-500">Don't have an account? &nbsp;</p>
          <Link
            href="/register"
            className=" text-blue-400 hover:text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </form>
      <div className="mt-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px flex-1 bg-gray-700" />
          <span className="text-md text-gray-700">Or</span>
          <span className="h-px flex-1 bg-gray-700" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          // onClick={handleGoogleLogin}
          className="w-full h-12 flex items-center justify-center gap-3 border border-gray-500 rounded-lg text-black/80 font-bold bg-white hover:bg-gray-100 transition"
        >
          <FcGoogle size={25} />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
function checkAuth() {
  throw new Error("Function not implemented.");
}
