import React, { useEffect, useState } from "react";
import { adminList, adminResolveReport } from "../lib/api";

interface Report {
  id: string;
  reporterUid: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  targetOwnerUid?: string;
  reason: string;
  details: string;
  evidenceUrls: string[];
  status: string;
  createdAt: number | null;
}

export default function Reports() {
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [notes, setNotes] = useState("");
  const [issueStrike, setIssueStrike] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("reports", { limit: 100 });
      setItems(res.items as Report[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (
    outcome:
      | "resolved_dismissed"
      | "resolved_warning"
      | "resolved_refund"
      | "resolved_ban"
  ) => {
    if (!selected) return;
    try {
      await adminResolveReport({
        reportId: selected.id,
        outcome,
        moderatorNotes: notes,
        issueStrike,
      });
      setSelected(null);
      setNotes("");
      setIssueStrike(false);
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">
          Review reports and take moderation actions.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No reports.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Reporter
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {r.reporterName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.targetType}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.status === "open"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => setSelected(r)}
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
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Report review
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Reporter:</span>{" "}
                <span className="font-medium">{selected.reporterName}</span>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>{" "}
                <span className="font-medium">{selected.reason}</span>
              </div>
              <div>
                <span className="text-gray-500">Target:</span>{" "}
                <span className="font-medium">
                  {selected.targetType} · {selected.targetId}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Details:</span>
                <p className="text-gray-800 mt-1 whitespace-pre-wrap">
                  {selected.details}
                </p>
              </div>
              {selected.evidenceUrls.length > 0 && (
                <div>
                  <span className="text-gray-500">Evidence:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selected.evidenceUrls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-xs"
                      >
                        Evidence {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <textarea
              className="w-full mt-4 p-3 border border-gray-300 rounded-lg text-sm"
              rows={3}
              placeholder="Moderator notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <label className="flex items-center gap-2 text-sm mt-3">
              <input
                type="checkbox"
                checked={issueStrike}
                onChange={(e) => setIssueStrike(e.target.checked)}
              />
              Issue a strike to the reported user
            </label>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <button
                onClick={() => handleResolve("resolved_dismissed")}
                className="border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolve("resolved_warning")}
                className="border border-yellow-400 text-yellow-700 py-2 rounded-lg font-medium"
              >
                Warn
              </button>
              <button
                onClick={() => handleResolve("resolved_refund")}
                className="border border-blue-400 text-blue-700 py-2 rounded-lg font-medium"
              >
                Refund
              </button>
              <button
                onClick={() => handleResolve("resolved_ban")}
                className="bg-red-600 text-white py-2 rounded-lg font-semibold"
              >
                Ban User
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