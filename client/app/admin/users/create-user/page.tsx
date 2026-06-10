"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  User,
  X,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import {
  CreateUserData,
  createUserSchema,
} from "../../../schema/update-user.schema";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handleCreateUser } from "@/lib/actions/admin/user-action";

export default function CreateUserForm() {
  const { user, refreshUser, updateUserData } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingState, setIsSubmittingState] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: CreateUserData) => {
    setIsSubmittingState(true);
    setError(null);
    setSuccess(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      if (data.profileImage && data.profileImage instanceof File) {
        formData.append("profilePicture", data.profileImage);
      }

      const result = await handleCreateUser(formData);

      if (result.success) {
        setSuccess(result.message || "User created successfully!");
        reset();
        setPreviewImage(null);

        setTimeout(() => {
          router.push("/admin/users");
        }, 2000);
      } else {
        setError(result.message || "Failed to create user");
      }
    } catch (err: any) {
      console.error("Create user error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingState(false);
    }
  };

  // Handle image preview
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <Link
        className="w-20 h-10 px-2 flex flex-row justify-center items-center gap-2 rounded-2xl bg-fuchsia-100 hover:bg-fuchsia-200 transition-colors"
        href="/admin/users"
      >
        <ArrowLeft size={16} />
        <p>Back</p>
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Create A New User
        </h1>
        <p className="text-gray-600 mt-2">Fill all of the information below</p>
      </div>

      {/* Main Card */}
      <div className="bg-linear-to-br from-white via-white to-purple-50 shadow-2xl rounded-3xl overflow-hidden border border-purple-100">
        <div className="px-8 pt-8">
          {success && (
            <div className="mb-6 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3 bg-linear-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-green-800">{success}</p>
                  <p className="text-sm text-green-600 mt-1">
                    Redirecting to users list...
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 animate-in slide-in-from-top duration-500">
              <div className="flex items-center gap-3 bg-linear-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-red-800">
                    Failed to create user
                  </p>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-8">
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group"
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              <div className="relative h-48 w-48 rounded-full border-4 border-fuchsia-400 shadow-2xl overflow-hidden bg-linear-to-br from-purple-100 to-pink-100">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Profile preview"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                    priority
                    sizes="192px"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <User className="text-purple-300" size={64} />
                    <span className="text-gray-400 text-sm mt-2">No image</span>
                  </div>
                )}

                {imageHover && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                    <Camera size={32} />
                    <span className="text-sm mt-2 font-medium">
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

                      // Create preview URL
                      const previewUrl = URL.createObjectURL(file);
                      setPreviewImage(previewUrl);
                      onChange(file);
                    }}
                  />
                )}
              />

              {previewImage && (
                <button
                  type="button"
                  onClick={() => {
                    if (previewImage) {
                      URL.revokeObjectURL(previewImage);
                    }
                    setPreviewImage(null);
                    setValue("profileImage", undefined);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-300 transform hover:scale-110 shadow-lg"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <p className="text-gray-500 text-sm mt-4 text-center">
              Click on the image to upload a new profile photo
              <br />
              <span className="text-xs">Max 5MB • JPG, PNG, WebP</span>
            </p>
          </div>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="relative group">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <input
                  {...register("fullName")}
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
                  placeholder="Enter full name"
                  disabled={isSubmittingState}
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
                  placeholder="Enter email address"
                  disabled={isSubmittingState}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="relative group">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <input
                  {...register("phoneNumber")}
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
                  placeholder="Enter phone number"
                  disabled={isSubmittingState}
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="relative group">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type="password"
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
                  placeholder="Enter password"
                  disabled={isSubmittingState}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="relative group">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className="w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300"
                  placeholder="Re-enter password"
                  disabled={isSubmittingState}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

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
                      Creating User...
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      Create User
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset();
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
