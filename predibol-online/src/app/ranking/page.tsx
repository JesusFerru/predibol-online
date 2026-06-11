import { Shell } from "@/components/layout/shell";
import { RankingTable } from "@/components/ranking/ranking-table";
import { createClient } from "@/lib/supabase/server";
import { fetchRanking } from "@/lib/scoring/tiebreakers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ranking = await fetchRanking();

  return (
    <Shell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* ── Page header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tournament Ranking
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {ranking.length > 0
                  ? `${ranking.length} participants ranked by total points.`
                  : "Standings will update as matches are played."}
              </p>
            </div>

            {/* Back to portal */}
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Predictions
            </Link>
          </div>
        </div>

        {/* ── Tie-breaker explanation ── */}
        {ranking.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">
              <strong className="text-gray-700">Tie-breakers</strong> are
              applied in order: exact scores → correct outcomes → penalty
              predictions. If all criteria are tied, positions are merged.
            </p>
          </div>
        )}

        {/* ── Ranking table ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <RankingTable ranking={ranking} currentUserId={user.id} />
        </div>
      </div>
    </Shell>
  );
}
