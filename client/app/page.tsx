"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import { BookOpen, ShieldCheck, Zap, Lock } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user) return null;

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">GyanKosh</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm h-9 px-4 flex items-center">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-1.5 rounded-full mb-8">
          <ShieldCheck size={12} /> Security-first learning platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          Learn anything.<br />
          <span className="text-blue-500">Stay secure.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          GyanKosh is an online course platform built from the ground up with
          zero-trust security, MFA, and encrypted payments via Khalti.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-base h-11 px-8 flex items-center gap-2">
            Start learning <Zap size={15} />
          </Link>
          <Link href="/login" className="btn-secondary text-base h-11 px-8 flex items-center">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              color: "blue",
              title: "Security by design",
              desc: "MFA, account lockout, reCAPTCHA, session binding, HMAC-signed transactions — every layer hardened.",
            },
            {
              icon: Lock,
              color: "purple",
              title: "Khalti payments",
              desc: "Pay securely via Khalti. HMAC integrity checks on every transaction. Free courses enrol instantly.",
            },
            {
              icon: Zap,
              color: "emerald",
              title: "Instant access",
              desc: "Payment confirmed? You're in. Full course content unlocked immediately with no delays.",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className={`w-10 h-10 bg-${color}-600/20 rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
