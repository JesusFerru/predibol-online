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
 *
 * Constructs a UTC timestamp directly to avoid string-parsing
 * quirks across JavaScript engines.
 */
export function parseKickoff(date: string, time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) {
    return new Date(date).toISOString();
  }

  const [, hours, minutes, offset] = match;
  const hourNum = Number.parseInt(hours, 10);
  const minNum = Number.parseInt(minutes, 10);
  const offsetNum = Number.parseInt(offset, 10);

  // Convert kickoff time to UTC:
  //   UTC = local - offset
  //   e.g. 15:00 UTC-4 → 15 - (-4) = 19:00 UTC
  const [y, m, d] = date.split("-").map(Number);
  const utcDate = new Date(
    Date.UTC(y, m - 1, d, hourNum - offsetNum, minNum, 0),
  );

  return utcDate.toISOString();
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
