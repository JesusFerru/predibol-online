"use server";

import { getJsonMatchById, getTeamByName } from "@/lib/data/matches";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SavePredictionResult {
  success: boolean;
  error?: string;
}

// ─── Podium prediction deadline ─────────────────────────
// Per business-rules.md: June 27, 2026 (end of day, Bolivia time).

const PODIUM_DEADLINE = new Date("2026-06-28T03:59:00Z"); // June 27 23:59 UTC-4

export async function savePrediction(
  matchId: string,
  betGoalTeam1: number,
  betGoalTeam2: number,
): Promise<SavePredictionResult> {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to save predictions." };
  }

  // Validate goal range
  if (
    !Number.isInteger(betGoalTeam1) ||
    !Number.isInteger(betGoalTeam2) ||
    betGoalTeam1 < 0 ||
    betGoalTeam1 > 30 ||
    betGoalTeam2 < 0 ||
    betGoalTeam2 > 30
  ) {
    return { success: false, error: "Goals must be a whole number between 0 and 30." };
  }

  // ── Match validation: Supabase first, JSON fallback ──

  let matchStatus = "PENDING";
  let scheduleAt: string | null = null;

  // Try Supabase first
  const { data: dbMatch } = await supabase
    .from("matchresults")
    .select("matchid, matchstatus, scheduleat")
    .eq("matchid", matchId)
    .maybeSingle();

  if (dbMatch) {
    matchStatus = dbMatch.matchstatus;
    scheduleAt = dbMatch.scheduleat;
  } else {
    // Fallback to JSON data for development
    const jsonMatch = getJsonMatchById(matchId);
    if (!jsonMatch) {
      return { success: false, error: "Match not found." };
    }
    matchStatus = jsonMatch.matchStatus;
    scheduleAt = jsonMatch.scheduleAt;
  }

  if (matchStatus !== "PENDING") {
    return { success: false, error: "This match is no longer open for predictions." };
  }

  if (!scheduleAt) {
    return { success: false, error: "Match schedule is not available." };
  }

  // Enforce deadline: 10 minutes before kickoff (America/La_Paz, UTC-4)
  const kickoff = new Date(scheduleAt);
  const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);

  if (new Date() >= deadline) {
    return { success: false, error: "The prediction deadline for this match has passed." };
  }

  // ── Upsert prediction ──

  const { data: existing } = await supabase
    .from("matchbets")
    .select("id")
    .eq("userid", user.id)
    .eq("matchid", matchId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    const { error: updateError } = await supabase
      .from("matchbets")
      .update({
        betgoalteam1: betGoalTeam1,
        betgoalteam2: betGoalTeam2,
        updatedat: now,
      })
      .eq("id", existing.id);

    if (updateError) {
      return { success: false, error: "Failed to update prediction. Please try again." };
    }
  } else {
    const { error: insertError } = await supabase
      .from("matchbets")
      .insert({
        userid: user.id,
        matchid: matchId,
        betgoalteam1: betGoalTeam1,
        betgoalteam2: betGoalTeam2,
      });

    if (insertError) {
      // FK constraint: match not in database yet; matches must be imported first
      if (insertError.code === "23503") {
        return {
          success: false,
          error: "Match data has not been imported yet. Please try again soon.",
        };
      }
      return { success: false, error: "Failed to save prediction. Please try again." };
    }
  }

  revalidatePath("/portal");
  return { success: true };
}

// ─── Podium Prediction ──────────────────────────────────

export interface SavePodiumResult {
  success: boolean;
  error?: string;
}

/**
 * Saves or updates the user's tournament podium prediction.
 *
 * Business rules (business-rules.md § Tournament Podium Prediction):
 *   - Champion, runner-up, third place must all be provided.
 *   - A country cannot be selected more than once.
 *   - Deadline: June 27, 2026 (end of day, America/La_Paz).
 *   - After the deadline the prediction cannot be modified.
 */
