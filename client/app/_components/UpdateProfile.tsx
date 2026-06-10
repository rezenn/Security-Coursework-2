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

import { handleUpdateProfile } from "@/lib/actions/auth-action";
import { UpdateUserData, updateUserSchema } from "../schema/update-user.schema";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UpdateUserForm({ initialUser }: { initialUser: any }) {
  const { user, refreshUser, updateUserData } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<UpdateUserData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: initialUser?.fullName ?? "",
      email: initialUser?.email ?? "",
      phoneNumber: initialUser?.phoneNumber ?? "",
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageHover, setImageHover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hasChanges = isDirty || previewImage;

  const getRoleBasedRoute = (baseRoute: string, role?: string) => {
    if (!role) return `/user${baseRoute}`;
    switch (role.toLocaleLowerCase()) {
      case "admin":
        return `/admin${baseRoute}`;
      case "organization":
        return `/organization${baseRoute}`;
      case "user":
      default:
        return `/user${baseRoute}`;
    }
  };

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateUserData) => {
    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      formData.append("phoneNumber", data.phoneNumber);
      if (data.profileImage) {
        formData.append("profilePicture", data.profileImage);
      }

      const res = await handleUpdateProfile(formData);

      if (!res.success) throw new Error(res.message);

      if (res.data) {
        updateUserData(res.data);
        await refreshUser();
      }

      // Clear preview and show success
      setPreviewImage(null);
      setSuccess("Profile updated successfully!");

      setTimeout(() => {
        setSuccess(null);
        router.push(getRoleBasedRoute("/profile", user?.role));
      }, 2000);

      // Reset form
      reset({
        fullName: res.data?.fullName || data.fullName,
        email: res.data?.email || data.email,
        phoneNumber: res.data?.phoneNumber || data.phoneNumber,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || "Profile update failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getProfileImageUrl = () => {
    if (previewImage) return previewImage;

    if (user?.imageUrl) return user.imageUrl;

    if (user?.profilePicture) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/uploads/profile/${user.profilePicture}`;
    }

    return null;
  };

  const profileImageUrl = getProfileImageUrl();
  const isSubmittingState = isSubmitting || isUploading;

  // Calculate changes count
  const changesCount = [isDirty, previewImage].filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto mt-10 px-1">
      <Link
        className="w-25 bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        href={getRoleBasedRoute("/profile", user?.role)}
      >
        <ArrowLeft />
        <p>Back</p>
      </Link>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Update Your Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Keep your information fresh and up-to-date
        </p>
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
                    Your changes have been saved
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
                  <p className="font-medium text-red-800">Update Failed</p>
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
                {profileImageUrl ? (
                  <Image
                    src={profileImageUrl}
                    alt="Profile"
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
                      Change Photo
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
                  placeholder="Enter your full name"
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
                  disabled
                  className="w-full bg-linear-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-500 cursor-not-allowed"
                  placeholder="Your email address"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <AlertCircle size={14} />
                Email address cannot be changed
              </p>
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
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmittingState || !hasChanges}
                  className="flex-1 bg-[#B61BE1] text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingState ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-6 bg-linear-to-r from-gray-50 to-white border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              <span className="font-medium">Last updated:</span>{" "}
              {user?.updatedAt
                ? new Date(user.updatedAt).toLocaleDateString()
                : "Never"}
            </div>
            <div className="text-gray-500">
              <span className="font-medium">User ID:</span>{" "}
              <span className="font-mono">{user?._id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
