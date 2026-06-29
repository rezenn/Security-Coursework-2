"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, Spinner, EmptyState } from "@/components/shared";
import { CreditCard, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

export default function AdminTransactionsPage() {
  const { loading } = useRequireAuth("admin");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    adminApi
      .transactions()
      .then((d) => {
        setTransactions(d.transactions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setFetching(false));
  }, [loading]);

  if (loading) return <PageLoader />;

  const totalRevenuePaisa = transactions
    .filter((t) => t.status === "completed")
    .reduce((s: number, t: any) => s + (t.amountCents || 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total records</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3 text-right">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <TrendingUp size={12} /> Total Revenue
          </div>
          <p className="text-xl font-bold text-emerald-400">
            Rs. {(totalRevenuePaisa / 100).toFixed(0)}
          </p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Khalti PIDX</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={6} className="py-12 text-center"><Spinner size={20} className="text-blue-400 mx-auto" /></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No transactions yet" icon={<CreditCard size={32} />} /></td></tr>
            ) : (
              transactions.map((tx: any) => (
                <tr key={tx._id} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <p className="text-white font-medium">{tx.user?.username || "—"}</p>
                    <p className="text-xs text-slate-400">{tx.user?.email || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{tx.course?.title || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-white">
                      {tx.amountCents === 0
                        ? <span className="text-emerald-400">Free</span>
                        : `Rs. ${(tx.amountCents / 100).toFixed(0)}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      "inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg",
                      {
                        "bg-emerald-500/15 text-emerald-400": tx.status === "completed",
                        "bg-red-500/15 text-red-400": tx.status === "failed",
                        "bg-amber-500/15 text-amber-400": tx.status === "pending",
                        "bg-slate-600/50 text-slate-400": tx.status === "refunded",
                      },
                    )}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate">
                    {tx.pidx || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
