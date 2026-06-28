import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <BookOpen className="text-blue-500" size={22} />
          <span className="text-lg font-bold text-white">GyanKosh</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
