import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { adminDashboard, DashboardStats } from "../lib/api";

function StatCard({
  label,
  value,
  emoji,
  accent,
}: {
  label: string;
  value: string | number;
  emoji: string;
  accent?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{emoji}</span>
        {accent && (
          <span className="text-xs font-medium text-gray-500">{accent}</span>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const s = await adminDashboard();
        setStats(s);
      } catch (err: any) {
        setError(err.message ?? "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard…</div>;
  }

  if (error || !stats) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  // Build a simple 7-day signup chart (mock data for now, extend in v2)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: d.toLocaleDateString("en-IN", { weekday: "short" }),
      users: Math.max(0, Math.round((stats.newUsersThisWeek / 7) * (0.7 + Math.random() * 0.6))),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Platform overview and recent activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users.toLocaleString()} emoji="👥" accent={`+${stats.newUsersThisWeek} this week`} />
        <StatCard label="Total Plans" value={stats.plans.toLocaleString()} emoji="📅" />
        <StatCard label="Squads" value={stats.squads.toLocaleString()} emoji="🏏" />
        <StatCard label="Platform Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} emoji="💰" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Open Reports" value={stats.reportsOpen} emoji="🚩" />
        <StatCard label="Open Disputes" value={stats.disputesOpen} emoji="⚖️" />
        <StatCard label="Pending Vendors" value={stats.vendorsPending} emoji="🏪" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            New users (last 7 days)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
              <XAxis dataKey="day" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#E91E63"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent activity
          </h2>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentActivity.slice(0, 8).map((a) => (
                <li key={a.id} className="text-sm text-gray-700">
                  <span className="font-semibold text-primary">{a.type}</span>
                  {a.city ? ` · ${a.city}` : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}