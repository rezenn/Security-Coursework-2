"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, Spinner, EmptyState } from "@/components/shared";
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

const EMPTY_FORM = { title: "", description: "", instructor: "", category: "Programming", level: "beginner", priceCents: 0, currency: "USD", tags: "" };

export default function AdminCoursesPage() {
  const { loading } = useRequireAuth("admin");
  const [courses, setCourses] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    setFetching(true);
    try { const d = await adminApi.courses(); setCourses(d.courses); }
    catch { toast.error("Failed to load courses"); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (!loading) fetchCourses(); }, [loading]);

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };
  const openEdit = (c: any) => {
    setEditId(c._id);
    setForm({ title: c.title, description: c.description, instructor: c.instructor, category: c.category, level: c.level, priceCents: c.priceCents, currency: c.currency, tags: c.tags?.join(", ") || "" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, priceCents: parseInt(String(form.priceCents)) * 100, tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) };
      if (editId) { await adminApi.updateCourse(editId, payload); toast.success("Course updated!"); }
      else { await adminApi.createCourse(payload); toast.success("Course created!"); }
      setShowForm(false); fetchCourses();
    } catch (err: any) { toast.error(err?.response?.data?.error || "Save failed"); }
    finally { setSaving(false); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      await adminApi.updateCourse(id, { isPublished: !current });
      toast.success(current ? "Course unpublished" : "Course published");
      fetchCourses();
    } catch { toast.error("Action failed"); }
  };

  const deleteCourse = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await adminApi.deleteCourse(id); toast.success("Course deleted"); fetchCourses(); }
    catch { toast.error("Delete failed"); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">{courses.length} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create Course
        </button>
      </div>

      {/* Course form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{editId ? "Edit Course" : "Create Course"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
              <div><label className="label">Instructor</label><input className="input" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {["Programming", "Design", "Security", "Data Science", "Business", "DevOps"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Level</label>
                  <select className="input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {["beginner", "intermediate", "advanced"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">Price (USD) — enter 0 for free</label><input type="number" className="input" min={0} value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: parseInt(e.target.value) || 0 })} /></div>
              <div><label className="label">Tags (comma-separated)</label><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="python, web, beginner" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Spinner size={14} />} Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Course</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Category</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Price</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Enrolled</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={6} className="py-10 text-center"><Spinner size={20} className="text-blue-400 mx-auto" /></td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No courses yet. Create one!" icon={<BookOpen size={32} />} /></td></tr>
            ) : courses.map((c) => (
              <tr key={c._id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{c.title}</p>
                  <p className="text-xs text-slate-400">{c.instructor}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{c.category}</td>
                <td className="px-4 py-3 text-white font-medium">{c.priceCents === 0 ? "Free" : `$${(c.priceCents / 100).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-slate-300">{c.enrolledCount}</td>
                <td className="px-4 py-3">
                  <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", c.isPublished ? "bg-green-500/20 text-green-400" : "bg-slate-600 text-slate-400")}>
                    {c.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => togglePublish(c._id, c.isPublished)} title={c.isPublished ? "Unpublish" : "Publish"} className="text-slate-400 hover:text-blue-400 transition-colors">
                      {c.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => openEdit(c)} title="Edit" className="text-slate-400 hover:text-yellow-400 transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => deleteCourse(c._id, c.title)} title="Delete" className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
