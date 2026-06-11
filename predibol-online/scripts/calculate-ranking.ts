/**
 * calculate-ranking.ts
 *
 * External script that calculates tournament points for every user
 * and updates the TournamentRanking table.
 *
 * Usage:
 *   pnpm calculate-ranking
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (the anon key
 * cannot write to tournamentranking — the table has only SELECT RLS).
 *
 * Execution frequency (recommended):
 *   - 17:00 Bolivia time (America/La_Paz, UTC-4)
 *   - 21:00 Bolivia time
 *   - 00:00 Bolivia time
 *
 * Schedule via:
 *   - Supabase Cron (pg_cron extension)
 *   - External cron job (GitHub Actions, etc.)
 *   - Manual execution: pnpm calculate-ranking
 *
 * Architecture:
 *   This script is the authoritative source for points calculation.
 *   The web application only reads from TournamentRanking.
 *   Tie-breaker counts are computed on-the-fly by the web app.
 */

import { createClient } from "@supabase/supabase-js";
import {
  POINTS_CORRECT_OUTCOME,
  FINAL_MATCH_ID,
  THIRD_PLACE_MATCH_ID,
  MATCH_STATUS_FINISHED,
  TOURNAMENT_TIMEZONE,
} from "../src/lib/scoring/constants";
import {
  type BetForScoring,
  type MatchForScoring,
  type PodiumPrediction,
  buildMultiBetKeySet,
  derivePodium,
  getBetPoints,
  getPodiumPoints,
} from "../src/lib/scoring/rules";

// ─── Env ────────────────────────────────────────────────

const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY: string = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local\n" +
      "   Add it to .env.local:\n" +
      "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n" +
      "   Find it in Supabase Dashboard → Project Settings → API → service_role key",
  );
  process.exit(1);
}

// ─── Types ──────────────────────────────────────────────

interface DbMatchResult {
  matchid: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchstatus: string;
}

interface DbBet {
  id: number;
  userid: string;
  matchid: string;
  betgoalteam1: number;
  betgoalteam2: number;
  penaltywinnerteam: 1 | 2 | null;
}

interface DbWinnersBet {
  userid: string;
  winner1stplace: string;
  winner2ndplace: string;
  winner3rdplace: string;
}

interface DbUser {
  id: string;
  haspaidentry: boolean;
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("🏆 Predibol — Tournament Ranking Calculation\n");
  console.log(
    `   Started at ${new Date().toLocaleString("es-BO", { timeZone: TOURNAMENT_TIMEZONE })} (Bolivia time)\n`,
  );

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ── 1. Fetch eligible users ───────────────────────────

  console.log("🔵 Fetching eligible users …");

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, haspaidentry")
    .eq("haspaidentry", true);

  if (usersError) {
    console.error("❌ Failed to fetch users:", usersError.message);
    process.exit(1);
  }

  const eligibleIds = new Set((users as DbUser[]).map((u) => u.id));
  console.log(`   ${eligibleIds.size} users with paid entry.\n`);

  if (eligibleIds.size === 0) {
    console.log("⚠ No eligible users. Nothing to calculate.");
    process.exit(0);
  }

  // ── 2. Fetch finished matches ─────────────────────────

  console.log("🔵 Fetching finished matches …");

  const { data: finishedMatches, error: matchesError } = await supabase
    .from("matchresults")
    .select("matchid, team1, team2, goal1, goal2, matchstatus")
    .eq("matchstatus", MATCH_STATUS_FINISHED);

  if (matchesError) {
    console.error("❌ Failed to fetch matches:", matchesError.message);
    process.exit(1);
  }

  const matchMap = new Map<string, DbMatchResult>();
  for (const m of finishedMatches as DbMatchResult[]) {
    matchMap.set(m.matchid, m);
  }

  console.log(`   ${matchMap.size} finished matches.\n`);

  // ── 3. Fetch all bets (only for eligible users) ───────

  console.log("🔵 Fetching bets …");

  // Fetch in batches to handle large user sets
  const userIds = Array.from(eligibleIds);
  const allBets: DbBet[] = [];

  for (let i = 0; i < userIds.length; i += 50) {
    const batch = userIds.slice(i, i + 50);
    const { data: bets, error: betsError } = await supabase
      .from("matchbets")
      .select("id, userid, matchid, betgoalteam1, betgoalteam2, penaltywinnerteam")
      .in("userid", batch);

    if (betsError) {
      console.error("❌ Failed to fetch bets:", betsError.message);
      process.exit(1);
    }

    allBets.push(...(bets as DbBet[]));
  }

  console.log(`   ${allBets.length} bets across ${eligibleIds.size} users.\n`);

  // ── 4. Build multi-bet key set ────────────────────────

  const scoringBets: BetForScoring[] = allBets.map((b) => ({
    userid: b.userid,
    matchid: b.matchid,
    betgoalteam1: b.betgoalteam1,
    betgoalteam2: b.betgoalteam2,
    penaltywinnerteam: b.penaltywinnerteam,
  }));

  const multiBetKeys = buildMultiBetKeySet(scoringBets);
  console.log(
    `🔵 Multi-bet detection: ${multiBetKeys.size} (user, match) pairs with >1 bet.\n`,
  );

