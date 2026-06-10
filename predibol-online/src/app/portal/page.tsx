import { ProfileButton } from "@/components/profile/profile-button";
import {
  PredictionList,
  type MatchWithBet,
} from "@/components/predictions/prediction-list";
import { getEnrichedMatches } from "@/lib/data/matches";
import { createClient } from "@/lib/supabase/server";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user profile (for ProfileButton)
  const { data: profile } = await supabase
    .from("users")
    .select("name, alias, availablepoolcredits")
    .eq("id", user!.id)
    .single();

  const { data: ranking } = await supabase
    .from("tournamentranking")
    .select("points")
    .eq("userId", user!.id)
    .single();

  // Fetch all matches from JSON data (development data source)
  const enrichedMatches = getEnrichedMatches();

  // Fetch user's existing bets from Supabase
  const { data: bets } = await supabase
    .from("matchbets")
    .select("matchid, betgoalteam1, betgoalteam2")
    .eq("userid", user!.id);

  // Build a lookup map of matchId -> bet
  const betByMatch = new Map<
    string,
    { betgoalteam1: number; betgoalteam2: number }
  >();
  if (bets) {
    for (const bet of bets) {
      betByMatch.set(bet.matchid, {
        betgoalteam1: bet.betgoalteam1,
        betgoalteam2: bet.betgoalteam2,
      });
    }
  }

  // Compute lock status and build match objects
  const now = new Date();
  const matchList: MatchWithBet[] = enrichedMatches.map((m) => {
    const kickoff = new Date(m.scheduleAt);
    const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
    const isLocked = now >= deadline;

    return {
      matchId: m.matchId,
      team1: m.team1,
      team2: m.team2,
      team1Flag: m.team1Flag,
      team2Flag: m.team2Flag,
      team1Code: m.team1Code,
      team2Code: m.team2Code,
      scheduleAt: m.scheduleAt,
      matchStatus: m.matchStatus,
      group: m.group,
      round: m.round,
      ground: m.ground,
      existingBet: betByMatch.get(m.matchId) ?? null,
      isLocked,
    };
  });

  // Group matches by date
  const groupMap = new Map<string, MatchWithBet[]>();
  for (const m of matchList) {
    const dateKey = m.scheduleAt
      ? new Date(m.scheduleAt).toISOString().slice(0, 10)
      : "unknown";
    const existing = groupMap.get(dateKey);
    if (existing) {
      existing.push(m);
    } else {
      groupMap.set(dateKey, [m]);
    }
  }

  const dayGroups = Array.from(groupMap.entries()).map(
    ([dateKey, matches]) => {
      const dateLabel = matches[0]?.scheduleAt
        ? new Date(matches[0].scheduleAt).toLocaleDateString("es-BO", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "America/La_Paz",
          })
        : "Unknown";

      return { dateKey, dateLabel, matches };
    },
  );

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Your Predictions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your score predictions for each match. You can edit them until
            10 minutes before kickoff.
          </p>
        </div>

        {/* Match list */}
        <PredictionList dayGroups={dayGroups} />
      </div>

      {/* Floating profile button */}
      <ProfileButton
        userName={profile?.name ?? "Player"}
        userAlias={profile?.alias}
        userEmail={user!.email!}
        credits={profile?.availablepoolcredits ?? 0}
        points={ranking?.points ?? 0}
      />
    </div>
  );
}
