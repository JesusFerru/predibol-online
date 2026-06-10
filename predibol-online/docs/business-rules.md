# Predibol - World Cup 2026 Business Rules

This document defines the business logic that drives validations, calculations, scoring, rankings, and daily pools.

---

# Authentication & Access

## Whitelist Access

The platform is private.

Only users existing in the `Users` table may access prediction functionality.

Authentication is performed exclusively through Google OAuth.

## Entry Validation

A participant may only access prediction features when:

```text
Users.hasPaidEntry = TRUE
```

Otherwise the user must be redirected to a payment pending screen.

---

# Match Predictions

## Prediction Window

Users may submit or edit predictions until:

```text
10 minutes before match kickoff
```

After the deadline:

* Predictions become read-only.
* No modifications are allowed.

Timezone:

```text
America/La_Paz (UTC-4)
```

---

## Standard Match Scoring

For each match:

### Exact Score

Award:

```text
+3 points
```

Condition:

Predicted score matches the official final score exactly.

### Correct Outcome

Award:

```text
+1 point
```

Condition:

Predicted winner or draw matches the official outcome.

### Incorrect Prediction

Award:

```text
0 points
```

---

## Penalty Winner Prediction

Only available for knockout matches.

Users may optionally select:

* Team 1 advances
* Team 2 advances

This prediction:

* Never grants points.
* Is only used for ranking tie-breakers.

---

# Tournament Podium Prediction

Each user may submit one podium prediction.

Required fields:

* Champion
* Runner-up
* Third Place

Restrictions:

* A country cannot be selected more than once.

Deadline:

```text
June 27, 2026
```

Scoring:

Champion:
+20 points

Runner-up:
+10 points

Third Place:
+5 points

---

# Tournament Ranking

Ranking is determined by:

```text
Total Points DESC
```

---

## Ranking Tie-Breakers

Applied in order:

1. Exact score count.
2. Correct outcome count.
3. Correct penalty winner count.

If all criteria remain tied:

* Prize positions are merged.
* Associated rewards are distributed equally.

---

# Match of the Day

At most one match per day may be designated as:

```text
Match of the Day
```

Some days may not have one.

Only Match of the Day can generate Daily Pool entries.

---

# Daily Pool Entries

Users may submit additional predictions for the Match of the Day.

Each additional prediction:

* Requires payment.
* Requires proof of payment.
* Participates in the Daily Pool.

Restrictions:

* Duplicate scores are not allowed for the same user and match.
* Multiple predictions are allowed.

---

## Multi-Prediction Rule

If a user submits multiple predictions for the same Match of the Day:

* Outcome points (+1) cannot be awarded.
* Only Exact Score points (+3) remain eligible.

---

# Daily Pool Match Result

Daily Pool calculations use:

* Regulation time
* Stoppage time
* Extra time (if applicable)

Penalty shootouts are ignored.

Example:

```text
Final after extra time: 2-2
Penalties: 5-4

Official Daily Pool result = 2-2
```

---

# Daily Pool Minimum Players

Minimum participants:

```text
3 players
```

If the minimum is not reached:

* Pool is cancelled.
* Participants receive credits.

Credit conversion:

```text
1 paid entry = 1 credit
```

---

# Daily Pool Distribution

Standard distribution:

```text
90% Winners
10% Platform Maintenance
```

---

## No Winners

If nobody predicts the exact score:

```text
10% Maintenance
90% Rollover
```

The rollover amount is transferred to the next Daily Pool.

---

## Final Match Exception

For the final Match of the Day:

```text
5% Maintenance
95% Tournament Pool
```

If no winner exists.

---

# Credits

Credits may be generated from:

* Cancelled Daily Pools.
* Unclaimed Daily Pool rewards.
* Manual administrative adjustments.

Usage:

```text
1 Credit = 1 Daily Pool Entry
```

---

# Official Results Source

All scoring calculations must use official match results.

The platform assumes imported match results are the source of truth.

All rankings, points, and pool calculations must be derived from those results.
