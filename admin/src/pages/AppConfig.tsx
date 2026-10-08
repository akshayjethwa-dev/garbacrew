import React, { useEffect, useState } from "react";
import { adminList, adminUpsert } from "../lib/api";

export default function AppConfigPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [citiesText, setCitiesText] = useState("");
  const [activitiesText, setActivitiesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminList("appConfig", { limit: 50 });
      setItems(res.items);
      const cfg = res.items.find((i: any) => i.id === "main");
      if (cfg) {
        setCitiesText((cfg.cities ?? []).join("\n"));
        setActivitiesText((cfg.activities ?? []).join("\n"));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await adminUpsert(
        "appConfig",
        {
          cities: citiesText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          activities: activitiesText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        "main"
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">App Config</h1>
        <p className="text-gray-500 mt-1">
          Manage the lists shown across the app. Changes reflect immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Cities (one per line)
          </h2>
          <textarea
            rows={12}
            className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
            value={citiesText}
            onChange={(e) => setCitiesText(e.target.value)}
            placeholder={"Mumbai\nPune\nAhmedabad"}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Activities (one per line)
          </h2>
          <textarea
            rows={12}
            className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
            value={activitiesText}
            onChange={(e) => setActivitiesText(e.target.value)}
            placeholder={"cricket\ntrek\ngarba\nmovie"}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save config"}
        </button>
        {saved && (
          <span className="text-green-600 text-sm font-medium">
            ✓ Saved. The app will pick this up on next screen load.
          </span>
        )}
      </div>
    </div>
  );
}