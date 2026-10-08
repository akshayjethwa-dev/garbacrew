import React, { useEffect, useState } from "react";
import { adminList, adminUpsert, adminDelete } from "../lib/api";

interface Photographer {
  id: string;
  name: string;
  city: string;
  phone?: string;
  rating?: number;
  bookings?: number;
  isVerified?: boolean;
  isActive?: boolean;
}

const EMPTY: Omit<Photographer, "id"> = {
  name: "",
  city: "",
  phone: "",
  rating: 0,
  bookings: 0,
  isVerified: false,
  isActive: true,
};

export default function Photographers() {
  const [items, setItems] = useState<Photographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Photographer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Photographer, "id">>(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("photographers", { limit: 100 });
      setItems(res.items as Photographer[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (p: Photographer) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm({ ...EMPTY, ...rest });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      await adminUpsert("photographers", form, editing?.id);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photographer?")) return;
    try {
      await adminDelete("photographers", id);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Photographers</h1>
          <p className="text-gray-500 mt-1">
            Manage the photographer directory.
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark"
        >
          + Add Photographer
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No photographers yet.
          </div>
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
                  Rating
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Bookings
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Verified
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    ⭐ {p.rating ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.bookings ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {p.isVerified ? (
                      <span className="text-green-600 font-medium">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-primary hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editing ? "Edit Photographer" : "New Photographer"}
            </h2>

            <div className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Phone"
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVerified ?? false}
                    onChange={(e) =>
                      setForm({ ...form, isVerified: e.target.checked })
                    }
                  />
                  Verified
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive ?? true}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}