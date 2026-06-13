/**
 * seed-matches.ts
 *
 * Idempotent seed script that populates the matchresults table
 * from extra_info/wc26.json.
 *
 * Usage:
 *   pnpm seed-matches
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (the anon key
 * cannot write to matchresults — the table has only SELECT RLS).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Types ──────────────────────────────────────────────

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
  matchid: string;
  team1: string;
  team2: string;
  goal1: number | null;
  goal2: number | null;
  matchstatus: "PENDING" | "FINISHED" | "CANCELED";
  hasextrapool: boolean;
  scheduleat: string;
}

// ─── Env ────────────────────────────────────────────────

const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY: string = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is not set in .env.local");
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local\n" +
      "   Add it to .env.local:\n" +
      "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n" +
      "   Find it in Supabase Dashboard → Project Settings → API → service_role key",
  );
  process.exit(1);
}

// ─── Kickoff parser ─────────────────────────────────────

function parseKickoff(date: string, time: string): string {
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) {
    return new Date(date).toISOString();
  }

  const [, hours, minutes, offset] = match;
  const hourNum = Number.parseInt(hours, 10);
  const minNum = Number.parseInt(minutes, 10);
  const offsetNum = Number.parseInt(offset, 10);

  const [y, m, d] = date.split("-").map(Number);
  const utcDate = new Date(
    Date.UTC(y, m - 1, d, hourNum - offsetNum, minNum, 0),
  );

  return utcDate.toISOString();
}

// ─── Status mapper ──────────────────────────────────────

function mapStatus(jsonStatus: string): MatchRow["matchstatus"] {
  switch (jsonStatus) {
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

// ─── Main ───────────────────────────────────────────────

async function main() {
  console.log("🔵 Loading match data from extra_info/wc26.json …");

  const jsonPath = resolve(__dirname, "..", "extra_info", "wc26.json");
  const raw = readFileSync(jsonPath, "utf-8");
  const data: Wc26Json = JSON.parse(raw);

  console.log(`   Found ${data.matches.length} matches in JSON.\n`);

  const rows: MatchRow[] = data.matches.map((m) => ({
    matchid: String(m.id),
    team1: m.team1,
    team2: m.team2,
    goal1: m.goalsTeam1 ?? null,
    goal2: m.goalsTeam2 ?? null,
    matchstatus: mapStatus(m.status),
    hasextrapool: false,
    scheduleat: parseKickoff(m.date, m.time),
  }));

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const BATCH_SIZE = 50;
  let processed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("matchresults")
      .upsert(batch, {
        onConflict: "matchid",
        ignoreDuplicates: false,
      });

    if (error) {
      errors.push(`Batch ${i / BATCH_SIZE + 1}: ${error.message}`);
      continue;
    }

    console.log(
      `   Batch ${String(i / BATCH_SIZE + 1).padStart(3, " ")} — ${batch.length} matches (${batch[0].matchid} … ${batch[batch.length - 1].matchid})`,
    );
    processed += batch.length;
  }

  console.log(`\n✅ Seed complete.`);
  console.log(`   Total matches processed: ${processed}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n⚠ Errors:");
    for (const e of errors) {
      console.log(`   - ${e}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
