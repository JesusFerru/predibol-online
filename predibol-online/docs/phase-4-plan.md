# Phase 4 — Match of the Day

## Objective

Implement the complete Match of the Day experience.

This phase includes:

- Match of the Day visual highlighting
- Additional prediction creation
- Receipt uploads
- Credit-based entries
- Daily Pool participation
- Pool History
- Storage integration

This phase does NOT include:

- Payment validation
- Pool settlement
- Ranking calculation
- Credit generation
- Administrative workflows

Those operations are executed through external scripts and manual administration processes.

---

# Milestones

## M1 — Match of the Day Visual Highlighting

Requirements:

- Highlight matches where:

```text
hasextrapool = true
```

Visual requirements:

- Gold border
- "Match of the Day" badge
- Clearly distinguish from normal matches

No business logic changes.

---

## M2 — Extra Prediction Server Actions

Implement:

- Create extra prediction
- Edit extra prediction
- Delete extra prediction

Validation rules:

- Match must be Match of the Day
- Match must still be open
- Deadline rules apply
- Duplicate score combinations are not allowed for the same user and match

---

## M3 — Daily Pool User Interface

Inside the Match of the Day card:

Display:

- Existing extra predictions
- Validation status
- Credits used
- Receipt information

Allow:

- Create extra prediction
- Edit pending prediction
- Delete pending prediction

Support:

- Receipt upload
- Credit usage

---

## M4 — Daily Pool History

Create:

```text
/portal/pool-history
```

Display:

- All user extra predictions
- Match information
- Validation status
- Credits used
- Credits earned
- Receipt status

Pool History should also be accessible from:

- Profile drawer
- Portal navigation

---

## M5 — Storage Setup & Documentation

Implement:

- Supabase Storage integration
- Receipt uploads
- Receipt replacement
- Receipt deletion cleanup

Update:

- Documentation
- Database notes
- Storage documentation

---

# Match of the Day Rules

At most one Match of the Day may exist per calendar day.

The application may assume this rule is enforced by administrative processes and external scripts.

Only Match of the Day matches can generate Daily Pool entries.

---

# Daily Pool Entry Rules

Users may submit multiple additional predictions.

Restrictions:

- Duplicate score combinations are not allowed for the same user and match.
- Multiple predictions are allowed.
- Standard predictions and Daily Pool entries are independent flows.

A normal match prediction:

- does not create a Daily Pool entry
- does not create an extrapoolentries record

Only Match of the Day extra predictions participate in the Daily Pool.

---

# Deadline Rules

The same deadline applies to:

- standard predictions
- extra predictions

Predictions become locked:

```text
10 minutes before kickoff
```

Timezone:

```text
America/La_Paz (UTC-4)
```

After the deadline:

- no creation
- no editing
- no deletion

Allowed:

- viewing existing entries

---

# Payment Methods

Supported methods:

## Receipt Upload

User uploads:

- JPG
- PNG
- WEBP

Maximum size:

```text
5 MB
```

Creates:

```text
paymentvalidated = false
```

until administrative validation occurs.

---

## Credit Usage

Requirements:

```text
users.availablepoolcredits > 0
```

Behavior:

- consume 1 credit
- no receipt required
- receipturl = NULL

---

# Payment Method Lock

The payment method is fixed when the extra prediction is created.

Allowed methods:

- Receipt Upload
- Available Credit

Users cannot switch payment methods after creation.

To use another payment method:

1. Delete the pending entry.
2. Create a new entry.

---

# Entry Editing Rules

Extra predictions may be edited only when:

- deadline has not passed
- paymentvalidated = false

Editable fields:

- predicted score
- receipt image (receipt-based entries only)

Not editable:

- payment method

---

# Entry Deletion Rules

Extra predictions may be deleted only when:

- deadline has not passed
- paymentvalidated = false

Validated entries cannot be deleted.

---

# Validated Entry Lock

Once:

```text
paymentvalidated = true
```

the entry becomes immutable.

Users cannot:

- edit the prediction
- delete the prediction
- replace the receipt
- change payment method

Only administrators or external scripts may manage validated entries.

---

# Credit Refund Rules

If a credit-based entry is deleted before the deadline:

```text
1 credit must be refunded
```

to:

```text
users.availablepoolcredits
```

If deletion is not allowed:

```text
no refund occurs
```

Validated entries cannot be deleted.

---

# Receipt File Lifecycle

Receipt path format:

```text
{userid}/{matchid}/{timestamp}.{ext}
```

When a receipt-based entry is deleted:

- remove the associated file from Supabase Storage

When a receipt is replaced:

1. upload the new file
2. verify upload success
3. remove the old file

Avoid orphaned files.

---

# Payment Validation

Payment validation is NOT performed by the web application.

Administrative processes determine whether:

```text
paymentvalidated = true
```

or

```text
paymentvalidated = false
```

---

# Rejected Payments

If a payment is rejected:

```text
paymentvalidated = false
```

The entry remains visible in Pool History.

Rejected entries:

- do not participate in Daily Pool settlement
- do not generate prizes
- do not count as valid participation

---

# Pool Settlement

Pool settlement is NOT performed by the web application.

Settlement is executed through:

- external scripts
- administrative processes

The web application only displays results.

---

# Credit Management

Credit generation is NOT performed by the web application.

Credits may be generated by:

- cancelled pools
- unclaimed prizes
- manual administrative adjustments

The web application only consumes and displays credits.

---

# Source of Truth

The following processes are external:

- ranking calculation
- payment validation
- pool settlement
- credit generation
- match imports
- result synchronization

The web application is responsible only for:

- displaying information
- collecting predictions
- uploading receipts
- consuming credits

---

# Database Naming Convention

All database tables are lowercase.

All database columns are lowercase.

Never generate camelCase database identifiers.

Always follow:

```text
database/schema.sql
```

as the source of truth.

---

# Development Rules

Before implementing any milestone:

1. Review CLAUDE.md
2. Review all documentation inside /docs
3. Review database/schema.sql
4. Verify consistency with business-rules.md
5. Verify consistency with use-cases.md

If any requirement is unclear:

STOP.

Ask before implementing.

Do not invent business rules.