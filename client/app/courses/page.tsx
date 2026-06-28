"use client";
import { useEffect, useState } from "react";
import { courseApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { PageLoader, Spinner, EmptyState } from "@/components/shared";
import { AppSidebar } from "@/components/shared/Sidebar";
import { BookOpen, Search, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import clsx from "clsx";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const LEVELS = ["all", "beginner", "intermediate", "advanced"];
const CATEGORIES = ["all", "Programming", "Design", "Security", "Data Science", "Business", "DevOps"];

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState("all");
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (level !== "all") params.level = level;
    if (category !== "all") params.category = category;
    courseApi.list(params).then((d) => setCourses(d.courses)).finally(() => setLoading(false));
  }, [search, level, category]);

  useEffect(() => {
    if (user?.enrolledCourses) setEnrolledIds(user.enrolledCourses.map((c: any) => c._id || c));
  }, [user]);

  const handlePurchase = async (courseId: string) => {
    if (!user) { toast.error("Please log in to purchase courses"); return; }
    setPaying(courseId);
    try {
      const { clientSecret } = await paymentApi.createIntent(courseId);
      const s = await stripe;
      if (!s) throw new Error("Stripe failed to load");
      const { error } = await s.redirectToCheckout ? 
        { error: null } : 
        await (s as any).confirmPayment({
          clientSecret,
          confirmParams: { return_url: `${window.location.origin}/dashboard?payment=success` },
        });
      if (error) throw error;
    } catch (err: any) {
      if (err?.response?.data?.error === "You are already enrolled in this course.") {
        toast.info("You are already enrolled in this course.");
      } else {
        toast.error(err?.message || "Payment failed. Please try again.");
      }
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Browse Courses</h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="input w-auto" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => <option key={l} value={l}>{l === "all" ? "All Levels" : l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
            <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} className="text-blue-400" /></div>
          ) : courses.length === 0 ? (
            <EmptyState message="No courses found" icon={<BookOpen size={40} />} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course: any) => {
                const isEnrolled = enrolledIds.includes(course._id);
                return (
                  <div key={course._id} className="card flex flex-col hover:border-blue-500/40 transition-colors">
                    <div className="aspect-video bg-slate-700 rounded-lg mb-3 overflow-hidden flex-shrink-0">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="text-slate-600" size={32} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{course.category}</span>
                        <span className={clsx("text-xs px-2 py-0.5 rounded", {
                          "bg-green-500/20 text-green-400": course.level === "beginner",
                          "bg-yellow-500/20 text-yellow-400": course.level === "intermediate",
                          "bg-red-500/20 text-red-400": course.level === "advanced",
                        })}>{course.level}</span>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{course.title}</h3>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                      <p className="text-xs text-slate-500 mb-3">By {course.instructor}</p>

                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-lg font-bold text-white">
                          {course.priceCents === 0 ? "Free" : `$${(course.priceCents / 100).toFixed(2)}`}
                        </p>
                        {isEnrolled ? (
                          <div className="flex items-center gap-1.5 text-sm text-green-400 font-medium">
                            <Unlock size={14} /> Enrolled
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(course._id)}
                            disabled={paying === course._id}
                            className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1.5"
                          >
                            {paying === course._id ? <Spinner size={12} /> : <Lock size={12} />}
                            {course.priceCents === 0 ? "Enroll Free" : "Buy Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
