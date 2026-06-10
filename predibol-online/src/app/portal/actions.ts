"use server";

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

  // Fetch match to validate it exists, is pending, and deadline hasn't passed
  const { data: match, error: matchError } = await supabase
    .from("matchresults")
    .select("matchid, matchstatus, scheduleat")
    .eq("matchid", matchId)
    .single();

  if (matchError || !match) {
    return { success: false, error: "Match not found." };
  }

  if (match.matchstatus !== "PENDING") {
    return { success: false, error: "This match is no longer open for predictions." };
  }

  if (!match.scheduleat) {
    return { success: false, error: "Match schedule is not available." };
  }

  // Enforce deadline: 10 minutes before kickoff
  const kickoff = new Date(match.scheduleat);
  const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);

  if (new Date() >= deadline) {
    return { success: false, error: "The prediction deadline for this match has passed." };
  }

  // Upsert: check if a prediction already exists for this user + match
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
      return { success: false, error: "Failed to save prediction. Please try again." };
    }
  }

  revalidatePath("/portal");
  return { success: true };
}
