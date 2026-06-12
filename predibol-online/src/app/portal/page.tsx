import Link from "next/link";
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
    .eq("userid", user!.id)
    .single();

  // Compute user's ranking position by counting users with more points
  let rank: number | null = null;
  if (ranking?.points != null) {
    const { count: betterCount } = await supabase
      .from("tournamentranking")
      .select("*", { count: "exact", head: true })
      .gt("points", ranking.points);
    rank = (betterCount ?? 0) + 1;
  }

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

  // Extract Bolivia-date key from an ISO UTC timestamp.
  // en-CA locale reliably produces YYYY-MM-DD format.
  function boliviaDateKey(iso: string): string {
    return new Date(iso).toLocaleDateString("en-CA", {
      timeZone: "America/La_Paz",
    });
  }

  // Group matches by date (America/La_Paz timezone)
  const groupMap = new Map<string, MatchWithBet[]>();
  for (const m of matchList) {
    const dateKey = m.scheduleAt ? boliviaDateKey(m.scheduleAt) : "unknown";
    const existing = groupMap.get(dateKey);
    if (existing) {
      existing.push(m);
    } else {
      groupMap.set(dateKey, [m]);
    }
  }

  const dayGroups = Array.from(groupMap.entries())
    .map(([dateKey, matches]) => {
      const dateLabel = matches[0]?.scheduleAt
        ? new Date(matches[0].scheduleAt).toLocaleDateString("es-BO", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "America/La_Paz",
          })
        : "Unknown";

      return { dateKey, dateLabel, matches };
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

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
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1.5 rounded-full border border-crimson/30 bg-crimson/5 px-4 py-2 text-sm font-medium text-crimson transition-colors hover:bg-crimson/10"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Ranking
            </Link>
            <Link
              href="/portal/stats"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 3v18m-6-8v8m12-12v12"
                />
              </svg>
              My Stats
            </Link>
          </div>
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
        rank={rank}
      />
    </div>
  );
}
