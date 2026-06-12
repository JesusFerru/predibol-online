# Automations

This document describes all external automations that interact with the platform.

The web application does not perform these processes directly.

All automations are executed through external scripts and update Supabase data.

---

# User Synchronization

## Source

Google Sheets

## Purpose

Maintain the participant whitelist.

## Process

- Read authorized participant records.
- Create missing users in the `Users` table.
- Update participant information if required.
- Mark inactive participants when applicable.

## Tables Affected

- Users

## Frequency

Every 1 hour.

---

# Match Import

## Source

Static JSON backup files.

Files:

- extra_info/wc26.json
- extra_info/teams-wc26.json

## Purpose

Populate tournament structure before the competition begins.

## Process

- Create teams.
- Create matches.
- Load schedules.
- Load tournament metadata.

## Tables Affected

- MatchResults

## Frequency

Manual execution.

Usually executed once before tournament start.

---

# Match Result Synchronization

## Source

Football data provider (API Football or equivalent).

## Purpose

Keep official match results updated.

## Process

- Update match status.
- Update final scores.
- Update kickoff changes if required.
- Mark matches as finished.

## Tables Affected

- MatchResults

## Frequency

Every 15 minutes.

---

# Tournament Ranking Calculation

## Purpose

Calculate tournament points and standings.

## Process

- Evaluate all completed matches.
- Calculate Exact Score points.
- Calculate Correct Outcome points.
- Calculate Podium Prediction bonuses.
- Apply ranking tie-breakers.
- Update standings.

## Tables Affected

- TournamentRanking

## Frequency

After completed matches.
At least once per day.

---

# Daily Pool Settlement

## Purpose

Calculate Match of the Day winners.

## Process

- Identify eligible pool entries.
- Determine winning predictions.
- Calculate prize distribution.
- Apply rollover rules.
- Generate payout records.

## Tables Affected

- MatchPools
- DailyPayouts

## Frequency

After Match of the Day finishes.

---

# Credit Management

## Purpose

Maintain participant credit balances.

## Process

- Convert cancelled pool entries into credits.
- Convert unclaimed winnings into credits.
- Apply manual credit adjustments if required.

## Tables Affected

- Users

## Frequency

After settlement processes.

---

# Statistics Generation

## Purpose

Generate data used by dashboards and public statistics.

## Process

- Calculate prediction accuracy.
- Calculate participation rates.
- Calculate daily pool participation.
- Calculate leaderboard trends.
- Generate tournament metrics.

## Tables Affected

Read-only analytics over:

- Users
- MatchBets
- TournamentRanking
- DailyPayouts

## Frequency

Daily.

---

# WhatsApp Notifications

## Purpose

Generate messages for the community group.

## Process

- Daily ranking summaries.
- Match of the Day announcements.
- Daily winners announcements.
- Tournament updates.

## Tables Affected

Read-only.

## Frequency

As required.