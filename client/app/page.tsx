"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import { BookOpen, Shield, Zap, Award } from "lucide-react";

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
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-500" size={24} />
          <span className="text-xl font-bold text-white">GyanKosh</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="btn-secondary text-sm">Log In</Link>
          <Link href="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-6 border border-blue-500/30">
          <Shield size={14} /> Secure Learning Platform
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Learn Without<br />
          <span className="text-blue-500">Compromise</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          GyanKosh is an online course platform built with security-first design.
          MFA, encrypted data, and zero-trust architecture protect every learner.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">Start Learning Free</Link>
          <Link href="/courses" className="btn-secondary px-8 py-3 text-base">Browse Courses</Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Shield, title: "Secure by Design", text: "AES-256 encryption, MFA, rate limiting, and RBAC keep your account and data safe." },
          { icon: Zap, title: "Instant Access", text: "Purchase a course and get access immediately. Secure Stripe payment with HMAC integrity." },
          { icon: Award, title: "Quality Content", text: "Expert-curated courses across multiple disciplines, verified and updated regularly." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card hover:border-blue-500/50 transition-colors">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
              <Icon className="text-blue-400" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
