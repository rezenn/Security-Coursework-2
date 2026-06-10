"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Building2,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleCreateOrganization } from "@/lib/actions/admin/user-action";

const createOrganizationSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().min(7, "Phone number must be at least 7 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    profileImage: z
      .instanceof(File)
      .optional()
      .refine((file) => !file || file.size <= 5 * 1024 * 1024, {
        message: "Max file size is 5MB",
      })
      .refine(
        (file) =>
          !file ||
          ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
            file.type,
          ),
        { message: "Only jpg, jpeg, png, webp allowed" },
      ),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

export default function CreateOrganizationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  const onSubmit = async (data: CreateOrganizationFormData) => {
    setIsSubmittingState(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);
      if (data.profileImage instanceof File) {
        formData.append("profilePicture", data.profileImage);
      }

      const result = await handleCreateOrganization(formData);

      if (result.success) {
        setSuccess("Organization registered successfully!");
        reset();
        if (previewImage) URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
        setTimeout(() => router.push("/admin/organizations"), 2000);
      } else {
        setError(result.message || "Failed to register organization");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingState(false);
    }
  };

  const fields = [
    {
      name: "fullName" as const,
      label: "Full Name",
      type: "text",
      placeholder: "Contact person's full name",
    },
    {
      name: "email" as const,
      label: "Email Address",
      type: "email",
      placeholder: "Enter email address",
    },
    {
      name: "phoneNumber" as const,
      label: "Phone Number",
      type: "text",
      placeholder: "Enter phone number",
    },
    {
      name: "password" as const,
      label: "Password",
      type: "password",
      placeholder: "Minimum 8 characters",
    },
    {
      name: "confirmPassword" as const,
      label: "Confirm Password",
      type: "password",
      placeholder: "Re-enter password",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4 pb-12">
      <Link
        className="w-20 h-10 px-2 flex flex-row justify-center items-center gap-2 rounded-2xl bg-fuchsia-100 hover:bg-fuchsia-200 transition-colors mb-6"
        href="/admin/organizations"
      >
        <ArrowLeft size={16} />
        <p>Back</p>
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Register New Organization
        </h1>
        <p className="text-gray-600 mt-2">Create an organization account</p>
      </div>

      <div className="bg-linear-to-br from-white via-white to-purple-50 shadow-2xl rounded-3xl overflow-hidden border border-purple-100">
        {/* Alerts */}
        <div className="px-8 pt-8">
          {success && (
            <div className="mb-6 flex items-center gap-3 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-medium text-green-800">{success}</p>
                <p className="text-sm text-green-600 mt-1">
                  Redirecting to organizations list...
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-center gap-3 bg-linear-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Picture Upload */}
        <div className="px-8">
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group"
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              <div className="relative h-40 w-40 rounded-full border-4 border-fuchsia-400 shadow-2xl overflow-hidden bg-linear-to-br from-purple-100 to-pink-100">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Profile preview"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                    priority
                    sizes="160px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Building2 className="text-purple-300" size={52} />
                    <span className="text-gray-400 text-sm mt-2">No image</span>
                  </div>
                )}
                {imageHover && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                    <Camera size={28} />
                    <span className="text-sm mt-1 font-medium">
                      Upload Photo
                    </span>
                  </div>
                )}
              </div>

              <Controller
                name="profileImage"
                control={control}
                render={({ field: { onChange } }) => (
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (previewImage) URL.revokeObjectURL(previewImage);
                      setPreviewImage(URL.createObjectURL(file));
                      onChange(file);
                    }}
                  />
                )}
              />

              {previewImage && (
                <button
                  type="button"
                  onClick={() => {
                    if (previewImage) URL.revokeObjectURL(previewImage);
                    setPreviewImage(null);
                    setValue("profileImage", undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-3 text-center">
              Click to upload profile photo
              <br />
              <span className="text-xs">Max 5MB • JPG, PNG, WebP</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {fields.map(({ name, label, type, placeholder }) => (
              <div key={name} className="relative group">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  {...register(name)}
                  type={type}
                  placeholder={placeholder}
                  disabled={isSubmittingState}
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300 disabled:opacity-60"
                />
                {errors[name] && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors[name]?.message}
                  </p>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmittingState || !isDirty}
                  className="flex-1 bg-fuchsia-500 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingState ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Building2 size={18} />
                      Register Organization
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset();
                    if (previewImage) URL.revokeObjectURL(previewImage);
                    setPreviewImage(null);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isSubmittingState}
                  className="flex-1 bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} />
                  Reset Form
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
