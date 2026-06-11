// ─── Tie-breaker data access ────────────────────────────
// Calls the SECURITY DEFINER SQL function get_tiebreaker_counts()
// to retrieve pre-computed tie-breaker values for all paid users.
//
// This bypasses the MatchBets RLS restriction (users can normally
// only read their own bets) and Users RLS (own row only).

import { createClient } from "@/lib/supabase/server";

// ─── Types ──────────────────────────────────────────────

/** Shape returned by get_tiebreaker_counts() SQL function. */
export interface TiebreakerRow {
  userid: string;
  alias: string;
  exact_score_count: number;
  correct_outcome_count: number;
  correct_penalty_count: number;
}

/** Ranking entry combining points + tie-breakers + display info. */
export interface RankingEntry {
  userid: string;
  alias: string;
  points: number;
  exact_score_count: number;
  correct_outcome_count: number;
  correct_penalty_count: number;
}

// ─── Sort function ──────────────────────────────────────

/**
 * Sorts ranking entries by:
 *   1. Points DESC
 *   2. Exact score count DESC
 *   3. Correct outcome count DESC
 *   4. Correct penalty count DESC
 *
 * When all tie-breakers are exhausted, order is stable
 * (preserves input order for equal entries).
 */
export function sortRanking(entries: RankingEntry[]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.exact_score_count !== b.exact_score_count)
      return b.exact_score_count - a.exact_score_count;
    if (a.correct_outcome_count !== b.correct_outcome_count)
      return b.correct_outcome_count - a.correct_outcome_count;
    if (a.correct_penalty_count !== b.correct_penalty_count)
      return b.correct_penalty_count - a.correct_penalty_count;
    return 0;
  });
}

// ─── Data fetching ──────────────────────────────────────

/**
 * Fetches the full ranking: points from TournamentRanking +
 * tie-breaker counts from the SQL function + aliases from
 * the SQL function (SECURITY DEFINER bypasses RLS).
 *
 * Only returns users with haspaidentry = TRUE.
 *
 * IMPORTANT: The get_tiebreaker_counts() SQL function must be
 * deployed to Supabase before calling this function.
 * See: /database/tiebreaker-counts.sql
 */
export async function fetchRanking(): Promise<RankingEntry[]> {
  const supabase = await createClient();

  // Fetch tie-breaker counts (includes alias) via SECURITY DEFINER RPC
  const { data: tiebreakerRows, error: tbError } = await supabase.rpc(
    "get_tiebreaker_counts",
  );

  if (tbError) {
    console.error("Failed to fetch tie-breaker counts:", tbError);
    return [];
  }

  const typedRows = tiebreakerRows as unknown as TiebreakerRow[];

  if (!typedRows || typedRows.length === 0) {
    return [];
  }

  // Fetch points from TournamentRanking (RLS allows all authenticated users)
  // We filter to only users returned by the tie-breaker function (paid users)
  const userIds = typedRows.map((r) => r.userid);

  const { data: rankingRows, error: rankError } = await supabase
    .from("tournamentranking")
    .select("userid, points")
    .in("userid", userIds);

  if (rankError) {
    console.error("Failed to fetch tournament ranking:", rankError);
    return [];
  }

  // Build a points lookup
  const pointsByUser = new Map<string, number>();
  for (const row of rankingRows as { userid: string; points: number }[]) {
    pointsByUser.set(row.userid, row.points);
  }

  // Merge tie-breaker rows with points
  const ranking: RankingEntry[] = typedRows.map((tb) => ({
    userid: tb.userid,
    alias: tb.alias,
    points: pointsByUser.get(tb.userid) ?? 0,
    exact_score_count: tb.exact_score_count,
    correct_outcome_count: tb.correct_outcome_count,
    correct_penalty_count: tb.correct_penalty_count,
  }));

  return sortRanking(ranking);
}
