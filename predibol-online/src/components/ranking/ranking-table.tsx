"use client";

import type { RankingEntry } from "@/lib/scoring/tiebreakers";

interface RankingTableProps {
  ranking: RankingEntry[];
  currentUserId: string;
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900 shadow-sm"
        aria-label="First place"
      >
        1
      </span>
    );
  }

  if (position === 2) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700 shadow-sm"
        aria-label="Second place"
      >
        2
      </span>
    );
  }

  if (position === 3) {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-sm"
        aria-label="Third place"
      >
        3
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 w-7 items-center justify-center text-xs font-medium text-gray-400">
      {position}
    </span>
  );
}

export function RankingTable({ ranking, currentUserId }: RankingTableProps) {
  if (ranking.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">
          No ranking data yet
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Rankings will appear once matches are played and points are calculated.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop table ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3 font-semibold w-12">#</th>
              <th className="px-4 py-3 font-semibold">Alias</th>
              <th className="px-4 py-3 font-semibold text-right">Points</th>
              <th className="px-4 py-3 font-semibold text-right">
                <span className="hidden lg:inline">Exact Scores</span>
                <span className="lg:hidden">Exact</span>
              </th>
              <th className="px-4 py-3 font-semibold text-right">
                <span className="hidden lg:inline">Outcomes</span>
                <span className="lg:hidden">Out</span>
              </th>
              <th className="px-4 py-3 font-semibold text-right">
                <span className="hidden lg:inline">Penalties</span>
                <span className="lg:hidden">Pen</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranking.map((entry, idx) => {
              const position = idx + 1;
              const isCurrentUser = entry.userid === currentUserId;

              return (
                <tr
                  key={entry.userid}
                  className={`transition-colors hover:bg-gray-50 ${
                    isCurrentUser
                      ? "bg-crimson/5 font-semibold"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <PositionBadge position={position} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      {entry.alias}
                      {isCurrentUser && (
                        <span className="rounded-full bg-crimson/10 px-1.5 py-0.5 text-[10px] font-medium text-crimson">
                          You
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base tabular-nums">
                    {entry.points}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                    {entry.exact_score_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                    {entry.correct_outcome_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-400">
                    {entry.correct_penalty_count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="sm:hidden flex flex-col gap-3">
        {ranking.map((entry, idx) => {
          const position = idx + 1;
          const isCurrentUser = entry.userid === currentUserId;

          return (
            <div
              key={entry.userid}
              className={`rounded-xl border-2 px-4 py-3 ${
                isCurrentUser
                  ? "border-crimson/30 bg-crimson/5"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PositionBadge position={position} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {entry.alias}
                      {isCurrentUser && (
                        <span className="ml-1.5 rounded-full bg-crimson/10 px-1.5 py-0.5 text-[10px] font-medium text-crimson">
                          You
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold font-mono tabular-nums text-crimson">
                  {entry.points}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">pts</span>
                </p>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-500">
                <span>
                  <strong className="text-gray-700">{entry.exact_score_count}</strong> Exact
                </span>
                <span>
                  <strong className="text-gray-700">{entry.correct_outcome_count}</strong> Outcomes
                </span>
                <span>
                  <strong className="text-gray-500">{entry.correct_penalty_count}</strong> Pen
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
