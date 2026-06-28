"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { Avatar, RoleBadge } from "@/components/shared";
import {
  BookOpen, LayoutDashboard, User, LogOut,
  ShieldCheck, Users, FileText, CreditCard,
  Settings, GraduationCap, BarChart3,
} from "lucide-react";
import clsx from "clsx";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Browse Courses", icon: BookOpen },
  { href: "/profile", label: "My Profile", icon: User },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/logs", label: "Audit Logs", icon: FileText },
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/admin" && href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
          : "text-slate-400 hover:text-white hover:bg-slate-700/50",
      )}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-500" size={22} />
          <span className="text-lg font-bold text-white">GyanKosh</span>
        </div>
        {isAdmin && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-400">
            <ShieldCheck size={12} />
            Admin Panel
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user.username} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
