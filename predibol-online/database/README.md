# Database Deployment Guide

This folder contains all SQL files that must be deployed to the Supabase PostgreSQL instance.

---

## Deployment Order

Execute the files in this order via the **Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

| # | File | Purpose | Required For |
|---|------|---------|--------------|
| 1 | `schema.sql` | Creates all tables, indexes, RLS policies, and the `handle_new_user()` auth trigger | **Everything** |
| 2 | `calculate-ranking.sql` | Creates `calculate_ranking()` function — computes points and upserts into `tournamentranking` | Ranking calculation (cron/manual) |
| 3 | `tiebreaker-counts.sql` | Creates `get_tiebreaker_counts()` function — returns tie-breaker stats for all paid users | **Ranking page** (`/ranking`) |

Files 2 and 3 depend on schema.sql being deployed first (they reference tables from it).

---

## Step-by-Step Instructions

### 1. Deploy schema.sql

1. Open **Supabase Dashboard** → your project → **SQL Editor**
2. Click **New Query**
3. Copy the entire content of `database/schema.sql`
4. Paste into the SQL Editor
5. Click **Run**

**What this creates:**
- 10 tables: `authorized_users`, `users`, `matchresults`, `matchbets`, `extrapoolentries`, `matchpools`, `winnersbets`, `cashinflow`, `dailypayouts`, `tournamentranking`
- 7 indexes on frequently-queried columns
- 18 RLS policies
- The `handle_new_user()` function and trigger (auto-creates `users` row on first login)

**Verification query:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output: 10 table names listed above.

### 2. Deploy calculate-ranking.sql

1. Open **Supabase SQL Editor** → **New Query**
2. Copy the entire content of `database/calculate-ranking.sql`
3. Paste and click **Run**

**What this creates:**
- `calculate_ranking()` — a `SECURITY DEFINER` function that:
  - Loops over all finished matches with known scores
  - Calculates exact-score (+3) and correct-outcome (+1) points
  - Applies multi-bet outcome suppression
  - Resolves podium from Final (matchid `104`) and Third-Place (matchid `103`)
  - Awards podium points (champion +20, runner-up +10, third +5)
  - Upserts results into `tournamentranking`

**SECURITY DEFINER** means the function runs with the privileges of the user who created it, bypassing RLS. This is intentional — the function needs to read ALL users' bets and write to `tournamentranking`.

**Verification query:**

```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'calculate_ranking';
```

Expected: `prosecdef = true`

**Usage (manual or scheduled):**

```sql
SELECT * FROM calculate_ranking();
```

### 3. Deploy tiebreaker-counts.sql

1. Open **Supabase SQL Editor** → **New Query**
2. Copy the entire content of `database/tiebreaker-counts.sql`
3. Paste and click **Run**

**What this creates:**
- `get_tiebreaker_counts()` — a `SECURITY DEFINER` function that:
  - Counts exact-score hits per user across all finished matches
  - Counts correct-outcome hits per user (with multi-bet suppression)
  - Returns `correct_penalty_count` (currently always 0 — see note below)
  - Returns alias from the `users` table
  - Only includes users with `haspaidentry = TRUE`

This function is called by the Next.js ranking page via:
```typescript
const { data } = await supabase.rpc("get_tiebreaker_counts");
```

**Without this function deployed, the `/ranking` page will show "Standings will update as matches are played."**

**Verification query:**

```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'get_tiebreaker_counts';
```

Expected: `prosecdef = true`

**Usage test:**

```sql
SELECT * FROM get_tiebreaker_counts();
```

---

## Important Notes

### Penalty winner tie-breaker (future)

The `get_tiebreaker_counts()` function has the penalty-winner counting logic **commented out**. It will always return `correct_penalty_count = 0` until:

1. The `matchresults` table gains an `advancing_team` column (values `1` or `2`) indicating which team actually advanced after a drawn knockout match
2. The commented-out loop in `tiebreaker-counts.sql` is uncommented and adapted

This is documented in the SQL file body. No action is needed until the knockout stage begins (matchids 73–104).

### Column naming

PostgreSQL folds unquoted identifiers to lowercase. All tables and columns in this schema use unquoted CamelCase in their CREATE TABLE definitions, which PostgreSQL stores as lowercase. Example:

| CREATE TABLE writes | PostgreSQL stores | Supabase JSON key |
|---|---|---|
| `hasPaidEntry` | `haspaidentry` | `haspaidentry` |
| `matchId` | `matchid` | `matchid` |
| `createdAt` | `createdat` | `createdat` |

All SQL functions, TypeScript types, and Supabase queries in this project use the **lowercase form**. Always use lowercase when writing new queries.

### RLS

All tables have Row Level Security enabled. The `calculate_ranking()` and `get_tiebreaker_counts()` functions use `SECURITY DEFINER` to bypass RLS because they need to read data across all users.

The web app (Next.js) calls `calculate-ranking.ts` as an **external script** with the `SUPABASE_SERVICE_ROLE_KEY` (which also bypasses RLS). The SQL function is an alternative that can be scheduled via `pg_cron` inside Supabase.

### Scheduling ranking calculation

Recommended schedule (Bolivia time, UTC-4):

```sql
SELECT cron.schedule(
  'calculate-ranking',
  '0 17,21,0 * * *',
  'SELECT calculate_ranking();'
);
```

This runs at 17:00, 21:00, and midnight Bolivia time — after matches typically finish.
