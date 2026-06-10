/**
 * seed-matches.ts
 *
 * Idempotent seed script that populates the matchresults table
 * from extra_info/wc26.json.
 *
 * Usage:
 *   pnpm seed-matches
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface JsonMatch {
  id: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  goalsTeam1: number | null;
  goalsTeam2: number | null;
  status: string;
  ground: string;
  group: string;
  round: string;
}

interface Wc26Json {
  matches: JsonMatch[];
}

interface MatchRow {
  matchid: number;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchstatus: "PENDING" | "FINISHED" | "CANCELED";
  hasextrapool: boolean;
  scheduleat: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
}

if (!SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
}

function parseKickoff(date: string, time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);

  if (!match) {
    throw new Error(
      `Invalid kickoff format "${time}". Expected format: HH:mm UTC±X`,
    );
  }

  const [, hours, minutes, offset] = match;

  const [year, month, day] = date.split("-").map(Number);

  const utcDate = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      Number(hours) - Number(offset),
      Number(minutes),
      0,
      0,
    ),
  );

  return utcDate.toISOString();
}

function mapStatus(status: string): MatchRow["matchstatus"] {
  switch (status) {
    case "SCHEDULED":
      return "PENDING";

    case "FINISHED":
      return "FINISHED";

    case "CANCELED":
      return "CANCELED";

    default:
      return "PENDING";
  }
}

async function main() {
  console.log("Loading wc26.json...");

  const jsonPath = resolve(
    process.cwd(),
    "extra_info",
    "wc26.json",
  );

  const raw = readFileSync(jsonPath, "utf8");

  const data: Wc26Json = JSON.parse(raw);

  console.log(`Found ${data.matches.length} matches`);

  const rows: MatchRow[] = data.matches.map((match) => ({
    matchid: match.id,
    team1: match.team1,
    team2: match.team2,
    goal1: match.goalsTeam1,
    goal2: match.goalsTeam2,
    matchstatus: mapStatus(match.status),
    hasextrapool: false,
    scheduleat: parseKickoff(match.date, match.time),
  }));

  const supabase = createClient(
    SUPABASE_URL,
    SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    console.log(rows[0]);
    const { error } = await supabase
      .from("matchresults")
      .upsert(batch, {
        onConflict: "matchid",
      });

    if (error) {
      throw error;
    }

    console.log(
      `Processed batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} matches)`,
    );
  }

  console.log("Match sync completed successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed");
    console.error(error);
    process.exit(1);
  });