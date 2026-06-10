import wc26Data from "@/../extra_info/wc26.json";
import teamsData from "@/../extra_info/teams-wc26.json";

// ─── Types ──────────────────────────────────────────────

export interface TeamInfo {
  fifa_code: string;
  flag_icon: string;
  name: string;
  group: string;
  confed: string;
  continent: string;
}

export interface EnrichedMatch {
  matchId: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  team1Code: string;
  team2Code: string;
  scheduleAt: string; // ISO timestamp
  matchStatus: string;
  group: string;
  round: string;
  ground: string;
}

// ─── Team lookup ────────────────────────────────────────

const teamByName = new Map<string, TeamInfo>();
const teamByCode = new Map<string, TeamInfo>();

for (const team of teamsData.teamsList as TeamInfo[]) {
  teamByName.set(team.name, team);
  teamByCode.set(team.fifa_code, team);
}

export function getTeamByName(name: string): TeamInfo | null {
  return teamByName.get(name) ?? null;
}

export function getTeamByCode(code: string): TeamInfo | null {
  return teamByCode.get(code) ?? null;
}

// ─── Kickoff parsing ────────────────────────────────────

/**
 * Parses a match date ("2026-06-11") and time ("15:00 UTC-4")
 * into an ISO 8601 timestamp string.
 */
export function parseKickoff(date: string, time: string): string {
  // time format: "15:00 UTC-4" or "22:00 UTC-4"
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) {
    // Fallback: just use the date
    return new Date(date).toISOString();
  }

  const [, hours, minutes, offset] = match;
  const offsetNum = Number.parseInt(offset, 10);

  // Build: "2026-06-11T15:00:00-04:00"
  const isoStr = `${date}T${hours}:${minutes}:00${offsetNum >= 0 ? "+" : ""}${String(offsetNum).padStart(2, "0")}:00`;
  return new Date(isoStr).toISOString();
}

// ─── Match enrichment ───────────────────────────────────

export function getEnrichedMatches(): EnrichedMatch[] {
  const matches = wc26Data.matches as Array<{
    id: number;
    date: string;
    time: string;
    team1: string;
    team2: string;
    ground: string;
    group: string;
    round: string;
    status: string;
  }>;

  return matches.map((m) => {
    const t1Info = getTeamByName(m.team1);
    const t2Info = getTeamByName(m.team2);

    return {
      matchId: String(m.id),
      team1: m.team1,
      team2: m.team2,
      team1Flag: t1Info?.flag_icon ?? "",
      team2Flag: t2Info?.flag_icon ?? "",
      team1Code: t1Info?.fifa_code ?? m.team1.slice(0, 3).toUpperCase(),
      team2Code: t2Info?.fifa_code ?? m.team2.slice(0, 3).toUpperCase(),
      scheduleAt: parseKickoff(m.date, m.time),
      matchStatus: m.status === "SCHEDULED" ? "PENDING" : m.status,
      group: m.group ?? "",
      round: m.round,
      ground: m.ground,
    };
  });
}

/**
 * Looks up a single match by ID in the JSON data.
 * Used as fallback in the server action when the match
 * isn't in the database yet.
 */
export function getJsonMatchById(
  matchId: string,
): EnrichedMatch | null {
  const all = getEnrichedMatches();
  return all.find((m) => m.matchId === matchId) ?? null;
}
