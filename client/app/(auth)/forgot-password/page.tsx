"use client";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestPasswordReset } from "@/lib/api/auth";
import { toast } from "sonner";
export const RequestPasswordResetSchema = z.object({
  email: z.email(),
});

export type RequestPasswordResetDTO = z.infer<
  typeof RequestPasswordResetSchema
>;
export default function Page() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetDTO>({
    resolver: zodResolver(RequestPasswordResetSchema),
  });
  const onSubmit = async (data: RequestPasswordResetDTO) => {
    try {
      const response = await requestPasswordReset(data.email);
      if (response.success) {
        toast.success(
          "Password reset link sent to your email. Please check your email",
        );
      } else {
        toast.error(response.message || "Failed to request password reset.");
      }
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to request password reset.",
      );
    }
  };
  return (
    <div className="py-4">
      <h1 className="text-black/80 text-3xl font-extrabold text-center  ">
        Request Password Reset
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md py-4">
        <div className="mb-4">
          <label className="block text-md w-lg text-black/60 font-semibold mb-2">
            Email Address
          </label>
          <input
            placeholder="youremail@mail.com"
            type="email"
            id="email"
            {...register("email")}
            className="h-12 w-full rounded-md border border-black/30 bg-white px-4 text-black focus:outline-none focus:border-black/60"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <button
          type="submit"
          className=" h-12 w-full mt-2 text-xl bg-purple-700  rounded-xl text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
