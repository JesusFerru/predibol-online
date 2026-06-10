Analiza:

- CLAUDE.md
- /docs/*
- /database/schema.sql

Detecta:
- inconsistencias
- tablas faltantes
- columnas faltantes
- índices faltantes
- problemas de normalización
- problemas para implementar las reglas de negocio

No generes código todavía.


api key
c34b4cf30fa32e46f3e84c30cd0c54dd


# Use Cases and Platform Flows

## Overview

Predibol Online is a private web platform for World Cup 2026 predictions.

There is no administrative panel inside the application.

Administrative operations are handled manually or through external scripts.

---

# Administration

## Manual Processes

### User Whitelist Registration

Administrators collect participant information through an external form.

The form generates a Google Sheet containing:

* Full Name
* Alias
* Email Address
* Phone Number

Administrators manually review the submissions and insert approved users into the `authorized_users` table in Supabase.

The `authorized_users` table is the source of truth for platform access authorization. The `Users` table is automatically provisioned from `authorized_users` after successful Google OAuth login.

Expected number of participants is below 50.

Only users existing in the whitelist may access prediction features.

---

## Automated Processes

The following operations are executed outside the web application through scripts:

The following operations are executed outside the web application through scripts:

### Match Schedule Import

Imports official World Cup matches into the platform.

### Match Result Synchronization

Updates official match results from external data sources.

### Ranking Calculation

Calculates participant points and updates tournament rankings.

### Daily Pool Settlement

Determines winners and distributes daily pool prizes.

### Credit Management

Handles:

* Unclaimed prizes
* Daily pool cancellations
* Minimum player requirement failures

### WhatsApp Notifications (future)

Generates and shares:

* Daily rankings
* Daily winners
* Match summaries
* General announcements

### Statistics Generation (future)

Calculates and updates platform statistics.

---

# Participant Flows

## Header Navigation

The application header contains:

* Home
* Rules
* Help
* Predibol - World Cup 2026
* Member Login

---

# Home Page

## Public Visitor

When a visitor enters the website, they can view:

* World Cup groups image (`wc-img-1`)
* Introductory content
* General World Cup information
* Login button

Displayed message:

"Sign in to submit your World Cup predictions."

---

## Login

Users authenticate using Google OAuth.

### Authorization Flow

After Google OAuth authentication, the application validates the user's email against the `authorized_users` whitelist.

### Successful Login

If the authenticated email exists in `authorized_users` and `active = TRUE`:

* A `Users` record is automatically created if one does not already exist (copying name, alias, and admin status from `authorized_users`).
* Access is granted.
* The user can navigate to the prediction portal.

### Failed Login

If the email is not whitelisted or `active = FALSE`:

* The user is signed out and redirected to `/unauthorized`.
* Display message: "You are not authorized to submit predictions. Please contact the administrator."
* No prediction features become available.

---

# Rules Page

Users can view the official tournament rules.

Content source:

`extra_info/normativas.md`

The rules page is public and does not require authentication.

---

# Help Page (future)

Users can view interactive help content explaining:

* How predictions work
* How daily pools work
* How scoring works
* Example prediction scenarios

Assets:

* help-img-1
* help-img-2
* Additional images as needed

---

# Footer

## Additional Information (future)

Area reserved for:

* Internal links
* External resources
* Future content

## Contact

WhatsApp button (`whatsapp-logo.png`)

Redirects users to the official Predibol WhatsApp group.

---
# User Profile Widget

## Overview

Authenticated users have access to a floating profile button visible throughout the application.

The profile button is available from any page after login.

The application should avoid creating dedicated profile pages.

User information should be displayed through a lightweight profile panel.

---

## Open Profile Panel

When the user clicks the floating profile button:

A side panel (drawer) opens.

---

## Profile Information

The panel displays:

* Full Name
* Alias
* Registered Email
* Available Pool Credits
* Current Tournament Points
* Current Ranking Position
* Exact Result Predictions Count
* Winner Predictions Count

---

## Quick Actions

The panel may include:

* Logout
* View Rules
* Open WhatsApp Group

---

## Mobile Behavior

On mobile devices:

* Open as a bottom sheet or fullscreen drawer.

On desktop devices:

* Open as a right-side drawer.

---

## Visibility

The profile button is only visible to authenticated users.

---

# Predibol - World Cup 2026

This is the main participant area.

Authentication required.

Only approved users may access this section.

---

# Daily Matches

Users can view all matches scheduled for the current day.

For each match:

* Team 1
* Team 2
* Match Date and Time (UTC-4)
* Prediction inputs
Only matches scheduled for the selected day are displayed.
---

# Standard Predictions

## Create Prediction

Users may enter:

* Team 1 Goals
* Team 2 Goals

Allowed values:

0 to 30

Predictions are saved using the "Save" button.

---

## Partial Completion

Users are not required to predict every match.

If some matches are empty and the user clicks Save:

Display warning:

"You still have N matches without predictions. Continue?"

Options:

* Continue
* Go Back

---

## Saved Predictions

After saving:

* Predictions remain visible.
* Previously saved values are automatically loaded.

---

## Edit Prediction

Predictions can be modified until:

10 minutes before kickoff.

After the deadline:

* Inputs become read-only.
* The user can still view the prediction.
* The user cannot modify the prediction.

Other matches that remain open can still be edited.

---

## Empty Values

If a user removes a previously entered value and does not enter a replacement:

* The last saved prediction remains unchanged.

---

## Current Scores

A button is displayed above the matches list:

"View Scores"

This page displays:

* Current tournament points
* Exact result hits
* Winner prediction hits
* Current ranking position

---

# Match of the Day

## Overview

At most one match per day may be designated as:

"Match of the Day"

Some days may not have a Match of the Day.

---

## Visual Highlight

The selected match should be visually highlighted.

Requirements:

* Gold border
* Small label above the match

Label:

"Match of the Day"

---

## Daily Pool Participation

Users may optionally participate in the daily pool.

Participation is independent from normal predictions.

---

## Additional Predictions

Users may submit multiple additional score predictions for the Match of the Day.

Rules:

* Duplicate score combinations are not allowed.
* Each extra prediction requires a separate payment.
* Each extra prediction requires a payment receipt image.

Example:

Prediction 1:
2 - 1

Receipt:
receipt-001.png

Prediction 2:
3 - 0

Receipt:
receipt-002.png

Prediction 3:
1 - 1

Receipt:
receipt-003.png

---

## Receipt Upload

Allowed formats:

* JPG
* PNG
* WEBP

Maximum size:

5 MB

Each uploaded receipt creates a pending daily-pool entry.

Only validated payments participate in the daily pool.

---

## Credit Usage

If the participant has available pool credits:

* Credits may be used instead of uploading a payment receipt.
* One credit is consumed per additional prediction.
* The user must explicitly choose between:

  * Upload Receipt
  * Use Available Credit

---

## Daily Pool History

Users can view:

* Their extra predictions
* Validation status
* Credits used
* Credits earned

---

# Future Features

The platform may later include:

* Personal statistics
* Historical performance
* Prediction accuracy charts
* World Cup analytics
* AI-generated insights
