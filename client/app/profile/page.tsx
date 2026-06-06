"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserProfile {
  email: string;
  username: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Unable to load profile.");
        return;
      }

      const data = await response.json();
      setProfile(data);
    };

    loadProfile();
  }, []);

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">Profile</h2>
        {error ? (
          <p className="text-sm text-rose-700">{error}</p>
        ) : profile ? (
          <div className="space-y-3 text-slate-700">
            <p>
              <span className="font-semibold">Email:</span> {profile.email}
            </p>
            <p>
              <span className="font-semibold">Username:</span>{" "}
              {profile.username}
            </p>
            <p>
              <span className="font-semibold">Email verified:</span>{" "}
              {profile.emailVerified ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">MFA enabled:</span>{" "}
              {profile.mfaEnabled ? "Yes" : "No"}
            </p>
          </div>
        ) : (
          <p className="text-slate-500">Loading profile…</p>
        )}
      </div>
    </AppShell>
  );
}
