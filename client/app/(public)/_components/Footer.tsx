import Image from "next/image";
import logo from "@/app/assets/images/quickpalo_logo.png";
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="relative z-50 w-full bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-gray-200 pt-10 pb-6 flex flex-col items-center">
      {/* Logo */}
      <Image
        src={logo}
        alt="QuickPalo Logo"
        width={150}
        className="rounded-bl-2xl rounded-tr-2xl mb-6 drop-shadow-xl"
      />

      {/* Social Icons */}
      <div className="flex gap-6 mb-6 z-50">
        {[FaFacebook, FaInstagram, FaTwitter, FaLinkedin].map((Icon, idx) => (
          <Icon
            key={idx}
            size={24}
            className="transition-all duration-300 hover:text-purple-500 hover:scale-110 cursor-pointer"
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-14/15 z-50 h-px bg-gray-500 mb-4"></div>

      <p className="text-sm z-50 text-gray-400">
        &copy; {new Date().getFullYear()} QuickPalo. All rights reserved.
      </p>
      <svg
        className="absolute z-0 bottom-0 left-0 w-full"
        viewBox="0 0 1440 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#561269"
          d="M0,80 C480,0 960,160 1440,80 L1440,150 L0,150 Z"
        />
      </svg>
    </footer>
  );
}
