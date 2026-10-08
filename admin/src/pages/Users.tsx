import React, { useEffect, useState } from "react";
import { adminList, adminUserAction } from "../lib/api";

interface UserDoc {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  hostScore?: number;
  guestScore?: number;
  trustBalance?: number;
  isVerified?: boolean;
  isBanned?: boolean;
  suspendedUntil?: any;
  createdAt?: number;
}

export default function Users() {
  const [items, setItems] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("users", { limit: 100 });
      setItems(res.items as UserDoc[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(s) ||
      (u.email ?? "").toLowerCase().includes(s) ||
      (u.phone ?? "").toLowerCase().includes(s)
    );
  });

  const act = async (uid: string, action: any, payload?: any) => {
    try {
      await adminUserAction({ uid, action, payload });
      await load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">
          Search and manage user accounts, scores, and bans.
        </p>
      </div>

      <input
        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-lg"
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No users found.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  City
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Scores
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
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">
                      {u.name ?? "—"}
                    </div>
                    <div className="text-gray-500 text-xs">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {u.city ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span title="Host">H:{u.hostScore ?? 50}</span>{" "}
                    <span title="Guest">G:{u.guestScore ?? 50}</span>{" "}
                    <span title="Trust">T:{u.trustBalance ?? 50}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {u.isBanned ? (
                      <span className="text-red-600 font-medium">Banned</span>
                    ) : u.suspendedUntil ? (
                      <span className="text-yellow-600 font-medium">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-green-600 font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    {u.isBanned ? (
                      <button
                        onClick={() => act(u.id, "unban")}
                        className="text-green-600 hover:underline font-medium"
                      >
                        Unban
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            act(u.id, "suspend", { days: 7 })
                          }
                          className="text-yellow-600 hover:underline font-medium"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => act(u.id, "ban")}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Ban
                        </button>
                      </>
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