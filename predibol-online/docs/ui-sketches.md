# UI Sketches

## Overview

Described mockup is a visual reference only.

It defines:

- General layout
- Visual hierarchy
- Color palette
- Main sections

It does NOT define:

- Exact dimensions
- Exact spacing
- Final responsive behavior
- Final typography

Claude should use the mockup as inspiration while applying modern responsive UI/UX practices.

---

# Design Theme

## Inspiration

FIFA World Cup 2026 branding.

Primary colors should be inspired by:

- Dark Red 
- Deep crimson (#cd0100)
- Wine red (#660000)
- White
- Light gray overlays 

The application should feel:

- Modern
- Sports-oriented
- Clean
- Easy to use
- Mobile-first

---

# Global Layout

The application consists of:

1. Fixed Header
2. Scrollable Content Area
3. Fixed Footer

The entire site must be fully responsive.

Supported breakpoints:

- Mobile
- Tablet
- Desktop

---

# Background

The official FIFA World Cup 2026 image will be used as the main background.

Requirements:

- Full screen coverage
- Responsive scaling
- Preserve aspect ratio

A semi-transparent overlay must be placed above the background image.

Purpose:

- Improve readability
- Reduce visual noise
- Maintain contrast

Suggested overlay:

- Gray
- Black
- Glass effect

Claude may choose the best implementation.

---

# Header

## Behavior

Always fixed at the top.

Visible on every page.

---

## Desktop

Navigation items:

- Home
- Rules
- World Cup 2026
- Help

Authentication button:

- Member Login

The active page should use a darker shade.

---

## Mobile

Replace navigation links with:

- Hamburger menu

The login button remains visible.

---

# Main Content Area

Scrollable vertically.

Centered layout.

Should use responsive containers.

---

# Home Page

Contains:

- Hero image
- Welcome message
- General World Cup information
- Promotional content

Content will grow over time.

Design should allow future sections.

---

# Predictions Page

Main page of the platform.

---

## Section Header

Displays:

- Current tournament title
- Current stage title
- Optional subtitle

Examples:

Group Stage

Round of 32

Quarter Finals

Semi Finals

Final

---

## Match Cards

Matches should be displayed using cards.

Each card contains:

- Match date
- Team 1 logo
- Team 1 name
- Team 2 logo
- Team 2 name
- Score inputs

Inputs:

Team 1 Goals

Team 2 Goals

Allowed values:

0-30

---

## Match Of The Day

One match may be highlighted.

Visual requirements:

- Gold border
- Gold title
- Slightly larger emphasis

Label:

Match of the Day

---

## Daily Pool Controls

Inside the Match of the Day card:

- Participate checkbox/button
- Add Extra Prediction button
- Upload Receipt button

If multiple predictions exist:

Display them as separate prediction rows.

---

# Floating Actions

The following actions should not occupy permanent space in the header.

---

## User Profile Button

Floating button.

Position:

Bottom right.

Visible only when authenticated.

Opens:

Profile drawer.

Displays:

- Name
- Alias
- Credits
- Ranking position
- Points
- Logout

---

## View Scores Button

Floating button.

Position:

Bottom right.

Above Profile Button.

Opens:

Tournament ranking modal.

Displays:

- Top ranking
- User position
- Points

---

## Podium Prediction Button

Floating button.

Position:

Bottom right.

Above View Scores.

Visible only before prediction deadline.

Deadline:

June 27, 2026

Opens:

Podium prediction modal.

Fields:

- World Champion
- Runner-up
- Third Place

Validation:

The same country cannot be selected twice.

After the deadline:

- Button disappears
OR
- Modal becomes read-only

Claude may choose the best UX option.

---

# Help Page

Contains:

- Help images
- Tutorials
- Examples

Images should be displayed using:

- Carousel
OR
- Responsive cards

---

# Rules Page

Displays:

- Official rules document

Should be highly readable.

Recommended:

- Large content container
- Section navigation
- Responsive typography

---

# Footer

Always visible.

Uses the same dark red tone as the selected navigation item.

Contains:

## Left

Predibol logo.

(Placeholder image)

---

## Center

Additional information links.

Examples:

- Game Rules
- Scoring System
- Match Schedule
- Contact

---

## Right

WhatsApp button.

Redirects to the official WhatsApp group.

---

# Assets

The following JSON files provide static content:

extra_info/teams-wc26.json

Contains:

- Team names
- Team codes
- Team logos

extra_info/wc26.json

Contains:

- Tournament information
- Groups
- Stages
- Additional metadata

The UI should consume these files when applicable.

---

# Future Improvements

The design should be component-based and easily extensible.

Future additions may include:

- Statistics dashboard
- Prediction history
- AI insights
- Charts
- Historical performance analysis