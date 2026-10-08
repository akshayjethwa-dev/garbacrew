import React, { useEffect, useState } from "react";
import { adminList, adminResolveDispute } from "../lib/api";

interface Dispute {
  id: string;
  planId: string;
  planTitle: string;
  filedByName: string;
  againstName: string;
  reason: string;
  amount: number;
  outcome: string;
  evidenceUrls: string[];
}

export default function Disputes() {
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("disputes", { limit: 100 });
      setItems(res.items as Dispute[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resolve = async (
    outcome:
      | "full_refund"
      | "partial_refund"
      | "released_to_host"
      | "dismissed"
  ) => {
    if (!selected) return;
    try {
      await adminResolveDispute({
        disputeId: selected.id,
        outcome,
        moderatorNotes: notes,
      });
      setSelected(null);
      setNotes("");
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Disputes</h1>
        <p className="text-gray-500 mt-1">
          Review payment and behavior disputes. Escrow is held until resolution.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No disputes.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Filed by
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Against
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Outcome
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {d.planTitle}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {d.filedByName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {d.againstName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    ₹{d.amount}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        d.outcome === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {d.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => setSelected(d)}
                      className="text-primary hover:underline font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Dispute review
            </h2>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Plan:</span>{" "}
                <span className="font-medium">{selected.planTitle}</span>
              </div>
              <div>
                <span className="text-gray-500">Filed by:</span>{" "}
                <span className="font-medium">{selected.filedByName}</span>
              </div>
              <div>
                <span className="text-gray-500">Against:</span>{" "}
                <span className="font-medium">{selected.againstName}</span>
              </div>
              <div>
                <span className="text-gray-500">Amount in dispute:</span>{" "}
                <span className="font-medium">₹{selected.amount}</span>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>
                <p className="text-gray-800 mt-1">{selected.reason}</p>
              </div>
            </div>

            <textarea
              className="w-full mt-4 p-3 border border-gray-300 rounded-lg text-sm"
              rows={3}
              placeholder="Moderator notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 mt-6">
              <button
                onClick={() => resolve("full_refund")}
                className="bg-blue-600 text-white py-2 rounded-lg font-semibold"
              >
                Full refund
              </button>
              <button
                onClick={() => resolve("partial_refund")}
                className="border border-blue-400 text-blue-700 py-2 rounded-lg font-medium"
              >
                Partial refund
              </button>
              <button
                onClick={() => resolve("released_to_host")}
                className="border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Release to host
              </button>
              <button
                onClick={() => resolve("dismissed")}
                className="border border-red-400 text-red-700 py-2 rounded-lg font-medium"
              >
                Dismiss
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full mt-3 text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}