export async function savePodiumPrediction(
  champion: string,
  runnerUp: string,
  thirdPlace: string,
): Promise<SavePodiumResult> {
  const supabase = await createClient();

  // ── Auth ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // ── Deadline check ──
  if (new Date() >= PODIUM_DEADLINE) {
    return {
      success: false,
      error:
        "The podium prediction deadline has passed (June 27, 2026). No further changes are allowed.",
    };
  }

  // ── Trim & validate presence ──
  const c = champion.trim();
  const r = runnerUp.trim();
  const t = thirdPlace.trim();

  if (!c || !r || !t) {
    return {
      success: false,
      error: "You must select a champion, runner-up, and third place.",
    };
  }

  // ── No duplicates ──
  if (c === r || c === t || r === t) {
    return {
      success: false,
      error: "The same country cannot be selected more than once.",
    };
  }

  // ── Validate team names against known teams ──
  const missing: string[] = [];
  if (!getTeamByName(c)) missing.push(c);
  if (!getTeamByName(r)) missing.push(r);
  if (!getTeamByName(t)) missing.push(t);

  if (missing.length > 0) {
    return {
      success: false,
      error: `Unknown team(s): ${missing.join(", ")}.`,
    };
  }

  // ── Upsert into winnersbets (one row per user, PK = userid) ──
  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("winnersbets")
    .upsert(
      {
        userid: user.id,
        winner1stplace: c,
        winner2ndplace: r,
        winner3rdplace: t,
        updatedat: now,
      },
      { onConflict: "userid" },
    );

  if (upsertError) {
    console.error("Failed to save podium prediction:", upsertError);
    return {
      success: false,
      error: "Failed to save podium prediction. Please try again.",
    };
  }

  revalidatePath("/portal");
  return { success: true };
}

// ─── Extra Prediction (Daily Pool) ────────────────────────

export type PaymentMethod = "receipt" | "credit";

export interface ExtraPredictionResult {
  success: boolean;
  error?: string;
  betId?: number;
}

/**
 * Creates an extra prediction for a Match of the Day, entering the Daily Pool.
 *
 * Business rules (phase-4-plan.md M2):
 *   - Match must have hasextrapool = true.
 *   - Match must be PENDING and before the deadline.
 *   - Duplicate score combinations are not allowed for the same user and match.
 *   - Payment method is locked at creation time.
 *   - Credit-based: consumes 1 credit, receipturl = NULL.
 *   - Receipt-based: requires a receipt URL, paymentvalidated = false.
 */
export async function createExtraPrediction(
  matchId: string,
  betGoalTeam1: number,
  betGoalTeam2: number,
  paymentMethod: PaymentMethod,
  receiptUrl?: string,
): Promise<ExtraPredictionResult> {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // Validate goal range
  if (
    !Number.isInteger(betGoalTeam1) ||
    !Number.isInteger(betGoalTeam2) ||
    betGoalTeam1 < 0 ||
    betGoalTeam1 > 30 ||
    betGoalTeam2 < 0 ||
    betGoalTeam2 > 30
  ) {
    return { success: false, error: "Goals must be a whole number between 0 and 30." };
  }

  // Validate match: MOTD, PENDING, deadline
  let matchStatus = "PENDING";
  let scheduleAt: string | null = null;
  let hasExtraPool = false;

  const { data: dbMatch } = await supabase
    .from("matchresults")
    .select("matchid, matchstatus, scheduleat, hasextrapool")
    .eq("matchid", matchId)
    .maybeSingle();

  if (dbMatch) {
    matchStatus = dbMatch.matchstatus;
    scheduleAt = dbMatch.scheduleat;
    hasExtraPool = dbMatch.hasextrapool;
  } else {
    const jsonMatch = getJsonMatchById(matchId);
    if (!jsonMatch) {
      return { success: false, error: "Match not found." };
    }
    matchStatus = jsonMatch.matchStatus;
    scheduleAt = jsonMatch.scheduleAt;
  }

  if (!hasExtraPool) {
    return { success: false, error: "This match is not a Match of the Day." };
  }

  if (matchStatus !== "PENDING") {
    return { success: false, error: "This match is no longer open for predictions." };
  }

  if (!scheduleAt) {
    return { success: false, error: "Match schedule is not available." };
  }

  const kickoff = new Date(scheduleAt);
  const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);

  if (new Date() >= deadline) {
    return { success: false, error: "The prediction deadline for this match has passed." };
  }

  // Validate pool is open
  const { data: pool } = await supabase
    .from("matchpools")
    .select("entryfeebs, poolstatus")
    .eq("matchid", matchId)
    .maybeSingle();

  if (!pool || pool.poolstatus !== "OPEN") {
    return { success: false, error: "The Daily Pool is not currently open for this match." };
  }

  // Validate payment method
  if (paymentMethod === "receipt" && !receiptUrl) {
    return { success: false, error: "A receipt image is required for receipt-based entries." };
  }

  if (paymentMethod === "credit") {
    const { data: profile } = await supabase
      .from("users")
      .select("availablepoolcredits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.availablepoolcredits < 1) {
      return { success: false, error: "You do not have any available pool credits." };
    }
  }

  // Check for duplicate score combination
  const { data: existingBets } = await supabase
    .from("matchbets")
    .select("id, betgoalteam1, betgoalteam2")
    .eq("userid", user.id)
    .eq("matchid", matchId);

  if (existingBets) {
    const duplicate = existingBets.find(
      (b) =>
        b.betgoalteam1 === betGoalTeam1 &&
        b.betgoalteam2 === betGoalTeam2,
    );
    if (duplicate) {
      return {
        success: false,
        error: "You already have a prediction with this exact score for this match.",
      };
    }
  }

  // Consume credit if applicable
  if (paymentMethod === "credit") {
    const { error: creditError } = await supabase.rpc("consume_pool_credit", {
      p_userid: user.id,
    });

    if (creditError) {
      console.error("Failed to consume credit:", creditError);
      return { success: false, error: "Failed to consume credit. Please try again." };
    }
  }

  // Create matchbet + extrapoolentries
  const now = new Date().toISOString();

  const { data: bet, error: betError } = await supabase
    .from("matchbets")
    .insert({
      userid: user.id,
      matchid: matchId,
      betgoalteam1: betGoalTeam1,
      betgoalteam2: betGoalTeam2,
      haspaidextrapool: true,
      createdat: now,
      updatedat: now,
    })
    .select("id")
    .single();

  if (betError || !bet) {
    console.error("Failed to create extra prediction:", betError);
    if (paymentMethod === "credit") {
      await supabase.rpc("refund_pool_credit", { p_userid: user.id });
    }
    return { success: false, error: "Failed to create prediction. Please try again." };
  }

  const { error: entryError } = await supabase
    .from("extrapoolentries")
    .insert({
      betid: bet.id,
      amountbs: pool.entryfeebs,
      receipturl: paymentMethod === "receipt" ? receiptUrl : null,
      paymentvalidated: false,
      createdat: now,
    });

  if (entryError) {
    console.error("Failed to create pool entry:", entryError);
    await supabase.from("matchbets").delete().eq("id", bet.id);
    if (paymentMethod === "credit") {
      await supabase.rpc("refund_pool_credit", { p_userid: user.id });
    }
    return { success: false, error: "Failed to create pool entry. Please try again." };
  }

  revalidatePath("/portal");
  return { success: true, betId: bet.id };
}

