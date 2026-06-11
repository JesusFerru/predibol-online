// ─── Scoring Rules (pure functions) ─────────────────────
// Every function is deterministic and side-effect-free.
// These are consumed by:
//   - scripts/calculate-ranking.ts  (external ranking script)
//   - src/lib/scoring/tiebreakers.ts (web-app tie-breaker display)
//
// Database reminder: PostgreSQL folds unquoted identifiers to
// lowercase. Property names on rows returned by Supabase match
// the stored column name (all lowercase).

import {
  POINTS_EXACT_SCORE,
  POINTS_CORRECT_OUTCOME,
  POINTS_INCORRECT,
  POINTS_CHAMPION,
  POINTS_RUNNER_UP,
  POINTS_THIRD_PLACE,
  KNOCKOUT_ROUNDS,
  MATCH_STATUS_FINISHED,
} from "./constants";

// ─── Types ──────────────────────────────────────────────

/** Minimal bet shape — only the fields scoring needs. */
export interface BetForScoring {
  userid: string;
  matchid: string;
  betgoalteam1: number;
  betgoalteam2: number;
  penaltywinnerteam: 1 | 2 | null;
}

/** Minimal match-result shape for score evaluation. */
export interface MatchForScoring {
  matchid: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchstatus: string;
  /** Round name (from JSON; may be absent for DB-only rows). */
  round?: string | null;
}

/** Outcome of a match from the perspective of team 1. */
export type MatchOutcome = "team1" | "team2" | "draw";

// ─── Outcome detection ──────────────────────────────────

/**
 * Returns the outcome of the *actual* match result.
 * Returns null when the match has no score yet (not finished).
 */
export function getMatchOutcome(
  goal1: number | null,
  goal2: number | null,
): MatchOutcome | null {
  if (goal1 === null || goal2 === null) return null;
  if (goal1 > goal2) return "team1";
  if (goal1 < goal2) return "team2";
  return "draw";
}

/**
 * Returns the outcome the user predicted.
 */
export function getBetOutcome(
  betGoal1: number,
  betGoal2: number,
): MatchOutcome {
  if (betGoal1 > betGoal2) return "team1";
  if (betGoal1 < betGoal2) return "team2";
  return "draw";
}

// ─── Score evaluation ───────────────────────────────────

/**
 * True when the predicted score matches the official score exactly.
 * Both goals must be non-null (match finished).
 */
export function isExactScore(
  betGoal1: number,
  betGoal2: number,
  actualGoal1: number | null,
  actualGoal2: number | null,
): boolean {
  if (actualGoal1 === null || actualGoal2 === null) return false;
  return betGoal1 === actualGoal1 && betGoal2 === actualGoal2;
}

/**
 * True when the predicted outcome (win/draw direction) matches
 * the actual outcome. Does NOT require exact score.
 *
 * Used for awarding +1 point. When a user has multiple bets on
 * the same match the caller must suppress this point, but this
 * function still returns true (it only checks direction).
 */
export function isCorrectOutcome(
  betGoal1: number,
  betGoal2: number,
  actualGoal1: number | null,
  actualGoal2: number | null,
): boolean {
  const actual = getMatchOutcome(actualGoal1, actualGoal2);
  if (!actual) return false;
  return getBetOutcome(betGoal1, betGoal2) === actual;
}

// ─── Points for a single bet ────────────────────────────

/**
 * Returns the base points a single bet earns for a finished match.
 *
 * Does NOT account for the multi-bet suppression rule — the caller
 * must check `hasMultipleBets` (or `buildMultiBetKeySet`) and
 * suppress correct-outcome points (+1) when the user placed more
 * than one bet on the same match.
 */
export function getBetPoints(
  bet: BetForScoring,
  match: MatchForScoring,
): number {
  if (match.matchstatus !== MATCH_STATUS_FINISHED) return POINTS_INCORRECT;
  if (match.goal1 === null || match.goal2 === null) return POINTS_INCORRECT;

  if (
    isExactScore(
      bet.betgoalteam1,
      bet.betgoalteam2,
      match.goal1,
      match.goal2,
    )
  ) {
    return POINTS_EXACT_SCORE;
  }

  if (
    isCorrectOutcome(
      bet.betgoalteam1,
      bet.betgoalteam2,
      match.goal1,
      match.goal2,
    )
  ) {
    return POINTS_CORRECT_OUTCOME;
  }

  return POINTS_INCORRECT;
}

// ─── Knockout detection ─────────────────────────────────

/** True when the round name indicates a knockout-stage match. */
export function isKnockoutRound(round: string | null | undefined): boolean {
  if (!round) return false;
  return KNOCKOUT_ROUNDS.has(round);
}

