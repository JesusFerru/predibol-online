"use server";

import { getJsonMatchById } from "@/lib/data/matches";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SavePredictionResult {
  success: boolean;
  error?: string;
}

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
