# Database Architecture & Business Logic
The Supabase database was created with PostgreSQL default naming behavior, so all table and column names are lowercase.

The official Supabase schema definition is located at `/database/schema.sql`. Claude must adhere to the following data relations, structural constraints, and logic implementations:

---

## 1. Core Tables & Identity Mapping

### authorized_users
* **Whitelist Source of Truth:** This table is the authoritative source for platform access authorization. It is maintained manually through Supabase by administrators.
* **Columns:** `email` (PK), `name`, `alias` (unique), `is_admin`, `active`, `created_at`.
* **Access Control:** Only users whose email exists in this table with `active = TRUE` are granted access to the platform. The `is_admin` flag propagates to `Users.isAdmin` during automatic provisioning.

### Users
* **Authentication:** Primary Key `id` maps directly to Supabase Auth (`auth.users.id`).
* **Provisioning:** Users records are automatically created from `authorized_users` after successful Google OAuth login. The `handle_new_user()` trigger also provisions Users at sign-up time only when the email is whitelisted and active.
* **Access Control:** `hasPaidEntry` grants general access to the platform dashboard. `isAdmin` flags accounts with administrative rights (e.g., inputting official scores).
* **Credit System:** `availablePoolCredits` increments when an extra pool is canceled due to low player count, serving as a token balance for future matches.

### MatchResults
* **Match Life Cycle:** `matchStatus` enforces a strict strict state machine: `PENDING`, `FINISHED`, or `CANCELED`.
* **Dynamic Features:** `hasExtraPool` dictates whether a match has an activated dynamic cash pool. `scheduleAt` stores the exact kickoff time in `TIMESTAMPTZ` (Bolivia UTC-4) used for temporal locking mechanisms.

---

## 2. Predictions & Betting Logic

### MatchBets
* **Multi-Bet Feature:** Multiple rows per user for the same match are allowed. The database enforces uniqueness strictly across the combination of `(userId, matchId, betGoalTeam1, betGoalTeam2)` to prevent identical duplicated records.
* **Knockout Stage Fallback:** `penaltyWinnerTeam` (nullable, values `1` or `2`) handles tie-breaker selections when elimination matches end in draws after regulation time.
* **Cash Pool Link:** `hasPaidExtraPool` flags if this specific bet row is participating in the dynamic monetary pool.

### ExtraPoolEntries
* **Transactional Link:** One-to-one relationship with `MatchBets` via `betId` (Enforced by `UNIQUE(betId)`). 
* **Validation:** Tracks real money inflows for custom match pools (`amountBs` and `receiptUrl`). Bets are only factored into cash distribution calculations once `paymentValidated` switches to `TRUE`.

### WinnersBets
* **Tournament Podium:** Strict one-to-one mapping with `Users` via `userId` as the Primary Key. Users are restricted to exactly one prediction array for the 1st, 2nd, and 3rd place of the tournament.

---

## 3. Financial Tracking & Analytics

### MatchPools
* **Pool States:** `poolStatus` tracks if a match pool is `OPEN`, `COMPLETED`, `CANCELED`, or `ROLLED_OVER`.
* **Low-Volume Fallback:** If a pool doesn't meet `minimumPlayers` (default: 3), it switches to `CANCELED`, and users are refunded by incrementing `Users.availablePoolCredits`.
* **Jackpot Rollovers:** `rolloverAmountBs` carries over unclaimed cash from previous games when nobody hits the exact score, injecting it into the new active pool.

### CashInflow
* **Administrative Audit:** Keeps an immutable financial record of base money transactions (e.g., initial flat entry fee of 50 Bs). `createdBy` maps the admin user who validated and created the row.

### DailyPayouts
* **Disbursement Control:** Tracks prize money distributed to match winners. `paymentStatus = TRUE` indicates a completed bank transfer, timestamped via `paidAt`.

### TournamentRanking
* **Performance Metric:** One-to-one relationship with `Users`. Stores cumulative points calculated downstream from user prediction accuracy. Updated continuously using specific cron triggers or backend functions.