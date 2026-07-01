"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { courseApi } from "@/lib/api";
import { useAuth } from "@/context/authContext";
import { AppSidebar } from "@/components/shared/Sidebar";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { Spinner } from "@/components/shared";
import {
  BookOpen,
  ChevronRight,
  Lock,
  Unlock,
  PlayCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { toast } from "sonner";

const formatNPR = (paise: number): string =>
  `NPR ${(paise / 100).toLocaleString("ne-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const LEVEL_COLOURS = {
  beginner: "bg-emerald-500/15 text-emerald-400",
  intermediate: "bg-amber-500/15 text-amber-400",
  advanced: "bg-rose-500/15 text-rose-400",
} as const;

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const data = await courseApi.detail(slug);
      setCourse(data.course);
      setIsEnrolled(data.isEnrolled ?? false);
      // Open first lesson by default if enrolled, or first free lesson otherwise
      const lessons: any[] = data.course?.lessons ?? [];
      const defaultLesson = data.isEnrolled
        ? lessons[0]
        : lessons.find((l: any) => l.isFree);
      setActiveLesson(defaultLesson ?? null);
    } catch {
      toast.error("Course not found");
      router.push("/courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleEnrollSuccess = () => {
    setIsModalOpen(false);
    fetchCourse(); // re-fetch to pick up new enrollment status and full lessons
    toast.success("Enrollment confirmed! Your lessons are now unlocked.");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-900">
        <AppSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Spinner size={28} className="text-blue-400" />
        </main>
      </div>
    );
  }

  if (!course) return null;

  const lessons: any[] = course.lessons ?? [];
  const totalDuration = lessons.reduce(
    (sum: number, l: any) => sum + (l.duration ?? 0),
    0,
  );
  const totalHours = Math.floor(totalDuration / 60);
  const totalMins = totalDuration % 60;

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    return match?.[1]
      ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`
      : null;
  };

  const activeLessonEmbedUrl =
    activeLesson?.videoUrl && getYoutubeEmbedUrl(activeLesson.videoUrl);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">
      <AppSidebar />

      <main className="flex-1 flex overflow-hidden">
        {/* ── Left: lesson list sidebar ── */}
        <aside className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden flex-shrink-0">
          {/* Course header */}
          <div className="p-4 border-b border-slate-700">
            <Link
              href="/courses"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-3 transition-colors"
            >
              <ArrowLeft size={12} /> Back to courses
            </Link>
            <div className="w-full aspect-video bg-slate-700 rounded-lg overflow-hidden mb-3">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                  <BookOpen size={28} className="text-slate-600" />
                </div>
              )}
            </div>
            <h1 className="text-sm font-bold text-white leading-snug mb-2 line-clamp-3">
              {course.title}
            </h1>
            <p className="text-xs text-slate-400 mb-3">
              By {course.instructor}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-md font-medium",
                  LEVEL_COLOURS[course.level as keyof typeof LEVEL_COLOURS] ??
                    "bg-slate-700 text-slate-400",
                )}
              >
                {course.level}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-700 text-slate-400">
                {course.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {(totalHours > 0 || totalMins > 0) && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {totalHours > 0 ? `${totalHours}h ` : ""}
                  {totalMins}m
                </span>
              )}
              {lessons.length > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 size={11} /> {lessons.length} lessons
                </span>
              )}
              {course.enrolledCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users size={11} /> {course.enrolledCount}
                </span>
              )}
            </div>
          </div>

          {/* Enroll CTA (if not enrolled) */}
          {!isEnrolled && (
            <div className="p-4 border-b border-slate-700">
              <div className="text-center mb-3">
                <span className="text-xl font-bold text-white">
                  {course.priceCents === 0
                    ? "Free"
                    : formatNPR(course.priceCents)}
                </span>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error("Please log in to enroll");
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                <ShoppingCart size={14} />
                {course.priceCents === 0 ? "Enroll Free" : "Enroll Now"}
              </button>
            </div>
          )}

          {isEnrolled && (
            <div className="px-4 py-3 border-b border-slate-700 bg-emerald-500/8">
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
                <CheckCircle size={14} /> You&apos;re enrolled
              </div>
            </div>
          )}

          {/* Lesson list */}
          <div className="flex-1 overflow-y-auto py-2">
            {lessons.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BookOpen size={24} className="text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  {isEnrolled
                    ? "No lessons yet — check back soon."
                    : "Enroll to see the full curriculum."}
                </p>
              </div>
            ) : (
              lessons
                .slice()
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                .map((lesson: any, idx: number) => {
                  const isLocked = !isEnrolled && !lesson.isFree;
                  const isActive = activeLesson?._id === lesson._id;
                  return (
                    <button
                      key={lesson._id}
                      disabled={isLocked}
                      onClick={() => !isLocked && setActiveLesson(lesson)}
                      className={clsx(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors group",
                        isActive
                          ? "bg-blue-600/15 border-l-2 border-blue-500"
                          : "border-l-2 border-transparent hover:bg-slate-700/50",
                        isLocked && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        {isLocked ? (
                          <Lock size={13} className="text-slate-500" />
                        ) : isActive ? (
                          <PlayCircle size={13} className="text-blue-400" />
                        ) : (
                          <span className="text-xs text-slate-500 font-mono w-[13px] text-center leading-[13px]">
                            {idx + 1}
                          </span>
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={clsx(
                            "text-xs font-medium leading-snug line-clamp-2",
                            isActive ? "text-blue-300" : "text-slate-300",
                          )}
                        >
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesson.isFree && !isEnrolled && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                              <Unlock size={9} /> Free preview
                            </span>
                          )}
                          {lesson.duration > 0 && (
                            <span className="text-[10px] text-slate-500">
                              {lesson.duration}m
                            </span>
                          )}
                        </div>
                      </div>
                      {!isLocked && !isActive && (
                        <ChevronRight
                          size={12}
                          className="flex-shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors mt-0.5"
                        />
                      )}
                    </button>
                  );
                })
            )}
          </div>
        </aside>

        {/* ── Right: lesson content ── */}
        <div className="flex-1 overflow-y-auto">
          {activeLesson ? (
            <div className="max-w-3xl mx-auto p-8">
              {/* Lesson header */}
              <div className="mb-6">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">
                  {course.title}
                </p>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {activeLesson.title}
                </h2>
                {activeLesson.duration > 0 && (
                  <p className="text-sm text-slate-400 flex items-center gap-1.5">
                    <Clock size={13} /> {activeLesson.duration} min read
                  </p>
                )}
              </div>

              {/* Video player */}
              {activeLesson.videoUrl ? (
                <div className="mb-6">
                  <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
                    {activeLessonEmbedUrl ? (
                      <iframe
                        src={activeLessonEmbedUrl}
                        title={`Video for ${activeLesson.title}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                        <p className="font-semibold text-white mb-2">
                          Video available
                        </p>
                        <p className="text-sm text-slate-400 mb-4">
                          This lesson includes a video, but the URL is not a
                          supported YouTube link.
                        </p>
                        <a
                          href={activeLesson.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Open the lesson video in a new tab
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Description / article body */}
              <div className="prose prose-invert prose-sm max-w-none">
                {activeLesson.description ? (
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeLesson.description}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 text-center">
                    <BookOpen
                      size={32}
                      className="text-slate-600 mx-auto mb-3"
                    />
                    <p className="text-slate-400 text-sm">
                      Lesson content coming soon.
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson navigation */}
              {isEnrolled && lessons.length > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700">
                  {(() => {
                    const sorted = [...lessons].sort(
                      (a, b) => (a.order ?? 0) - (b.order ?? 0),
                    );
                    const idx = sorted.findIndex(
                      (l) => l._id === activeLesson._id,
                    );
                    const prev = sorted[idx - 1];
                    const next = sorted[idx + 1];
                    return (
                      <>
                        <button
                          disabled={!prev}
                          onClick={() => prev && setActiveLesson(prev)}
                          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowLeft size={14} />
                          {prev ? prev.title : "Previous"}
                        </button>
                        <button
                          disabled={!next}
                          onClick={() => next && setActiveLesson(next)}
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {next ? next.title : "Next"}
                          <ChevronRight size={14} />
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* No lesson selected / nothing to preview */
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              {isEnrolled ? (
                <>
                  <BookOpen size={48} className="text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Select a lesson to begin
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Choose any lesson from the sidebar to start learning.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6">
                    <Lock size={32} className="text-blue-400/70" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Enroll to unlock all lessons
                  </h3>
                  <p className="text-slate-400 text-sm mb-6 max-w-sm">
                    {lessons.filter((l) => l.isFree).length > 0
                      ? `${lessons.filter((l) => l.isFree).length} free preview ${lessons.filter((l) => l.isFree).length === 1 ? "lesson is" : "lessons are"} available. Enroll to access all ${lessons.length} lessons.`
                      : `Enroll to access all ${lessons.length} lessons.`}
                  </p>
                  <div className="text-2xl font-bold text-white mb-4">
                    {course.priceCents === 0
                      ? "Free"
                      : formatNPR(course.priceCents)}
                  </div>
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error("Please log in to enroll");
                        return;
                      }
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                  >
                    <ShoppingCart size={16} />
                    {course.priceCents === 0 ? "Enroll Free" : "Enroll Now"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseTitle={course.title}
        courseId={course._id}
        amount={course.priceCents}
        onSuccess={handleEnrollSuccess}
      />
    </div>
  );
}
