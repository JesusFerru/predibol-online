import type { UserStatsHistoryPoint } from "@/lib/stats/user-stats";

interface HistoryTimelineProps {
  history: UserStatsHistoryPoint[];
}

const RESULT_STYLES: Record<UserStatsHistoryPoint["result"], string> = {
  Exact: "bg-green-50 text-green-700",
  Outcome: "bg-crimson/10 text-crimson",
  Miss: "bg-gray-100 text-gray-600",
  Pending: "bg-yellow-50 text-yellow-700",
  Canceled: "bg-gray-100 text-gray-500",
};

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="font-semibold text-gray-700">No match history yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Predictions will be listed here once they exist in Supabase.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="font-semibold text-gray-900">Prediction history</h2>
        <p className="text-sm text-gray-500">Latest saved predictions and outcomes.</p>
      </div>
      <div className="divide-y divide-gray-100">
        {history.slice(-8).reverse().map((point) => (
          <div
            key={`${point.matchId}-${point.predictedScore}`}
            className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
          >
            <div>
              <p className="font-medium text-gray-900">{point.opponentLabel}</p>
              <p className="text-sm text-gray-500">
                {point.label} · Predicted {point.predictedScore} · Actual {point.actualScore}
              </p>
            </div>
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${RESULT_STYLES[point.result]}`}
            >
              {point.result}
            </span>
            <p className="font-mono text-sm font-semibold tabular-nums text-gray-700">
              +{point.points} pts
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
