"use client";

import type { UserStats } from "@/lib/stats/user-stats";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AccuracyChartProps {
  stats: UserStats;
}

const BAR_COLORS = ["#16a34a", "#cd0100", "#6b7280"];

export function AccuracyChart({ stats }: AccuracyChartProps) {
  const breakdown = [
    { name: "Exact", value: stats.exactScoreHits },
    { name: "Outcome", value: stats.correctOutcomeHits },
    { name: "Miss", value: stats.missedPredictions },
  ];
  const history = stats.history.filter((point) => point.result !== "Pending");

  if (stats.totalPredictions === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="font-semibold text-gray-700">No predictions yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Stats will appear as soon as this user has match predictions.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">Accuracy breakdown</h2>
          <p className="text-sm text-gray-500">
            Finished predictions grouped by result quality.
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown} margin={{ left: -24, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(205, 1, 0, 0.06)" }}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: "#e5e7eb",
                  boxShadow: "none",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {breakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={BAR_COLORS[index] ?? "#6b7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">Points over time</h2>
          <p className="text-sm text-gray-500">
            Computed from finished matches in prediction order.
          </p>
        </div>
        <div className="h-64">
          {history.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
              Waiting for finished matches.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ left: -24, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                    boxShadow: "none",
                  }}
                  formatter={(value, name) => [
                    value,
                    name === "cumulativePoints" ? "Cumulative points" : name,
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.opponentLabel ?? "Match"
                  }
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePoints"
                  stroke="#cd0100"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#cd0100" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