/**
 * Edits an extra prediction's score and/or receipt.
 *
 * Business rules (phase-4-plan.md Entry Editing Rules):
 *   - Only editable when deadline has NOT passed.
 *   - Only editable when paymentvalidated = false.
 *   - Editable: predicted score, receipt image (receipt-based only).
 *   - Not editable: payment method (locked at creation).
 */
export async function editExtraPrediction(
  betId: number,
  betGoalTeam1: number,
  betGoalTeam2: number,
  receiptUrl?: string,
): Promise<ExtraPredictionResult> {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // Validate goal range
  if (
    !Number.isInteger(betGoalTeam1) ||
    !Number.isInteger(betGoalTeam2) ||
    betGoalTeam1 < 0 ||
    betGoalTeam1 > 30 ||
    betGoalTeam2 < 0 ||
    betGoalTeam2 > 30
  ) {
    return { success: false, error: "Goals must be a whole number between 0 and 30." };
  }

  // Fetch bet + entry
  const { data: bet } = await supabase
    .from("matchbets")
    .select("id, userid, matchid, betgoalteam1, betgoalteam2, haspaidextrapool")
    .eq("id", betId)
    .single();

  if (!bet) {
    return { success: false, error: "Prediction not found." };
  }

  if (bet.userid !== user.id) {
    return { success: false, error: "You can only edit your own predictions." };
  }

  if (!bet.haspaidextrapool) {
    return { success: false, error: "This is not a Daily Pool entry." };
  }

  const { data: entry } = await supabase
    .from("extrapoolentries")
    .select("id, paymentvalidated, receipturl")
    .eq("betid", betId)
    .single();

  if (!entry) {
    return { success: false, error: "Pool entry not found." };
  }

  if (entry.paymentvalidated) {
    return { success: false, error: "Validated entries cannot be edited." };
  }

  // Deadline check
  const { data: match } = await supabase
    .from("matchresults")
    .select("matchstatus, scheduleat")
    .eq("matchid", bet.matchid)
    .maybeSingle();

  let matchStatus = match?.matchstatus ?? "PENDING";
  let scheduleAt: string | null = match?.scheduleat ?? null;

  if (!match) {
    const jsonMatch = getJsonMatchById(bet.matchid);
    if (jsonMatch) {
      matchStatus = jsonMatch.matchStatus;
      scheduleAt = jsonMatch.scheduleAt;
    }
  }

  if (matchStatus !== "PENDING") {
    return { success: false, error: "This match is no longer open for predictions." };
  }

  if (scheduleAt) {
    const kickoff = new Date(scheduleAt);
    const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
    if (new Date() >= deadline) {
      return { success: false, error: "The prediction deadline for this match has passed." };
    }
  }

  // Check for duplicate score (excluding self)
  const { data: siblings } = await supabase
    .from("matchbets")
    .select("id, betgoalteam1, betgoalteam2")
    .eq("userid", user.id)
    .eq("matchid", bet.matchid)
    .neq("id", betId);

  if (siblings) {
    const duplicate = siblings.find(
      (b) =>
        b.betgoalteam1 === betGoalTeam1 &&
        b.betgoalteam2 === betGoalTeam2,
    );
    if (duplicate) {
      return {
        success: false,
        error: "You already have another prediction with this exact score.",
      };
    }
  }

  // Update bet score
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("matchbets")
    .update({
      betgoalteam1: betGoalTeam1,
      betgoalteam2: betGoalTeam2,
      updatedat: now,
    })
    .eq("id", betId);

  if (updateError) {
    console.error("Failed to update extra prediction:", updateError);
    return { success: false, error: "Failed to update prediction. Please try again." };
  }

  // Update receipt if receipt-based entry
  const isReceiptBased = entry.receipturl !== null;
  if (isReceiptBased && receiptUrl !== undefined) {
    const { error: receiptError } = await supabase
      .from("extrapoolentries")
      .update({ receipturl: receiptUrl })
      .eq("betid", betId);

    if (receiptError) {
      console.error("Failed to update receipt:", receiptError);
      return { success: false, error: "Failed to update receipt. Please try again." };
    }
  }

  revalidatePath("/portal");
  return { success: true, betId };
}

