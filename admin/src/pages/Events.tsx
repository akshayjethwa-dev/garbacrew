import React, { useEffect, useState } from "react";
import { adminList, adminUpsert, adminDelete } from "../lib/api";

interface EventDoc {
  id: string;
  name: string;
  city: string;
  date?: string;
  crews?: number;
  attendees?: number;
  isVerified?: boolean;
}

const EMPTY: Omit<EventDoc, "id"> = {
  name: "",
  city: "",
  date: "",
  crews: 0,
  attendees: 0,
  isVerified: false,
};

export default function Events() {
  const [items, setItems] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EventDoc | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<EventDoc, "id">>(EMPTY);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("events", { limit: 100 });
      setItems(res.items as EventDoc[]);
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

  const openEdit = (e: EventDoc) => {
    setEditing(e);
    const { id, ...rest } = e;
    setForm({ ...EMPTY, ...rest });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      await adminUpsert("events", form, editing?.id);
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await adminDelete("events", id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage Garba events and festivals.</p>
        </div>
        <button
          onClick={openNew}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primaryDark"
        >
          + Add Event
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
          <div className="p-8 text-center text-gray-500">No events yet.</div>
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
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                  Crews
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {e.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{e.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {e.date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {e.crews ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => openEdit(e)}
                      className="text-primary hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
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
              {editing ? "Edit Event" : "New Event"}
            </h2>

            <div className="space-y-3">
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Event name"
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
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.date ?? ""}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg"
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