  // ── 5. Calculate match points per user ────────────────

  console.log("🔵 Calculating match points …");

  const matchPointsByUser = new Map<string, number>();

  for (const userId of eligibleIds) {
    matchPointsByUser.set(userId, 0);
  }

  for (const bet of scoringBets) {
    if (!eligibleIds.has(bet.userid)) continue;

    const match = matchMap.get(bet.matchid);
    if (!match) continue; // match not finished or not in DB

    // Only score finished matches with known results
    if (
      match.matchstatus !== MATCH_STATUS_FINISHED ||
      match.goal1 === null ||
      match.goal2 === null
    ) {
      continue;
    }

    const multiKey = `${bet.userid}::${bet.matchid}`;
    const isMulti = multiBetKeys.has(multiKey);

    const matchForScoring: MatchForScoring = {
      matchid: match.matchid,
      team1: match.team1,
      team2: match.team2,
      goal1: match.goal1,
      goal2: match.goal2,
      matchstatus: match.matchstatus,
    };

    const basePoints = getBetPoints(bet, matchForScoring);

    if (isMulti && basePoints === POINTS_CORRECT_OUTCOME) {
      // Multi-bet rule: suppress +1 for correct outcome.
      // Only exact-score points (+3) survive.
      continue;
    }

    const current = matchPointsByUser.get(bet.userid) ?? 0;
    matchPointsByUser.set(bet.userid, current + basePoints);
  }

  // ── 6. Calculate podium points ────────────────────────

  console.log("🔵 Calculating podium points …");

  const finalMatch = matchMap.get(FINAL_MATCH_ID) ?? null;
  const thirdPlaceMatch = matchMap.get(THIRD_PLACE_MATCH_ID) ?? null;

  const finalForScoring: MatchForScoring | null = finalMatch
    ? {
        matchid: finalMatch.matchid,
        team1: finalMatch.team1,
        team2: finalMatch.team2,
        goal1: finalMatch.goal1,
        goal2: finalMatch.goal2,
        matchstatus: finalMatch.matchstatus,
      }
    : null;

  const thirdForScoring: MatchForScoring | null = thirdPlaceMatch
    ? {
        matchid: thirdPlaceMatch.matchid,
        team1: thirdPlaceMatch.team1,
        team2: thirdPlaceMatch.team2,
        goal1: thirdPlaceMatch.goal1,
        goal2: thirdPlaceMatch.goal2,
        matchstatus: thirdPlaceMatch.matchstatus,
      }
    : null;

  const podium = derivePodium(finalForScoring, thirdForScoring);

  if (podium) {
    console.log(
      `   Podium resolved — 🥇 ${podium.champion}  🥈 ${podium.runnerUp}  🥉 ${podium.thirdPlace}\n`,
    );

    // Fetch all podium predictions
    const { data: winnersBets, error: wbError } = await supabase
      .from("winnersbets")
      .select("userid, winner1stplace, winner2ndplace, winner3rdplace");

    if (wbError) {
      console.error("❌ Failed to fetch winners bets:", wbError.message);
      process.exit(1);
    }

    for (const wb of winnersBets as DbWinnersBet[]) {
      if (!eligibleIds.has(wb.userid)) continue;

      const prediction: PodiumPrediction = {
        winner1stplace: wb.winner1stplace,
        winner2ndplace: wb.winner2ndplace,
        winner3rdplace: wb.winner3rdplace,
      };

      const podiumPoints = getPodiumPoints(prediction, podium);
      const current = matchPointsByUser.get(wb.userid) ?? 0;
      matchPointsByUser.set(wb.userid, current + podiumPoints);
    }
  } else {
    console.log("   Final not yet played — skipping podium points.\n");
  }

  // ── 7. Upsert TournamentRanking ───────────────────────

  console.log("🔵 Updating TournamentRanking …");

  const now = new Date().toISOString();
  const rankingRows: { userid: string; points: number; updatedat: string }[] =
    [];

  for (const [userId, points] of matchPointsByUser) {
    rankingRows.push({
      userid: userId,
      points,
      updatedat: now,
    });
  }

  // Sort for logging
  rankingRows.sort((a, b) => b.points - a.points);

  const BATCH_SIZE = 50;
  let processed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rankingRows.length; i += BATCH_SIZE) {
    const batch = rankingRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("tournamentranking")
      .upsert(batch, {
        onConflict: "userid",
        ignoreDuplicates: false,
      });

    if (error) {
      errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      continue;
    }

    processed += batch.length;
  }

  console.log(`   ${processed} rankings upserted.`);

  if (errors.length > 0) {
    console.log("\n⚠ Errors:");
    for (const e of errors) {
      console.log(`   - ${e}`);
    }
  }

  // ── 8. Summary ────────────────────────────────────────

  console.log("\n✅ Ranking calculation complete.\n");
  console.log("🏅 Top 5:");
  for (let i = 0; i < Math.min(5, rankingRows.length); i++) {
    const r = rankingRows[i];
    console.log(
      `   ${String(i + 1).padStart(2, " ")}. ${r.userid.slice(0, 8)}… — ${r.points} pts`,
    );
  }
  console.log("");
}

main().catch((err) => {
  console.error("❌ Ranking calculation failed:", err);
  process.exit(1);
});
