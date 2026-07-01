"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, Spinner, EmptyState } from "@/components/shared";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Globe,
  EyeOff,
  X,
  CheckCircle,
  ListVideo,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { LessonManager } from "@/components/admin/LessonManager";

const EMPTY_FORM = {
  title: "",
  description: "",
  instructor: "",
  category: "Programming",
  level: "beginner",
  priceDisplay: "0", // shown in form as display value (rupees)
  tags: "",
};

export default function AdminCoursesPage() {
  const { loading } = useRequireAuth("admin");
  const [courses, setCourses] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [lessonCourse, setLessonCourse] = useState<any | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const fetchCourses = async () => {
    setFetching(true);
    try {
      const d = await adminApi.courses();
      setCourses(d.courses);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) fetchCourses();
  }, [loading]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setThumbnailFile(null);
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditId(c._id);
    setForm({
      title: c.title,
      description: c.description,
      instructor: c.instructor,
      category: c.category,
      level: c.level,
      priceDisplay: String(c.priceCents / 100),
      tags: (c.tags || []).join(", "),
    });
    setThumbnailFile(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Store as paisa (1 NPR = 100 paisa) — platform is NPR-only
      const priceCents = Math.round(parseFloat(form.priceDisplay || "0") * 100);
      const payload = {
        title: form.title,
        description: form.description,
        instructor: form.instructor,
        category: form.category,
        level: form.level,
        priceCents,
        tags: form.tags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
      };

      let courseId = editId;
      if (editId) {
        await adminApi.updateCourse(editId, payload);
        toast.success("Course updated");
      } else {
        const created = await adminApi.createCourse(payload);
        courseId = created?.course?._id || null;
        toast.success("Course created — publish it when ready");
      }

      if (thumbnailFile && courseId) {
        await adminApi.uploadCourseThumbnail(courseId, thumbnailFile);
        toast.success("Course image uploaded");
      }

      setShowForm(false);
      setThumbnailFile(null);
      fetchCourses();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id: string, isPublished: boolean) => {
    setPublishingId(id);
    try {
      await adminApi.updateCourse(id, { isPublished: !isPublished });
      toast.success(isPublished ? "Course unpublished" : "Course is now live!");
      fetchCourses();
    } catch {
      toast.error("Action failed");
    } finally {
      setPublishingId(null);
    }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteCourse(id);
      toast.success("Course deleted");
      fetchCourses();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <PageLoader />;

  const published = courses.filter((c) => c.isPublished).length;
  const drafts = courses.length - published;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {published} live · {drafts} draft
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 h-9 text-sm"
        >
          <Plus size={15} /> New Course
        </button>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-base font-semibold text-white">
                {editId ? "Edit Course" : "Create Course"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Web Security Fundamentals"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What will students learn?"
                  required
                />
              </div>
              <div>
                <label className="label">Instructor</label>
                <input
                  className="input"
                  value={form.instructor}
                  onChange={(e) =>
                    setForm({ ...form, instructor: e.target.value })
                  }
                  placeholder="Instructor name"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {[
                      "Programming",
                      "Design",
                      "Security",
                      "Data Science",
                      "Business",
                      "DevOps",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Level</label>
                  <select
                    className="input"
                    value={form.level}
                    onChange={(e) =>
                      setForm({ ...form, level: e.target.value })
                    }
                  >
                    {["beginner", "intermediate", "advanced"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Price (NPR) — enter 0 for free</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input pl-10"
                    value={form.priceDisplay}
                    onChange={(e) =>
                      setForm({ ...form, priceDisplay: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                {parseFloat(form.priceDisplay) > 0 &&
                  parseFloat(form.priceDisplay) < 50 && (
                    <p className="text-xs text-amber-400 mt-1">
                      ⚠ Stripe's minimum charge is roughly Rs. 50 (~$0.50) —
                      smaller amounts may be rejected at checkout.
                    </p>
                  )}
              </div>
              <div>
                <label className="label">Tags (comma-separated)</label>
                <input
                  className="input"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="python, web, security"
                />
              </div>
              <div>
                <label className="label">Course image</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30"
                  onChange={(e) =>
                    setThumbnailFile(e.target.files?.[0] || null)
                  }
                />
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, WEBP, or GIF up to 5MB.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 h-10 flex items-center justify-center gap-2"
                >
                  {saving && <Spinner size={14} />}
                  {editId ? "Save Changes" : "Create Course"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary flex-1 h-10"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Course
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Enrolled
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <Spinner size={20} className="text-blue-400 mx-auto" />
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    message="No courses yet. Create your first one!"
                    icon={<BookOpen size={36} />}
                  />
                </td>
              </tr>
            ) : (
              courses.map((c) => (
                <tr
                  key={c._id}
                  className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      by {c.instructor}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {c.category}
                  </td>
                  <td className="px-4 py-3 text-white font-semibold text-sm">
                    {c.priceCents === 0 ? (
                      <span className="text-emerald-400">Free</span>
                    ) : (
                      `Rs. ${(c.priceCents / 100).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {c.enrolledCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg",
                        c.isPublished
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-700 text-slate-400",
                      )}
                    >
                      {c.isPublished ? (
                        <CheckCircle size={11} />
                      ) : (
                        <EyeOff size={11} />
                      )}
                      {c.isPublished ? "Live" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Publish / Unpublish — clear labelled button */}
                      <button
                        onClick={() => togglePublish(c._id, c.isPublished)}
                        disabled={publishingId === c._id}
                        className={clsx(
                          "text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1",
                          c.isPublished
                            ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                            : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400",
                        )}
                        title={
                          c.isPublished ? "Unpublish course" : "Publish course"
                        }
                      >
                        {publishingId === c._id ? (
                          <Spinner size={11} />
                        ) : c.isPublished ? (
                          <>
                            <EyeOff size={11} /> Unpublish
                          </>
                        ) : (
                          <>
                            <Globe size={11} /> Publish
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setLessonCourse(c)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors rounded"
                        title="Manage lessons"
                      >
                        <ListVideo size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                        title="Edit course"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteCourse(c._id, c.title)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
                        title="Delete course"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Lesson manager modal */}
      {lessonCourse && (
        <LessonManager
          course={lessonCourse}
          onClose={() => setLessonCourse(null)}
          onCourseUpdated={(updated) => {
            setLessonCourse(updated);
            setCourses((prev) =>
              prev.map((c) =>
                c._id === updated._id ? { ...c, ...updated } : c,
              ),
            );
          }}
        />
      )}

      {/* Tip */}
      {courses.some((c) => !c.isPublished) && (
        <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
          <Globe size={12} />
          Draft courses are only visible to admins. Click{" "}
          <strong className="text-slate-400">Publish</strong> to make a course
          visible to students.
        </p>
      )}
    </div>
  );
}
