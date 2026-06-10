"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegistrationData, registrationSchema } from "../../schema/schema";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneInput } from "react-international-phone";
import { Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { handleRegister } from "@/lib/actions/auth-action";
import { toast } from "sonner";

export default function RegisterForm() {
  const router = useRouter();
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    mode: "onSubmit",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const submit = async (values: RegistrationData) => {
    try {
      const response = await handleRegister(values);

      if (!response.success) {
        toast.error(response.message ?? "Registration failed!");
        return;
      }
      toast.success("Sucessfully registered!");
      router.push("/login");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unexpected error occurred!",
      );
    }
  };

  return (
    <div className=" w-full max-w-md px-5 ">
      <form onSubmit={handleSubmit(submit)} className="space-y-5 ">
        {/* fullName  */}
        <div>
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="fullName"
            className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
            aria-invalid={!!errors.fullName}
            {...register("fullName")}
            placeholder="Full Name"
          />
          {errors.fullName?.message && (
            <p className="text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>
        {/*Email */}
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
            placeholder="user@mail.com"
          />
          {errors.email?.message && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>
        {/* Phone Number  */}
        <div>
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            Phone Number
          </label>
          <PhoneInput
            defaultCountry="np"
            value={watch("phoneNumber")}
            onChange={(value) =>
              setValue("phoneNumber", value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            inputClassName=" h-20 w-full py-5 px-4 text-black bg-white rounded-md border border-black/30 focus:border-black/60
            "
            countrySelectorStyleProps={{
              buttonClassName:
                "h-20 w-full py-5 px-4 text-black bg-white rounded-md border border-black/30 focus:border-black/60",
            }}
          />
          {errors.phoneNumber?.message && (
            <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>
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
        {/* confirm password */}
        <div>
          <label className="block text-md text-black/60 font-semibold mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showPassword2 ? "text" : "password"}
              autoComplete="new-password"
              className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
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
          {errors.confirmPassword?.message && (
            <p className="text-xs text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className=" h-12 w-full mt-2 text-xl text-white bg-purple-700  rounded-xl"
        >
          {isSubmitting ? "Signing up..." : "Sign up"}
        </button>
        <div className="flex justify-center text-sm ">
          <p className=" text-gray-500">Already have an account? &nbsp;</p>
          <Link
            href="/login"
            className=" text-blue-400 hover:text-blue-600 hover:underline"
          >
            Sign in
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
