"use client";
import { useState } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  PlayCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/shared";

interface Lesson {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  isFree: boolean;
}

interface Course {
  _id: string;
  title: string;
  lessons: Lesson[];
}

const EMPTY_LESSON_FORM = {
  title: "",
  description: "",
  videoUrl: "",
  duration: "0",
  isFree: false,
};

interface LessonManagerProps {
  course: Course;
  onClose: () => void;
  onCourseUpdated: (course: Course) => void;
}

export function LessonManager({
  course,
  onClose,
  onCourseUpdated,
}: LessonManagerProps) {
  const [lessons, setLessons] = useState<Lesson[]>(
    [...course.lessons].sort((a, b) => a.order - b.order),
  );
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_LESSON_FORM });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const applyCourse = (updated: Course) => {
    const sorted = [...updated.lessons].sort((a, b) => a.order - b.order);
    setLessons(sorted);
    onCourseUpdated({ ...updated, lessons: sorted });
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_LESSON_FORM });
    setShowForm(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditId(lesson._id);
    setForm({
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      duration: String(lesson.duration),
      isFree: lesson.isFree,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        videoUrl: form.videoUrl.trim(),
        duration: parseInt(form.duration, 10) || 0,
        isFree: form.isFree,
      };

      const res = editId
        ? await adminApi.updateLesson(course._id, editId, payload)
        : await adminApi.addLesson(course._id, payload);

      applyCourse(res.course);
      toast.success(editId ? "Lesson updated" : "Lesson added");
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    setBusyId(lesson._id);
    try {
      const res = await adminApi.deleteLesson(course._id, lesson._id);
      applyCourse(res.course);
      toast.success("Lesson deleted");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;

    const reordered = [...lessons];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setLessons(reordered); // optimistic

    try {
      const res = await adminApi.reorderLessons(
        course._id,
        reordered.map((l) => l._id),
      );
      applyCourse(res.course);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Reorder failed");
      setLessons(lessons); // revert on failure
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div>
            <h2 className="text-base font-semibold text-white">
              Manage Lessons
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 h-9 text-sm mb-4"
          >
            <Plus size={15} /> Add Lesson
          </button>

          {lessons.length === 0 ? (
            <EmptyState
              message="No lessons yet. Add the first one!"
              icon={<PlayCircle size={36} />}
            />
          ) : (
            <ul className="space-y-2">
              {lessons.map((lesson, i) => (
                <li
                  key={lesson._id}
                  className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 rounded-xl p-3"
                >
                  <div className="flex flex-col text-slate-500">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="disabled:opacity-20 hover:text-white transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === lessons.length - 1}
                      className="disabled:opacity-20 hover:text-white transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <GripVertical size={14} className="text-slate-600" />

                  <span className="w-6 text-center text-xs text-slate-500 font-mono">
                    {lesson.order}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {lesson.title}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      {lesson.duration > 0 && (
                        <span>{lesson.duration} min</span>
                      )}
                      {lesson.isFree ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <PlayCircle size={11} /> Free preview
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Lock size={11} /> Enrolled only
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => openEdit(lesson)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors rounded"
                    title="Edit lesson"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson)}
                    disabled={busyId === lesson._id}
                    className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
                    title="Delete lesson"
                  >
                    {busyId === lesson._id ? (
                      <Spinner size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Add / Edit lesson form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-base font-semibold text-white">
                {editId ? "Edit Lesson" : "Add Lesson"}
              </h3>
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
                  placeholder="e.g. Introduction to XSS"
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
                  placeholder="What does this lesson cover?"
                />
              </div>
              <div>
                <label className="label">Video URL</label>
                <input
                  className="input"
                  value={form.videoUrl}
                  onChange={(e) =>
                    setForm({ ...form, videoUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFree}
                  onChange={(e) =>
                    setForm({ ...form, isFree: e.target.checked })
                  }
                  className="rounded border-slate-600 bg-slate-900"
                />
                Free preview (visible without enrolling)
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 h-10 flex items-center justify-center gap-2"
                >
                  {saving && <Spinner size={14} />}
                  {editId ? "Save Changes" : "Add Lesson"}
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
    </div>
  );
}
