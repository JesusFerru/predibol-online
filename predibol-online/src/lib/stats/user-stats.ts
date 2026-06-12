import {
  buildMultiBetKeySet,
  getBetPoints,
  isCorrectOutcome,
  isExactScore,
  type BetForScoring,
  type MatchForScoring,
} from "@/lib/scoring/rules";
import { createClient } from "@/lib/supabase/server";

type MatchStatus = "PENDING" | "FINISHED" | "CANCELED" | string;

interface MatchBetRow {
  id: number;
  userid: string;
  matchid: string;
  betgoalteam1: number | null;
  betgoalteam2: number | null;
  penaltywinnerteam: 1 | 2 | null;
  createdat: string | null;
  updatedat: string | null;
}

interface MatchResultRow {
  matchid: string;
  team1: string | null;
  team2: string | null;
  goal1: number | null;
  goal2: number | null;
  matchstatus: MatchStatus | null;
  scheduleat: string | null;
}

export interface UserStatsHistoryPoint {
  matchId: string;
  label: string;
  opponentLabel: string;
  predictedScore: string;
  actualScore: string;
  result: "Exact" | "Outcome" | "Miss" | "Pending" | "Canceled";
  points: number;
  cumulativePoints: number;
  playedAt: string | null;
}

export interface UserStats {
  totalPredictions: number;
  finishedPredictions: number;
  pendingPredictions: number;
  canceledPredictions: number;
  exactScoreHits: number;
  correctOutcomeHits: number;
  missedPredictions: number;
  accuracyPercent: number;
  exactRatePercent: number;
  totalPoints: number;
  computedPoints: number;
  paidPayoutsBs: number;
  pendingPayoutsBs: number;
  history: UserStatsHistoryPoint[];
  source: "supabase" | "test";
  hasErrors: boolean;
}

interface FetchUserStatsOptions {
  testData?: boolean;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asScore(value: unknown): number {
  return Math.max(0, Math.trunc(asNumber(value)));
}

function formatMatchLabel(match: MatchResultRow | undefined): string {
  if (!match?.scheduleat) return match?.matchid ? `Match ${match.matchid}` : "Match";

  return new Date(match.scheduleat).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/La_Paz",
  });
}

