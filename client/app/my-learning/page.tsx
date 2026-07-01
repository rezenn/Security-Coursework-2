"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { profileApi } from "@/lib/api";
import { PageLoader, EmptyState } from "@/components/shared";
import { BookOpen, PlayCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function MyLearningPage() {
  const { loading } = useRequireAuth("user");
  const [courses, setCourses] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    profileApi
      .get()
      .then((d) => setCourses(d.user?.enrolledCourses ?? []))
      .catch(() => setCourses([]))
      .finally(() => setFetching(false));
  }, [loading]);

  if (loading || fetching) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Learning</h1>
          <p className="text-slate-400 text-sm mt-1">
            Continue learning from the courses you enrolled in or previewed for
            free.
          </p>
        </div>
        <Link
          href="/courses"
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          Browse courses <ArrowRight size={14} />
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center">
          <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-4">
            You do not have any courses in your learning library yet.
          </p>
          <Link
            href="/courses"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Explore courses <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Link
              key={course._id}
              href={`/courses/${course.slug || course._id}`}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group"
            >
              <div className="aspect-video bg-slate-700 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-slate-700">
                    <BookOpen size={28} className="text-slate-500" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">
                  {course.category || "Course"}
                </p>
                <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <PlayCircle size={12} />
                  <span>Start learning</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