/**
 * Deletes an extra prediction.
 *
 * Business rules (phase-4-plan.md Entry Deletion / Credit Refund):
 *   - Only deletable when deadline has NOT passed.
 *   - Only deletable when paymentvalidated = false.
 *   - Credit-based: 1 credit is refunded to users.availablepoolcredits.
 *   - Receipt-based: associated receipt file should be removed (storage
 *     cleanup is handled by the caller or M5 storage helpers).
 */
export async function deleteExtraPrediction(
  betId: number,
): Promise<ExtraPredictionResult> {
  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in." };
  }

  // Fetch bet + entry
  const { data: bet } = await supabase
    .from("matchbets")
    .select("id, userid, matchid, haspaidextrapool")
    .eq("id", betId)
    .single();

  if (!bet) {
    return { success: false, error: "Prediction not found." };
  }

  if (bet.userid !== user.id) {
    return { success: false, error: "You can only delete your own predictions." };
  }

  if (!bet.haspaidextrapool) {
    return { success: false, error: "This is not a Daily Pool entry." };
  }

  const { data: entry } = await supabase
    .from("extrapoolentries")
    .select("id, paymentvalidated, receipturl")
    .eq("betid", betId)
    .single();

  if (!entry) {
    return { success: false, error: "Pool entry not found." };
  }

  if (entry.paymentvalidated) {
    return { success: false, error: "Validated entries cannot be deleted." };
  }

  // Deadline check
  const { data: match } = await supabase
    .from("matchresults")
    .select("matchstatus, scheduleat")
    .eq("matchid", bet.matchid)
    .maybeSingle();

  let matchStatus = match?.matchstatus ?? "PENDING";
  let scheduleAt: string | null = match?.scheduleat ?? null;

  if (!match) {
    const jsonMatch = getJsonMatchById(bet.matchid);
    if (jsonMatch) {
      matchStatus = jsonMatch.matchStatus;
      scheduleAt = jsonMatch.scheduleAt;
    }
  }

  if (matchStatus !== "PENDING") {
    return { success: false, error: "This match is no longer open for predictions." };
  }

  if (scheduleAt) {
    const kickoff = new Date(scheduleAt);
    const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
    if (new Date() >= deadline) {
      return { success: false, error: "The prediction deadline for this match has passed." };
    }
  }

  // Refund credit if credit-based entry
  const isCreditBased = entry.receipturl === null;

  if (isCreditBased) {
    const { error: refundError } = await supabase.rpc("refund_pool_credit", {
      p_userid: user.id,
    });

    if (refundError) {
      console.error("Failed to refund credit:", refundError);
      return { success: false, error: "Failed to refund credit. Please try again." };
    }
  }

  // Delete entry first (FK constraint), then bet
  const { error: deleteEntryError } = await supabase
    .from("extrapoolentries")
    .delete()
    .eq("betid", betId);

  if (deleteEntryError) {
    console.error("Failed to delete pool entry:", deleteEntryError);
    if (isCreditBased) {
      await supabase.rpc("consume_pool_credit", { p_userid: user.id });
    }
    return { success: false, error: "Failed to delete pool entry. Please try again." };
  }

  const { error: deleteBetError } = await supabase
    .from("matchbets")
    .delete()
    .eq("id", betId);

  if (deleteBetError) {
    console.error("Failed to delete bet:", deleteBetError);
    return { success: false, error: "Failed to delete prediction. Please try again." };
  }

  revalidatePath("/portal");
  return { success: true };
}