function buildStats(
  bets: MatchBetRow[],
  matchesById: Map<string, MatchResultRow>,
  rankingPoints: number | null,
  paidPayoutsBs: number,
  pendingPayoutsBs: number,
  source: UserStats["source"],
  hasErrors = false,
): UserStats {
  const safeBets = bets.filter((bet) => bet?.matchid);
  const scoringBets: BetForScoring[] = safeBets.map((bet) => ({
    userid: bet.userid,
    matchid: bet.matchid,
    betgoalteam1: asScore(bet.betgoalteam1),
    betgoalteam2: asScore(bet.betgoalteam2),
    penaltywinnerteam: bet.penaltywinnerteam ?? null,
  }));
  const multiBetKeys = buildMultiBetKeySet(scoringBets);

  let exactScoreHits = 0;
  let correctOutcomeHits = 0;
  let missedPredictions = 0;
  let finishedPredictions = 0;
  let pendingPredictions = 0;
  let canceledPredictions = 0;
  let computedPoints = 0;
  let cumulativePoints = 0;

  const orderedBets = [...safeBets].sort((a, b) => {
    const aMatch = matchesById.get(a.matchid);
    const bMatch = matchesById.get(b.matchid);
    const aTime = new Date(aMatch?.scheduleat ?? a.createdat ?? 0).getTime();
    const bTime = new Date(bMatch?.scheduleat ?? b.createdat ?? 0).getTime();
    return aTime - bTime;
  });

  const history: UserStatsHistoryPoint[] = orderedBets.map((bet) => {
    const match = matchesById.get(bet.matchid);
    const status = match?.matchstatus ?? "PENDING";
    const scoringBet: BetForScoring = {
      userid: bet.userid,
      matchid: bet.matchid,
      betgoalteam1: asScore(bet.betgoalteam1),
      betgoalteam2: asScore(bet.betgoalteam2),
      penaltywinnerteam: bet.penaltywinnerteam ?? null,
    };
    const scoringMatch: MatchForScoring = {
      matchid: match?.matchid ?? bet.matchid,
      team1: match?.team1 ?? "Team 1",
      team2: match?.team2 ?? "Team 2",
      goal1: match?.goal1 ?? null,
      goal2: match?.goal2 ?? null,
      matchstatus: status,
    };

    let result: UserStatsHistoryPoint["result"] = "Pending";
    let points = 0;

    if (status === "CANCELED") {
      canceledPredictions++;
      result = "Canceled";
    } else if (status === "FINISHED") {
      finishedPredictions++;
      const exact = isExactScore(
        scoringBet.betgoalteam1,
        scoringBet.betgoalteam2,
        scoringMatch.goal1,
        scoringMatch.goal2,
      );
      const outcome = isCorrectOutcome(
        scoringBet.betgoalteam1,
        scoringBet.betgoalteam2,
        scoringMatch.goal1,
        scoringMatch.goal2,
      );
      const suppressOutcome =
        multiBetKeys.has(`${scoringBet.userid}::${scoringBet.matchid}`) &&
        !exact;

      points = suppressOutcome ? 0 : getBetPoints(scoringBet, scoringMatch);

      if (exact) {
        exactScoreHits++;
        result = "Exact";
      } else if (outcome) {
        correctOutcomeHits++;
        result = "Outcome";
      } else {
        missedPredictions++;
        result = "Miss";
      }
    } else {
      pendingPredictions++;
    }

    computedPoints += points;
    cumulativePoints += points;

    return {
      matchId: bet.matchid,
      label: formatMatchLabel(match),
      opponentLabel: `${match?.team1 ?? "Team 1"} vs ${match?.team2 ?? "Team 2"}`,
      predictedScore: `${scoringBet.betgoalteam1}-${scoringBet.betgoalteam2}`,
      actualScore:
        match?.goal1 === null || match?.goal1 === undefined || match?.goal2 === null || match?.goal2 === undefined
          ? "-"
          : `${match.goal1}-${match.goal2}`,
      result,
      points,
      cumulativePoints,
      playedAt: match?.scheduleat ?? null,
    };
  });

  const successfulPredictions = exactScoreHits + correctOutcomeHits;
  const accuracyPercent =
    finishedPredictions > 0
      ? Math.round((successfulPredictions / finishedPredictions) * 100)
      : 0;
  const exactRatePercent =
    finishedPredictions > 0
      ? Math.round((exactScoreHits / finishedPredictions) * 100)
      : 0;

  return {
    totalPredictions: safeBets.length,
    finishedPredictions,
    pendingPredictions,
    canceledPredictions,
    exactScoreHits,
    correctOutcomeHits,
    missedPredictions,
    accuracyPercent,
    exactRatePercent,
    totalPoints: rankingPoints ?? computedPoints,
    computedPoints,
    paidPayoutsBs,
    pendingPayoutsBs,
    history,
    source,
    hasErrors,
  };
}

