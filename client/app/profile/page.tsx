"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/authContext";
import { profileApi } from "@/lib/api";
import {
  PageLoader,
  ErrorAlert,
  SuccessAlert,
  Avatar,
  RoleBadge,
} from "@/components/shared";
import {
  User,
  Key,
  Download,
  ShieldCheck,
  Calendar,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { PasswordStrengthMeter } from "@/components/ui/PasswordStrengthMeter";
import { validatePasswordPolicy } from "@/lib/utils/password";

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useRequireAuth();
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    profileApi
      .get()
      .then((d) => {
        setProfile(d.user);
        setFirstName(d.user.profile?.firstName || "");
        setLastName(d.user.profile?.lastName || "");
        setBio(d.user.profile?.bio || "");
      })
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [authLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await profileApi.update({ firstName, lastName, bio });
      setSuccess("Profile updated successfully.");
      toast.success("Profile saved!");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match");
      return;
    }
    const policyErrors = validatePasswordPolicy(newPw);
    if (policyErrors.length > 0) {
      setPwError(policyErrors.join(", "));
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSuccess("");
    try {
      await profileApi.changePassword(currentPw, newPw);
      setPwSuccess("Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed!");
    } catch (err: any) {
      setPwError(err?.response?.data?.error || "Password change failed");
    } finally {
      setPwSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await profileApi.uploadAvatar(file);
      setProfile((p: any) => ({ ...p, profile: res.profile }));
      await refreshUser();
      toast.success("Avatar updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    try {
      const res = await profileApi.export();
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(res.data, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "gyankosh-profile.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Profile exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  if (authLoading || fetching) return <PageLoader />;

  const pwExpiry = profile?.passwordExpiresAt
    ? new Date(profile.passwordExpiresAt)
    : null;
  const pwDaysLeft = pwExpiry
    ? Math.ceil((pwExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <RoleBadge role={authUser?.role || "user"} />
      </div>

      {/* Profile info card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative group">
            <Avatar
              name={profile?.username || "U"}
              size="lg"
              imageUrl={profile?.profile?.avatarUrl}
            />
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              title="Change photo"
            >
              {avatarUploading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={16} className="text-white" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={avatarUploading}
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">
              {profile?.username}
            </p>
            <p className="text-slate-400 text-sm">{profile?.email}</p>
            {profile?.mfa?.enabled && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                <ShieldCheck size={12} /> MFA enabled
              </div>
            )}
          </div>
        </div>

        {/* Password expiry warning */}
        {pwDaysLeft !== null && pwDaysLeft <= 14 && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm border ${pwDaysLeft <= 3 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"}`}
          >
            <Calendar size={14} className="inline mr-1.5" />
            {pwDaysLeft <= 0
              ? "Your password has expired. Please change it now."
              : `Password expires in ${pwDaysLeft} days.`}
          </div>
        )}

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}
        {success && (
          <div className="mb-4">
            <SuccessAlert message={success} />
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                maxLength={50}
              />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                maxLength={50}
              />
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <p className="text-xs text-slate-500 mt-1">{bio.length}/500</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <User size={16} /> {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={16} className="text-blue-400" /> Change Password
        </h2>

        {pwError && (
          <div className="mb-4">
            <ErrorAlert message={pwError} />
          </div>
        )}
        {pwSuccess && (
          <div className="mb-4">
            <SuccessAlert message={pwSuccess} />
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min 12 chars)"
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={newPw} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="btn-primary flex items-center gap-2"
          >
            <Key size={16} /> {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Security & MFA */}
      {!profile?.mfa?.enabled && (
        <div className="card border-yellow-500/30">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <ShieldCheck size={16} className="text-yellow-400" /> Two-Factor
            Authentication
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            Add an extra layer of security to your account.
          </p>
          <Link
            href="/mfa-setup"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ShieldCheck size={16} /> Enable MFA
          </Link>
        </div>
      )}

      {/* Data export */}
      <div className="card">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Download size={16} className="text-blue-400" /> Data Export
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Download all data associated with your account (GDPR-compliant).
        </p>
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} /> Export My Data
        </button>
      </div>
    </div>
  );
}
