"use client";
import { useEffect, useState } from "react";
import { courseApi, paymentApi } from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { Spinner, EmptyState } from "@/components/shared";
import { AppSidebar } from "@/components/shared/Sidebar";
import { BookOpen, Search, CheckCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const LEVELS = ["all", "beginner", "intermediate", "advanced"];
const CATEGORIES = [
  "all",
  "Programming",
  "Design",
  "Security",
  "Data Science",
  "Business",
  "DevOps",
];

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState("all");
  const [paying, setPaying] = useState<string | null>(null);

  const enrolledIds: string[] = (user?.enrolledCourses ?? []).map(
    (c: any) => c._id || c,
  );

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (level !== "all") params.level = level;
    if (category !== "all") params.category = category;
    courseApi
      .list(params)
      .then((d) => setCourses(d.courses))
      .catch(() => toast.error("Failed to load courses"))
      .finally(() => setLoading(false));
  }, [search, level, category]);

  const handlePurchase = async (courseId: string) => {
    if (!user) {
      toast.error("Please log in to purchase courses");
      return;
    }
    setPaying(courseId);
    try {
      // Use checkout instead of direct payment
      const { url } = await paymentApi.createCheckout(courseId);

      // If free course, url will be dashboard
      if (url.includes("/dashboard")) {
        toast.success("Course enrolled successfully!");
        window.location.href = "/dashboard";
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg === "You are already enrolled in this course.") {
        toast.info("You are already enrolled in this course.");
      } else {
        toast.error(msg || "Could not initiate payment. Try again.");
      }
      setPaying(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Browse Courses</h1>
            <p className="text-slate-400 text-sm mt-1">
              {courses.length} courses available — pay securely via Stripe
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-7">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="input pl-9 h-10 text-sm"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input w-auto h-10 text-sm"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l === "all"
                    ? "All Levels"
                    : l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="input w-auto h-10 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size={28} className="text-blue-400" />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              message="No courses found. Try a different search."
              icon={<BookOpen size={40} />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => {
                const isEnrolled = enrolledIds.includes(course._id);
                return (
                  <div
                    key={course._id}
                    className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-slate-600 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-slate-700 flex-shrink-0 overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                          <BookOpen size={36} className="text-slate-600" />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {/* Tags */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-md">
                          {course.category}
                        </span>
                        <span
                          className={clsx(
                            "text-xs px-2 py-0.5 rounded-md font-medium",
                            {
                              "bg-emerald-500/15 text-emerald-400":
                                course.level === "beginner",
                              "bg-amber-500/15 text-amber-400":
                                course.level === "intermediate",
                              "bg-rose-500/15 text-rose-400":
                                course.level === "advanced",
                            },
                          )}
                        >
                          {course.level}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white leading-snug mb-1.5 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-1">
                        By {course.instructor}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 flex-1">
                        {course.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700">
                        <div>
                          <p className="text-lg font-bold text-white">
                            {course.priceCents === 0
                              ? "Free"
                              : `$${(course.priceCents / 100).toFixed(2)}`}
                          </p>
                          {course.enrolledCount > 0 && (
                            <p className="text-xs text-slate-500">
                              {course.enrolledCount} enrolled
                            </p>
                          )}
                        </div>

                        {isEnrolled ? (
                          <div className="flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                            <CheckCircle size={15} /> Enrolled
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(course._id)}
                            disabled={paying === course._id}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                          >
                            {paying === course._id ? (
                              <Spinner size={13} />
                            ) : (
                              <ShoppingCart size={13} />
                            )}
                            {paying === course._id
                              ? "Processing..."
                              : course.priceCents === 0
                                ? "Enroll Free"
                                : "Pay with Stripe"}
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
