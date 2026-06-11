// ─── Scoring Constants ──────────────────────────────────
// All business-rule values live here so the scoring engine
// never depends on magic numbers or hardcoded strings.
//
// When the tournament structure or scoring rules change,
// update this file — both the external script and the web
// app consume these constants.

// ── Points ──────────────────────────────────────────────

/** Points awarded for predicting the exact final score. */
export const POINTS_EXACT_SCORE = 3;

/** Points awarded for predicting the correct outcome (win/draw). */
export const POINTS_CORRECT_OUTCOME = 1;

/** Points awarded for an incorrect prediction. */
export const POINTS_INCORRECT = 0;

// ── Podium ──────────────────────────────────────────────

/** Points for predicting the tournament champion. */
export const POINTS_CHAMPION = 20;

/** Points for predicting the tournament runner-up. */
export const POINTS_RUNNER_UP = 10;

/** Points for predicting the third-place team. */
export const POINTS_THIRD_PLACE = 5;

// ── Match IDs ───────────────────────────────────────────

/** Match ID of the tournament final. */
export const FINAL_MATCH_ID = "104";

/** Match ID of the third-place match. */
export const THIRD_PLACE_MATCH_ID = "103";

// ── Knockout rounds ─────────────────────────────────────

/**
 * Round names that identify knockout-stage matches.
 * Group-stage matches use "Matchday N" and are excluded.
 */
export const KNOCKOUT_ROUNDS = new Set([
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Match for third place",
  "Final",
]);

/**
 * Match IDs for all knockout-stage matches (73–104).
 * Used when round metadata is unavailable (e.g. inside SQL).
 */
export const KNOCKOUT_MATCH_IDS = new Set(
  Array.from({ length: 32 }, (_, i) => String(73 + i)),
);

// ── Prediction window ───────────────────────────────────

/** Minutes before kickoff when predictions lock. */
export const PREDICTION_LOCK_MINUTES = 10;

/** Timezone for all deadline calculations. */
export const TOURNAMENT_TIMEZONE = "America/La_Paz";

// ── Goal range ──────────────────────────────────────────

export const GOAL_MIN = 0;
export const GOAL_MAX = 30;

// ── Match status ────────────────────────────────────────

export const MATCH_STATUS_PENDING = "PENDING" as const;
export const MATCH_STATUS_FINISHED = "FINISHED" as const;
export const MATCH_STATUS_CANCELED = "CANCELED" as const;

// ── Daily pool ──────────────────────────────────────────

export const DAILY_POOL_MINIMUM_PLAYERS = 3;
export const DAILY_POOL_MAINTENANCE_PCT = 10;
export const DAILY_POOL_WINNERS_PCT = 90;
export const FINAL_MATCH_MAINTENANCE_PCT = 5;
export const FINAL_MATCH_TOURNAMENT_PCT = 95;

// ── Tournament pool distribution ────────────────────────

export const TOURNAMENT_POOL_FIRST_PCT = 50;
export const TOURNAMENT_POOL_SECOND_PCT = 25;
export const TOURNAMENT_POOL_THIRD_PCT = 15;
export const TOURNAMENT_POOL_FOURTH_PCT = 5;
export const TOURNAMENT_POOL_CHARITY_PCT = 5;
