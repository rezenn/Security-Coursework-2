"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, Spinner, EmptyState, RoleBadge, Avatar } from "@/components/shared";
import { Users, Search, Trash2, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

export default function AdminUsersPage() {
  const { loading } = useRequireAuth("admin");
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const d = await adminApi.users(params);
      setUsers(d.users);
      setTotal(d.total);
    } catch { toast.error("Failed to load users"); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (!loading) fetchUsers(); }, [loading, search]);

  const toggleUser = async (id: string) => {
    setActionId(id);
    try {
      const d = await adminApi.toggleUser(id);
      toast.success(d.message);
      fetchUsers();
    } catch (err: any) { toast.error(err?.response?.data?.error || "Action failed"); }
    finally { setActionId(null); }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (err: any) { toast.error(err?.response?.data?.error || "Delete failed"); }
    finally { setActionId(null); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total accounts</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-slate-400 font-medium">User</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Role</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">MFA</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Joined</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={6} className="py-10 text-center"><Spinner size={20} className="text-blue-400 mx-auto" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No users found" icon={<Users size={32} />} /></td></tr>
            ) : users.map((u) => (
              <tr key={u._id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.username} size="sm" />
                    <div>
                      <p className="font-medium text-white">{u.username}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    u.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
                  )}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                  {!u.isEmailVerified && (
                    <span className="ml-1.5 text-xs text-yellow-400 bg-yellow-500/20 px-1.5 py-0.5 rounded-full">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.mfa?.enabled ? (
                    <span className="flex items-center gap-1 text-xs text-green-400"><ShieldCheck size={12} /> On</span>
                  ) : (
                    <span className="text-xs text-slate-500">Off</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleUser(u._id)}
                      disabled={actionId === u._id}
                      title={u.isActive ? "Deactivate" : "Activate"}
                      className="text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      {u.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => deleteUser(u._id, u.username)}
                      disabled={actionId === u._id}
                      title="Delete user"
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
