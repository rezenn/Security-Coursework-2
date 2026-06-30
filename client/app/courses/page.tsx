"use client";
import { useEffect, useState } from "react";
import { courseApi } from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { Spinner, EmptyState } from "@/components/shared";
import { AppSidebar } from "@/components/shared/Sidebar";
import { PaymentModal } from "@/components/payment/PaymentModal";
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
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handlePurchaseClick = (course: any) => {
    if (!user) {
      toast.error("Please log in to purchase courses");
      return;
    }
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Refresh courses to update enrollment status
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (level !== "all") params.level = level;
    if (category !== "all") params.category = category;
    courseApi
      .list(params)
      .then((d) => setCourses(d.courses))
      .catch(() => toast.error("Failed to refresh courses"))
      .finally(() => setLoading(false));
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
                            onClick={() => handlePurchaseClick(course)}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
                          >
                            <ShoppingCart size={13} />
                            {course.priceCents === 0
                              ? "Enroll Free"
                              : "Buy Now"}
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

      {/* Payment Modal - Small Popup */}
      {selectedCourse && (
        <PaymentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCourse(null);
          }}
          courseTitle={selectedCourse.title}
          courseId={selectedCourse._id}
          amount={selectedCourse.priceCents}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
