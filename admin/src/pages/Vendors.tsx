import React, { useEffect, useState } from "react";
import { adminList, adminUpsert } from "../lib/api";

interface Vendor {
  id: string;
  name: string;
  category: string;
  city: string;
  description?: string;
  phone?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  commissionPercent?: number;
}

export default function Vendors() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("vendors", { limit: 100 });
      setItems(res.items as Vendor[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (v: Vendor, status: Vendor["status"]) => {
    await adminUpsert("vendors", { status }, v.id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-500 mt-1">
          Review and approve vendor applications. Commission is charged per
          booking.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No vendors yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  City
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
              {items.map((v) => (
                <tr key={v.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {v.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {v.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.city}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        v.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : v.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    {v.status !== "approved" && (
                      <button
                        onClick={() => setStatus(v, "approved")}
                        className="text-green-600 hover:underline font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {v.status !== "rejected" && (
                      <button
                        onClick={() => setStatus(v, "rejected")}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}