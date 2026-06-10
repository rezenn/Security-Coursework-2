"use client";

import Image from "next/image";
import { useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon as HomeOutline,
  BuildingOffice2Icon as BuildingOfficeOutline,
  CalendarDaysIcon as CalendarDaysOutline,
  UsersIcon as UsersOutline,
  UserIcon as UserOutline,
  ClipboardDocumentListIcon as ClipboardOutline,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  BuildingOffice2Icon as BuildingOfficeSoild,
  CalendarDaysIcon as CalendarDaysSolid,
  UsersIcon as UsersSolid,
  UserIcon as UserSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
} from "@heroicons/react/24/solid";
import ThemeSwitch from "@/app/_components/ThemeSwitch";
import { LogOutIcon, Menu, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { toast, Toaster } from "sonner";

import logo from "@/app/assets/images/quickpalo_logo.png";

const NavLinks = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    filledIcon: HomeSolid,
    icon: HomeOutline,
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    filledIcon: CalendarDaysSolid,
    icon: CalendarDaysOutline,
  },
  {
    href: "/admin/organizations",
    label: "Organizations",
    filledIcon: BuildingOfficeSoild,
    icon: BuildingOfficeOutline,
  },
  {
    href: "/admin/users",
    label: "Users",
    filledIcon: UsersSolid,
    icon: UsersOutline,
  },
  {
    href: "/admin/appointments",
    label: "Appointments",
    filledIcon: ClipboardSolid,
    icon: ClipboardOutline,
  },
  {
    href: "/admin/profile",
    label: "Profile",
    filledIcon: UserSolid,
    icon: UserOutline,
  },
];

export default function SideNavigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsOpen(false);
  };

  const confirmLogout = async () => {
    try {
      await logout();

      toast.success("Logged out successfully!");

      setShowLogoutConfirm(false);
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Toggle button for small screens */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-white hover:bg-fuchsia-700 hover:text-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 shadow-md z-40 transform transition-transform duration-300 bg-white md:bg-transparent
        ${
          isOpen ? "translate-x-0 " : "-translate-x-full "
        }  md:translate-x-0 md:static md:flex md:flex-col text-black/80`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-center md:justify-start">
          <Link href="/user/dashboard" className="block">
            <Image
              src={logo}
              alt="QuickPalo"
              className="w-auto h-10 md:h-12 lg:h-14 transition-all duration-300"
              priority
              sizes="(max-width: 768px) 200px, 230px"
            />
          </Link>
        </div>
        <nav className="flex-1 mt-1 md:mt-0 flex flex-col gap-1 p-4">
          {NavLinks.map((link) => {
            const Icon = isActive(link.href) ? link.filledIcon : link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-4 rounded-lg text-md font-regular transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-linear-to-r from-purple-100 to-pink-50 text-purple-700 border-l-4 border-purple-500 shadow-sm"
                    : "hover:text-purple-700 hover:bg-linear-to-r hover:from-purple-50 hover:to-pink-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t border-gray-200 space-y-4">
          {/* Theme Toggle */}
          {/* <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <span className="font-medium text-gray-700">Theme</span>
            <ThemeSwitch />
          </div> */}

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-3 p-3 rounded-xl text-white bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <LogOutIcon size={18} />
            <span className="font-semibold">Logout</span>
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">Version 1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-60 backdrop-blur-sm"
            onClick={cancelLogout}
          />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-70 w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              {/* Header */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirm Logout
                  </h3>
                </div>
                <p className="text-gray-600">
                  Are you sure you want to logout from your account?
                </p>
              </div>

              <div className="h-px bg-gray-200" />

              <div className="flex gap-3 p-6">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-red-600 to-rose-500 text-white font-semibold rounded-xl hover:from-red-700 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
