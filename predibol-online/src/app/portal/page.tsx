import { ProfileButton } from "@/components/profile/profile-button";
import {
  PredictionList,
  type MatchWithBet,
} from "@/components/predictions/prediction-list";
import { createClient } from "@/lib/supabase/server";

interface DayGroup {
  dateLabel: string;
  dateKey: string;
  matches: MatchWithBet[];
}

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

  // Fetch all matches
  const { data: matches } = await supabase
    .from("matchresults")
    .select("matchid, team1, team2, scheduleat, matchstatus")
    .order("scheduleat", { ascending: true });

  // Fetch user's existing bets
  const { data: bets } = await supabase
    .from("matchbets")
    .select("matchid, betgoalteam1, betgoalteam2")
    .eq("userid", user!.id);

  // Build a lookup map of matchId -> bet
  const betByMatch = new Map<string, { betgoalteam1: number; betgoalteam2: number }>();
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
  const matchList: MatchWithBet[] = (matches ?? []).map((match) => {
    let isLocked = false;
    if (match.scheduleat) {
      const kickoff = new Date(match.scheduleat);
      const deadline = new Date(kickoff.getTime() - 10 * 60 * 1000);
      isLocked = now >= deadline;
    }

    return {
      matchid: match.matchid,
      team1: match.team1,
      team2: match.team2,
      scheduleat: match.scheduleat,
      matchstatus: match.matchstatus,
      existingBet: betByMatch.get(match.matchid) ?? null,
      isLocked,
    };
  });

  // Group matches by date
  const groupMap = new Map<string, MatchWithBet[]>();
  for (const m of matchList) {
    const dateKey = m.scheduleat
      ? new Date(m.scheduleat).toISOString().slice(0, 10)
      : "unknown";
    const existing = groupMap.get(dateKey);
    if (existing) {
      existing.push(m);
    } else {
      groupMap.set(dateKey, [m]);
    }
  }

  const dayGroups: DayGroup[] = Array.from(groupMap.entries()).map(
    ([dateKey, matches]) => {
      const dateLabel = matches[0]?.scheduleat
        ? new Date(matches[0].scheduleat).toLocaleDateString("es-BO", {
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
