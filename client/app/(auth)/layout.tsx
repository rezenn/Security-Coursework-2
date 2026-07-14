import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/images/logo.jpg"
              alt="GyanKosh Logo"
              width={32}
              height={32}
              className="object-cover w-full h-full"
              priority
            />
          </div>{" "}
          <span className="text-lg font-bold text-white">GyanKosh</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </div>{" "}
      <div>
        <p
          className="text-slate-600 text-xs align-middle flex 
       justify-center"
        >
          © {new Date().getFullYear()} GyanKosh.
        </p>
      </div>
    </div>
  );
}
