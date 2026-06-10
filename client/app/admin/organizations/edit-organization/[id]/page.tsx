"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Building2,
  X,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Save,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import type { Resolver } from "react-hook-form";
import { toast } from "sonner";
import {
  handleGetOneUser,
  handleUpdateUserAsAdmin,
} from "@/lib/actions/admin/user-action";
import { handleGetAllOrganizations } from "@/lib/actions/organization/organization-action";

const editSchema = z.object({
  fullName: z.string().min(2, "At least 2 characters"),
  phoneNumber: z.string().min(7, "At least 7 digits"),
  email: z.string().email("Invalid email"),
});

type EditFormData = z.infer<typeof editSchema>;

export default function EditOrganizationForm() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageHover, setImageHover] = useState(false);
  const [hasOrgDetails, setHasOrgDetails] = useState(false);
  const [orgEmail, setOrgEmail] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema) as Resolver<EditFormData>,
  });

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        setIsLoading(true);

        const userResult = await handleGetOneUser(userId);
        if (!userResult.success || !userResult.data) {
          setError(userResult.message || "Failed to load user");
          return;
        }
        const u = userResult.data as any;

        if (u.imageUrl) setExistingImageUrl(u.imageUrl);
        else if (u.profilePicture) {
          const base =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
          setExistingImageUrl(`${base}/uploads/profile/${u.profilePicture}`);
        }

        const defaults: EditFormData = {
          fullName: u.fullName || "",
          phoneNumber: u.phoneNumber || "",

          email: u.email || "",
        };

        // const orgsResult = await handleGetAllOrganizations();
        // if (orgsResult.success && Array.isArray(orgsResult.data)) {
        //   const orgDetail = orgsResult.data.find(
        //     (org: any) =>
        //       org.userId?.toString() === userId ||
        //       org.user?._id?.toString() === userId,
        //   );
        //   if (orgDetail) {
        //     setHasOrgDetails(true);
        //     setOrgEmail(orgDetail.contactEmail || u.email || "");
        //   }
        // }

        reset(defaults);
      } catch {
        setError("Failed to load organization data");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId, reset]);

  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  const onSubmit = async (data: EditFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const userFormData = new FormData();
      userFormData.append("fullName", data.fullName);
      userFormData.append("phoneNumber", data.phoneNumber);
      userFormData.append("email", data.email);
      userFormData.append("updatedAt", data.email);
      if (previewImage && fileInputRef.current?.files?.[0]) {
        userFormData.append("profilePicture", fileInputRef.current.files[0]);
      }

      const userResult = await handleUpdateUserAsAdmin(userId, userFormData);
      if (!userResult.success) {
        setError(userResult.message || "Failed to update account");
        toast.error(userResult.message || "Failed to update account");
        return;
      }

      toast.success("Organization updated successfully!");
      router.push("/admin/organizations");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Field = ({
    label,
    name,
    type = "text",
    placeholder,
    change,
    disabled: fieldDisabled = false,
  }: {
    label: string;
    name: keyof EditFormData;
    type?: string;
    placeholder?: string;
    change: boolean;
    disabled: boolean;
  }) => (
    <div className="relative group">
      <label className="block text-sm font-semibold mb-2 text-gray-700">
        {label}
      </label>
      <input
        {...register(name as any)}
        type={type}
        placeholder={placeholder}
        disabled={isSubmitting || fieldDisabled}
        className={`w-full bg-linear-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl px-4 py-3.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all duration-300 group-hover:border-purple-300 disabled:opacity-60 ${change ? "text-black" : "text-gray-700"}  `}
      />
      {errors[name] && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle size={14} />
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error && !isDirty) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin/organizations"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  const displayImage = previewImage || existingImageUrl;

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
          Edit Organization
        </h1>
        <p className="text-gray-600 mt-2">
          {hasOrgDetails
            ? "Update account and organization details"
            : "Update account info — organization details not set up yet"}
        </p>
      </div>

      <div className="bg-linear-to-br from-white via-white to-purple-50 shadow-2xl rounded-3xl overflow-hidden border border-purple-100">
        {error && (
          <div className="mx-8 mt-8 flex items-center gap-3 bg-linear-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Profile picture */}
        <div className="px-8 pt-8">
          <div className="flex flex-col items-center mb-8">
            <div
              className="relative group"
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              <div className="relative h-40 w-40 rounded-full border-4 border-fuchsia-400 shadow-2xl overflow-hidden bg-linear-to-br from-purple-100 to-pink-100">
                {displayImage ? (
                  <Image
                    src={displayImage}
                    alt="Profile"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    unoptimized
                    sizes="160px"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      setExistingImageUrl(null);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <Building2 className="text-purple-300" size={52} />
                    <span className="text-gray-400 text-sm mt-2">No image</span>
                  </div>
                )}
                {imageHover && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                    <Camera size={28} />
                    <span className="text-sm mt-1 font-medium">
                      Change Photo
                    </span>
                  </div>
                )}
              </div>

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
                  setValue(
                    "fullName",
                    (
                      document.querySelector(
                        '[name="fullName"]',
                      ) as HTMLInputElement
                    )?.value || "",
                    { shouldDirty: true },
                  );
                }}
              />

              {previewImage && (
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(previewImage);
                    setPreviewImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-3 text-center">
              Click to change the profile photo
            </p>
          </div>
        </div>

        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <div className="space-y-4">
                <Field
                  label="Full Name"
                  name="fullName"
                  placeholder="Contact person's name"
                  change
                  disabled={false}
                />
                <Field
                  label="Email"
                  name="email"
                  placeholder="Contact person's name"
                  change={false}
                  disabled
                />
                <p className="text-sm text-gray-500 -mt-3  flex items-center gap-2">
                  <AlertCircle size={14} />
                  Email address cannot be changed
                </p>
                <Field
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="Account phone number"
                  change
                  disabled={false}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="flex-1 bg-fuchsia-500 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} /> Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/organizations")}
                  disabled={isSubmitting}
                  className="flex-1 bg-linear-to-r from-gray-100 to-gray-200 text-gray-700 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
        <footer>
          <div className="px-8 py-6 bg-linear-to-r from-gray-50 to-white border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-500">
                <span className="font-medium">User ID:</span>{" "}
                <span className="font-mono">{userId}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
