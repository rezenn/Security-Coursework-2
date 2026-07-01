"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { Avatar, RoleBadge } from "@/components/shared";
import { LogoutModal } from "@/components/auth/LogoutModal";
import Image from "next/image";
import {
  BookOpen,
  LayoutDashboard,
  User,
  LogOut,
  Shield,
  Users,
  FileText,
  CreditCard,
  GraduationCap,
  BarChart3,
  BookMarked,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Browse Courses", icon: BookOpen },
  // Was pointing at "/dashboard" — identical to the Dashboard link above, so
  // "My Learning" never actually navigated anywhere new. Now points at its
  // own route with the full enrolled-courses grid.
  { href: "/my-learning", label: "My Learning", icon: BookMarked },
  { href: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  // /admin/logs route exists on the backend but no client page yet —
  // kept in nav so it's discoverable; clicking navigates to 404 for now.
  { href: "/admin/logs", label: "Audit Logs", icon: FileText },
];

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}) {
  const pathname = usePathname();
  const isExact = href === "/admin" || href === "/dashboard";
  const active = isExact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-blue-600/15 text-blue-400 font-medium"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
      )}
    >
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar() {
  const { user, isAdmin } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const enrolledCount: number = (user?.enrolledCourses ?? []).length;
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          className="flex items-center gap-2.5"
        >
         <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg">
                       <Image
                         src="/images/logo.jpg"
                         alt="GyanKosh Logo"
                         width={32}
                         height={32}
                         className="object-cover w-full h-full"
                         priority
                       />
                     </div>
          <span className="font-bold text-white text-base">GyanKosh</span>
        </Link>
        {isAdmin && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
            <Shield size={11} />
            Admin Panel
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={`${item.href}-${item.label}`}
            {...item}
            badge={
              item.label === "My Learning" && enrolledCount > 0
                ? enrolledCount
                : undefined
            }
          />
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-4 border-t border-slate-700">
          <div className="flex items-center gap-2.5 mb-3 px-2">
            <Avatar
              name={user.username}
              size="sm"
              imageUrl={user.profile?.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                {user.username}
              </p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      )}

      {user && (
        <div>
          <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
          />
        </div>
      )}
    </aside>
  );
}
