"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Logo from "@/app/assets/images/quickpalo_logo.png";
import { XIcon, Menu } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="m-2 top-0 z-50 ">
      <nav className="mx-auto w-full px-5 lg:px-8 ">
        <div className="flex items-center justify-between ">
          {/* Logo */}
          <div className="flex items-center w-full gap-2">
            <Link href="/">
              <Image
                src={Logo}
                alt="Logo"
                className="w-full max-w-[200px] h-auto rounded-bl-2xl rounded-tr-2xl"
                priority
              />
            </Link>
            {/* Nav screens */}
            <div className="ml-auto flex items-center gap-1">
              <div
                className={`hidden md:flex items-center gap-8 px-5 justify-center text-black font-bold `}
              >
                {/* {NavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      "text-lg " +
                      (isActive(link.href)
                        ? "text-purple-700"
                        : "text-black/70 hover:text-black")
                    }
                  >
                    {link.label}
                  </Link>
                ))} */}
              </div>
              {/* Login and toggle */}
              <div className="flex items-center gap-2 md:justify-self-end">
                <div className="hidden sm:flex items-center gap-4">
                  <Link
                    href="/login"
                    className="px-5 py-2 text-white inline-flex items-center justify-center rounded-md bg-purple-700 hover:bg-fuchsia-700 hover:rounded-4xl border border-gray-600 shadow-2xl transition-all duration-300 ease-out"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 text-white inline-flex items-center justify-center rounded-md bg-purple-700 hover:bg-fuchsia-700 hover:rounded-4xl border border-gray-600 shadow-2xl transition-all duration-300 ease-out "
                  >
                    Sign up
                  </Link>
                </div>
                {/* toogle menu */}
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Toggle menu"
                  aria-expanded={open}
                  className="md:hidden inline-flex h-9 w-9 p-1 items-center justify-center rounded-md border  border-black/80 bg-white/50 "
                >
                  {open ? (
                    <XIcon className="w-6 h-6 text-black/70" />
                  ) : (
                    <Menu className="w-6 h-6 text-black/70" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mt-4 rounded-lg border border-black/10 bg-white shadow-md">
            <div className="flex flex-col gap-3 p-4">
              {/* {NavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-lg ${
                    isActive(link.href)
                      ? "text-purple-700"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  {link.label}
                </Link>
              ))} */}

              <div className="mt-3 flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2 text-white inline-flex items-center justify-center rounded-md bg-purple-700 hover:bg-fuchsia-700 hover:rounded-4xl border border-gray-600 shadow-2xl transition-all duration-300 ease-out"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2 text-white inline-flex items-center justify-center rounded-md bg-purple-700 hover:bg-fuchsia-700  hover:rounded-4xl border border-gray-600 shadow-2xl transition-all duration-300 ease-out"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
