"use client";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { adminApi } from "@/lib/api";
import { PageLoader, Spinner, EmptyState } from "@/components/shared";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

export default function AdminTransactionsPage() {
  const { loading } = useRequireAuth("admin");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    adminApi.transactions()
      .then((d) => { setTransactions(d.transactions); setTotal(d.total); })
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setFetching(false));
  }, [loading]);

  if (loading) return <PageLoader />;

  const totalRevenue = transactions
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.amountCents, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total} total · Revenue: <span className="text-green-400 font-semibold">${(totalRevenue / 100).toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-slate-400 font-medium">User</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Course</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Stripe ID</th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr><td colSpan={6} className="py-10 text-center"><Spinner size={20} className="text-blue-400 mx-auto" /></td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan={6}><EmptyState message="No transactions yet" icon={<CreditCard size={32} />} /></td></tr>
            ) : transactions.map((tx) => (
              <tr key={tx._id} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{tx.user?.username || "—"}</p>
                  <p className="text-xs text-slate-400">{tx.user?.email || "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{tx.course?.title || "—"}</td>
                <td className="px-4 py-3 text-white font-semibold">${(tx.amountCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", {
                    "bg-green-500/20 text-green-400": tx.status === "completed",
                    "bg-red-500/20 text-red-400": tx.status === "failed",
                    "bg-yellow-500/20 text-yellow-400": tx.status === "pending",
                    "bg-slate-500/20 text-slate-400": tx.status === "refunded",
                  })}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.stripePaymentIntentId?.slice(0, 20)}…</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