export function buildTestUserStats(): UserStats {
  const bets: MatchBetRow[] = [
    { id: 1, userid: "test", matchid: "1", betgoalteam1: 2, betgoalteam2: 1, penaltywinnerteam: null, createdat: "2026-06-01", updatedat: "2026-06-01" },
    { id: 2, userid: "test", matchid: "2", betgoalteam1: 0, betgoalteam2: 0, penaltywinnerteam: null, createdat: "2026-06-02", updatedat: "2026-06-02" },
    { id: 3, userid: "test", matchid: "3", betgoalteam1: 1, betgoalteam2: 2, penaltywinnerteam: null, createdat: "2026-06-03", updatedat: "2026-06-03" },
    { id: 4, userid: "test", matchid: "4", betgoalteam1: 3, betgoalteam2: 1, penaltywinnerteam: null, createdat: "2026-06-04", updatedat: "2026-06-04" },
    { id: 5, userid: "test", matchid: "5", betgoalteam1: 1, betgoalteam2: 1, penaltywinnerteam: null, createdat: "2026-06-05", updatedat: "2026-06-05" },
    { id: 6, userid: "test", matchid: "6", betgoalteam1: 2, betgoalteam2: 0, penaltywinnerteam: null, createdat: "2026-06-06", updatedat: "2026-06-06" },
  ];
  const matches = new Map<string, MatchResultRow>([
    ["1", { matchid: "1", team1: "Bolivia", team2: "Canada", goal1: 2, goal2: 1, matchstatus: "FINISHED", scheduleat: "2026-06-11T20:00:00Z" }],
    ["2", { matchid: "2", team1: "Mexico", team2: "Japan", goal1: 1, goal2: 1, matchstatus: "FINISHED", scheduleat: "2026-06-12T20:00:00Z" }],
    ["3", { matchid: "3", team1: "Brazil", team2: "France", goal1: 2, goal2: 0, matchstatus: "FINISHED", scheduleat: "2026-06-13T20:00:00Z" }],
    ["4", { matchid: "4", team1: "USA", team2: "Ghana", goal1: 2, goal2: 0, matchstatus: "FINISHED", scheduleat: "2026-06-14T20:00:00Z" }],
    ["5", { matchid: "5", team1: "Spain", team2: "Germany", goal1: null, goal2: null, matchstatus: "PENDING", scheduleat: "2026-06-15T20:00:00Z" }],
    ["6", { matchid: "6", team1: "Argentina", team2: "Italy", goal1: null, goal2: null, matchstatus: "PENDING", scheduleat: "2026-06-16T20:00:00Z" }],
  ]);

  return buildStats(bets, matches, 7, 120, 80, "test");
}

export async function fetchUserStats(
  userId: string,
  options: FetchUserStatsOptions = {},
): Promise<UserStats> {
  if (options.testData) return buildTestUserStats();

  const supabase = await createClient();
  let hasErrors = false;

  const { data: betsData, error: betsError } = await supabase
    .from("matchbets")
    .select(
      "id, userid, matchid, betgoalteam1, betgoalteam2, penaltywinnerteam, createdat, updatedat",
    )
    .eq("userid", userId)
    .order("createdat", { ascending: true });

  if (betsError) {
    console.error("Failed to fetch user match bets:", betsError);
    hasErrors = true;
  }

  const bets = ((betsData ?? []) as MatchBetRow[]).filter(Boolean);
  const matchIds = Array.from(new Set(bets.map((bet) => bet.matchid).filter(Boolean)));

  let matchesById = new Map<string, MatchResultRow>();
  if (matchIds.length > 0) {
    const { data: matchesData, error: matchesError } = await supabase
      .from("matchresults")
      .select("matchid, team1, team2, goal1, goal2, matchstatus, scheduleat")
      .in("matchid", matchIds);

    if (matchesError) {
      console.error("Failed to fetch match results for stats:", matchesError);
      hasErrors = true;
    }

    matchesById = new Map(
      ((matchesData ?? []) as MatchResultRow[])
        .filter((match) => match?.matchid)
        .map((match) => [match.matchid, match]),
    );
  }

  const { data: rankingData, error: rankingError } = await supabase
    .from("tournamentranking")
    .select("points")
    .eq("userid", userId)
    .maybeSingle();

  if (rankingError) {
    console.error("Failed to fetch ranking points for stats:", rankingError);
    hasErrors = true;
  }

  const { data: payoutsData, error: payoutsError } = await supabase
    .from("dailypayouts")
    .select("amountpaidbs, paymentstatus")
    .eq("userid", userId);

  if (payoutsError) {
    console.error("Failed to fetch payouts for stats:", payoutsError);
    hasErrors = true;
  }

  let paidPayoutsBs = 0;
  let pendingPayoutsBs = 0;
  for (const payout of (payoutsData ?? []) as { amountpaidbs: number | string | null; paymentstatus: boolean | null }[]) {
    if (payout?.paymentstatus) {
      paidPayoutsBs += asNumber(payout.amountpaidbs);
    } else {
      pendingPayoutsBs += asNumber(payout?.amountpaidbs);
    }
  }

  return buildStats(
    bets,
    matchesById,
    rankingData ? asNumber((rankingData as { points?: number | string | null }).points) : null,
    paidPayoutsBs,
    pendingPayoutsBs,
    "supabase",
    hasErrors,
  );
}
