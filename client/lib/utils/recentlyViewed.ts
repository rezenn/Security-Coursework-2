// lib/utils/recentlyViewed.ts

const KEY = "recentlyViewedOrgs";
const MAX = 10;

export interface RecentOrg {
  _id: string;
  organizationName: string;
  organizationType?: string;
  street?: string;
  city?: string;
  profilePicture?: string;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentOrg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(org: Omit<RecentOrg, "viewedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((o) => o._id !== org._id);
    const updated = [{ ...org, viewedAt: Date.now() }, ...filtered].slice(
      0,
      MAX,
    );
    localStorage.setItem(KEY, JSON.stringify(updated));
    // FIX: dispatch storage event so RecentlyViewed component updates
    // even within the same tab (storage event only fires for OTHER tabs by default)
    window.dispatchEvent(new Event("storage"));
  } catch {
    // silently fail
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("storage"));
}
