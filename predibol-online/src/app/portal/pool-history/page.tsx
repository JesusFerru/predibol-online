import { createClient } from "@/lib/supabase/server";
import { getJsonMatchById } from "@/lib/data/matches";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────

interface PoolHistoryEntry {
  betId: number;
  matchId: string;
  team1: string;
  team2: string;
  team1Flag: string;
  team2Flag: string;
  betGoalTeam1: number;
  betGoalTeam2: number;
  paymentMethod: "credit" | "receipt";
  receiptUrl: string | null;
  paymentValidated: boolean;
  poolStatus: string | null;
  matchDate: string | null;
  createdAt: string;
}

// ─── Page ───────────────────────────────────────────────

export default async function PoolHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout redirects
  }

  // Fetch user profile for credits
  const { data: profile } = await supabase
    .from("users")
    .select("availablepoolcredits")
    .eq("id", user.id)
    .single();

  const availableCredits: number = profile?.availablepoolcredits ?? 0;

  // Fetch all extra bets for this user
  const { data: extraBets } = await supabase
    .from("matchbets")
    .select("id, matchid, betgoalteam1, betgoalteam2, haspaidextrapool, createdat")
    .eq("userid", user.id)
    .eq("haspaidextrapool", true)
    .order("createdat", { ascending: false });

  if (!extraBets || extraBets.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Daily Pool History
        </h1>
        <p className="mb-8 text-sm text-gray-500">
          Your Match of the Day extra predictions and pool participation.
        </p>

        {/* Summary */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 text-center">
          <div className="mb-3 text-5xl">🎫</div>
          <h2 className="text-lg font-semibold text-gray-700">
            No pool entries yet
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            When you enter a Daily Pool, your predictions will appear here.
          </p>
          <div className="mt-4">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 rounded-full bg-crimson px-4 py-2 text-sm font-medium text-white hover:bg-crimson/90"
            >
              ← Back to Predictions
            </Link>
          </div>
        </div>

        {/* Credit balance */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">Available Pool Credits</p>
          <p className="text-2xl font-bold text-crimson">{availableCredits}</p>
        </div>
      </div>
    );
  }

  // Fetch extrapoolentries for all extra bets
  const betIds = extraBets.map((b) => b.id);
  const entryByBetId = new Map<
    number,
    { paymentvalidated: boolean; receipturl: string | null }
  >();
  const { data: entries } = await supabase
    .from("extrapoolentries")
    .select("betid, paymentvalidated, receipturl")
    .in("betid", betIds);
  if (entries) {
    for (const e of entries) {
      entryByBetId.set(e.betid, {
        paymentvalidated: e.paymentvalidated,
        receipturl: e.receipturl,
      });
    }
  }

  // Fetch match info (DB first, JSON fallback)
  const uniqueMatchIds = [...new Set(extraBets.map((b) => b.matchid))];
  const { data: dbMatches } = await supabase
    .from("matchresults")
    .select("matchid, team1, team2, scheduleat")
    .in("matchid", uniqueMatchIds);
  const dbMatchMap = new Map<string, { team1: string; team2: string; scheduleat: string | null }>();
  if (dbMatches) {
    for (const m of dbMatches) {
      dbMatchMap.set(m.matchid, m);
    }
  }

  // Fetch pool statuses
  const { data: pools } = await supabase
    .from("matchpools")
    .select("matchid, poolstatus")
    .in("matchid", uniqueMatchIds);
  const poolStatusMap = new Map<string, string>();
  if (pools) {
    for (const p of pools) {
      poolStatusMap.set(p.matchid, p.poolstatus);
    }
  }

  // Build enriched entries
  const history: PoolHistoryEntry[] = extraBets.map((bet) => {
    const dbMatch = dbMatchMap.get(bet.matchid);
    const jsonMatch = getJsonMatchById(bet.matchid);
    const entry = entryByBetId.get(bet.id);

    return {
      betId: bet.id,
      matchId: bet.matchid,
      team1: dbMatch?.team1 ?? jsonMatch?.team1 ?? "TBD",
      team2: dbMatch?.team2 ?? jsonMatch?.team2 ?? "TBD",
      team1Flag: jsonMatch?.team1Flag ?? "",
      team2Flag: jsonMatch?.team2Flag ?? "",
      betGoalTeam1: bet.betgoalteam1,
      betGoalTeam2: bet.betgoalteam2,
      paymentMethod: entry?.receipturl ? "receipt" : "credit",
      receiptUrl: entry?.receipturl ?? null,
      paymentValidated: entry?.paymentvalidated ?? false,
      poolStatus: poolStatusMap.get(bet.matchid) ?? null,
      matchDate: dbMatch?.scheduleat ?? jsonMatch?.scheduleAt ?? null,
      createdAt: bet.createdat,
    };
  });

  // Compute stats
  const totalEntries = history.length;
  const creditEntries = history.filter((h) => h.paymentMethod === "credit").length;
  const receiptEntries = history.filter((h) => h.paymentMethod === "receipt").length;
  const validatedEntries = history.filter((h) => h.paymentValidated).length;

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-BO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "America/La_Paz",
    });
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("es-BO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/La_Paz",
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Daily Pool History
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Your Match of the Day extra predictions and pool participation.
          </p>
        </div>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Back
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{totalEntries}</p>
          <p className="text-[10px] text-gray-500">Total Entries</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-crimson">{availableCredits}</p>
          <p className="text-[10px] text-gray-500">Credits Available</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{creditEntries}</p>
          <p className="text-[10px] text-gray-500">Credits Used</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-gray-900">{receiptEntries}</p>
          <p className="text-[10px] text-gray-500">Receipt Entries</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-3 text-center">
          <p className="text-lg font-bold text-green-700">{validatedEntries}</p>
          <p className="text-[10px] text-gray-500">Validated</p>
        </div>
      </div>

      {/* Entries table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Table header */}
        <div className="hidden border-b border-gray-100 bg-gray-50/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-6 sm:gap-2">
          <span>Match</span>
          <span>Date</span>
          <span>Prediction</span>
          <span>Method</span>
          <span>Status</span>
          <span className="text-right">Details</span>
        </div>

        {/* Table body */}
        {history.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No Daily Pool entries yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((entry) => (
              <li
                key={entry.betId}
                className="px-4 py-3 sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center"
              >
                {/* Match */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <span className="truncate">{entry.team1}</span>
                  <span className="text-[10px] text-gray-400">vs</span>
                  <span className="truncate">{entry.team2}</span>
                </div>

                {/* Date */}
                <div className="text-xs text-gray-500">
                  <span className="sm:hidden text-[10px] text-gray-400">Date: </span>
                  {formatDate(entry.matchDate)}
                  <span className="ml-1 text-[10px] text-gray-400">
                    {formatTime(entry.matchDate)}
                  </span>
                </div>

                {/* Prediction */}
                <div className="font-mono text-sm font-bold text-gray-800">
                  <span className="sm:hidden text-[10px] text-gray-400">Score: </span>
                  {entry.betGoalTeam1} – {entry.betGoalTeam2}
                </div>

                {/* Method */}
                <div>
                  {entry.paymentMethod === "credit" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      🎫 Credit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                      🧾 Receipt
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.paymentValidated
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {entry.paymentValidated ? "Validated" : "Pending"}
                  </span>
                  {entry.poolStatus === "CANCELLED" && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      Pool Cancelled
                    </span>
                  )}
                  {entry.poolStatus === "COMPLETED" && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                      Settled
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="text-right">
                  {entry.receiptUrl ? (
                    <a
                      href={entry.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium text-crimson underline-offset-2 hover:underline"
                    >
                      View Receipt ↗
                    </a>
                  ) : (
                    <span className="text-[10px] text-gray-400">—</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mobile note */}
      <p className="mt-4 text-center text-[11px] text-gray-400 sm:hidden">
        Scroll horizontally to see all details.
      </p>
    </div>
  );
}
