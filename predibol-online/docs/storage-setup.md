# Supabase Storage — Payment Receipts

## Overview

Receipt images for Daily Pool entries are stored in a Supabase Storage bucket named `payment-receipts`.

The web application uploads receipts directly from the browser using the Supabase JS client. Administrative review of receipts is done via the Supabase Dashboard or by following the public URL.

---

## Bucket Setup (one-time)

### Step 1 — Create the bucket

1. Go to **Supabase Dashboard → Storage → New Bucket**
2. Name: `payment-receipts`
3. **Public bucket**: ON (receipts need to be viewable via URL)
4. Click **Create bucket**

### Step 2 — Configure bucket settings

1. Open the bucket → **Settings** (gear icon)
2. Set **File size limit**: `5 MB`
3. Set **Allowed MIME types**: `image/jpeg, image/png, image/webp`
4. Click **Save**

### Step 3 — Apply RLS policies

Run the SQL in `database/storage-setup.sql` via:

- **Supabase Dashboard → SQL Editor**, or
- **Supabase CLI**: `supabase db push`

This creates four policies:

| Policy | Operation | Scope |
|---|---|---|
| Users can upload own receipts | INSERT | Own folder only (`{userId}/...`) |
| Anyone can read receipts | SELECT | All receipts (public read) |
| Users can delete own receipts | DELETE | Own folder only |
| Users can update own receipts | UPDATE | Own folder only |

---

## File Organization

### Path convention

```
{userId}/{matchId}/{timestamp}.{ext}
```

Example:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890/42/1718400000000.png
```

- `userId` — Supabase Auth user UUID (folder per user)
- `matchId` — Match identifier (subfolder per match)
- `timestamp` — `Date.now()` at upload time (unique filename)
- `ext` — Original file extension (png, jpg, webp)

### Why this structure?

- **Isolation** — Each user's receipts are in their own folder (RLS enforces this)
- **Organization** — Receipts grouped by match for easy admin review
- **Uniqueness** — Timestamp prevents filename collisions
- **Traceability** — Path reveals user, match, and upload time

---

## Receipt Lifecycle

### Upload

1. User selects a file in the Daily Pool entry form
2. Client validates type (JPG/PNG/WEBP) and size (≤5 MB)
3. Client uploads to `payment-receipts/{userId}/{matchId}/{timestamp}.{ext}`
4. Public URL is retrieved via `getPublicUrl()`
5. URL is stored in `extrapoolentries.receipturl`

### Replacement

1. User edits a pending (non-validated) receipt-based entry
2. User selects a new receipt file
3. New file is uploaded (same path pattern)
4. **Old file is deleted from storage** (avoids orphans)
5. `extrapoolentries.receipturl` is updated

### Deletion

1. User deletes a pending (non-validated) entry
2. Entry records are deleted from `extrapoolentries` and `matchbets`
3. **Receipt file is deleted from storage** (avoids orphans)

### Administrative validation

When an admin marks `paymentvalidated = true`:
- The entry becomes immutable (no edit, no delete)
- The receipt file is preserved permanently

---

## Code Reference

| Module | Purpose |
|---|---|
| `src/lib/supabase/storage.ts` | `uploadReceipt()` and `deleteReceipt()` helpers |
| `src/components/predictions/extra-prediction-panel.tsx` | UI that calls storage helpers |
| `database/storage-setup.sql` | RLS policies for the bucket |

---

## Maintenance

### Orphaned file cleanup

If a receipt file exists in storage but has no corresponding `extrapoolentries` record (e.g., from a failed upload), run this check:

```sql
-- Find receipt URLs that exist in storage but have no matching entry
-- (Manual process — review before deleting)
```

The application prevents orphans by:
- Deleting old receipts on replacement (after new upload succeeds)
- Deleting receipts on entry deletion
- Reversing credit consumption on failed creation (but uploaded file may remain if creation fails after upload)

### Storage quota

Monitor bucket size in **Supabase Dashboard → Storage**. With ≤50 users and ≤5 MB per file, total storage should stay under 1 GB.

---

## Troubleshooting

| Issue | Likely cause | Fix |
|---|---|---|
| Upload fails with 403 | RLS policies not applied | Run `database/storage-setup.sql` |
| Upload fails with 413 | File exceeds 5 MB | Resize/compress the image |
| Upload fails with 415 | Wrong file type | Convert to JPG, PNG, or WEBP |
| Receipt URL returns 404 | File was deleted | Check if entry was deleted (expected) |
| Public URL not accessible | Bucket is private | Set bucket to Public in Settings |