/** True when the match ended in a draw (both goals non-null and equal). */
export function isDraw(
  goal1: number | null,
  goal2: number | null,
): boolean {
  if (goal1 === null || goal2 === null) return false;
  return goal1 === goal2;
}

// ─── Multi-bet detection ────────────────────────────────

/**
 * Returns true when the user placed more than one bet on this match.
 * When true, correct-outcome points (+1) must be suppressed for
 * ALL bets on this match. Only exact-score points (+3) are eligible.
 */
export function hasMultipleBets(
  bets: BetForScoring[],
  matchId: string,
  userId: string,
): boolean {
  let count = 0;
  for (const bet of bets) {
    if (bet.matchid === matchId && bet.userid === userId) {
      count++;
      if (count > 1) return true;
    }
  }
  return false;
}

/**
 * Groups bets by (userId, matchId) and returns a Set of keys
 * where the user has more than one bet.
 *
 * Key format: `${userid}::${matchid}`
 *
 * Use this when processing many users at once — build the set
 * once, then check `multiBetKeys.has(key)` instead of calling
 * `hasMultipleBets` repeatedly.
 */
export function buildMultiBetKeySet(
  bets: BetForScoring[],
): Set<string> {
  const countByKey = new Map<string, number>();
  for (const bet of bets) {
    const key = `${bet.userid}::${bet.matchid}`;
    countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
  }
  const multi = new Set<string>();
  for (const [key, count] of countByKey) {
    if (count > 1) multi.add(key);
  }
  return multi;
}

// ─── Penalty winner evaluation ──────────────────────────

/**
 * Returns true when the user correctly predicted which team would
 * advance on penalties. Only meaningful for knockout matches that
 * ended in a draw.
 */
export function isCorrectPenaltyWinner(
  betPenaltyWinner: 1 | 2 | null,
  actualAdvancingTeam: 1 | 2,
): boolean {
  return betPenaltyWinner === actualAdvancingTeam;
}

// ─── Podium evaluation ──────────────────────────────────

export interface PodiumPrediction {
  winner1stplace: string;
  winner2ndplace: string;
  winner3rdplace: string;
}

export interface PodiumActual {
  champion: string;
  runnerUp: string;
  thirdPlace: string;
}

/**
 * Derives the actual podium from finished Final and Third-Place matches.
 *
 * Returns null if the Final has not yet been played.
 *
 * @param finalMatch      — Finished Final match (matchId 104), must have team1/team2/goal1/goal2
 * @param thirdPlaceMatch — Finished Third-Place match (matchId 103), must have team1/team2/goal1/goal2
 */
export function derivePodium(
  finalMatch: MatchForScoring | null,
  thirdPlaceMatch: MatchForScoring | null,
): PodiumActual | null {
  if (
    !finalMatch ||
    finalMatch.matchstatus !== MATCH_STATUS_FINISHED ||
    finalMatch.goal1 === null ||
    finalMatch.goal2 === null
  ) {
    return null;
  }

  const finalOutcome = getMatchOutcome(finalMatch.goal1, finalMatch.goal2)!;

  const champion =
    finalOutcome === "team1" ? finalMatch.team1 : finalMatch.team2;
  const runnerUp =
    finalOutcome === "team1" ? finalMatch.team2 : finalMatch.team1;

  let thirdPlace = "";
  if (
    thirdPlaceMatch &&
    thirdPlaceMatch.matchstatus === MATCH_STATUS_FINISHED &&
    thirdPlaceMatch.goal1 !== null &&
    thirdPlaceMatch.goal2 !== null
  ) {
    const tpOutcome = getMatchOutcome(
      thirdPlaceMatch.goal1,
      thirdPlaceMatch.goal2,
    )!;
    thirdPlace =
      tpOutcome === "team1"
        ? thirdPlaceMatch.team1
        : thirdPlaceMatch.team2;
  }

  return { champion, runnerUp, thirdPlace };
}

/**
 * Calculates podium points for a single user's prediction.
 *
 * Cross-position rule (normativas.md §1b):
 * A team predicted in the wrong podium slot earns 0 points.
 * Example: predicting France for 3rd place when France is champion → 0 pts.
 * Each prediction is checked independently against its actual slot.
 */
export function getPodiumPoints(
  prediction: PodiumPrediction,
  actual: PodiumActual,
): number {
  let points = 0;

  if (prediction.winner1stplace === actual.champion) {
    points += POINTS_CHAMPION;
  }

  if (prediction.winner2ndplace === actual.runnerUp) {
    points += POINTS_RUNNER_UP;
  }

  if (prediction.winner3rdplace === actual.thirdPlace) {
    points += POINTS_THIRD_PLACE;
  }

  return points;
}
