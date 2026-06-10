# Predibol Online

## Project Context

Predibol Online is a private World Cup 2026 prediction platform.

All project requirements, business logic, database design, user flows, UI references, automations, and architecture decisions are documented under `/docs`.

---

# Documentation

Before implementing any feature, always consult the documentation inside `/docs`.

Source of truth priority:

1. business-rules.md
2. database.md
3. use-cases.md
4. ui-sketches.md
5. automations.md
6. architecture.md
7. roadmap.md

If documentation conflicts:

* `business-rules.md` has priority for business logic.
* `database.md` has priority for data modeling.
* `use-cases.md` has priority for user behavior.
* `ui-sketches.md` has priority for layout and UX.

Never invent business rules that are not documented.

---

# Development Workflow

Work in small vertical slices.

Do not implement the entire application at once.

Follow the phases defined in:

```text
/docs/roadmap.md
```

When a phase is requested:

* Complete only that phase.
* Do not start future phases.
* Keep the codebase compilable.
* Keep the application runnable.

---

# Code Quality

Requirements:

* Production-ready code.
* Strong TypeScript typing.
* Reusable components.
* Mobile-first responsive design.
* Accessible UI when possible.
* Clear folder structure.
* Consistent naming conventions.

Avoid:

* Dead code.
* Placeholder implementations.
* Duplicate logic.
* Unused dependencies.

---

# Supabase Rules

Always:

* Respect Row Level Security.
* Use Supabase Auth.
* Use Google OAuth.
* Use generated database types when available.

Never:

* Bypass RLS.
* Create alternative authentication systems.
* Create unnecessary backend services.

---

# Next.js Rules

Use:

* Next.js 15 App Router.
* Server Components by default.
* Server Actions when appropriate.

Avoid:

* Unnecessary client components.
* Legacy Pages Router patterns.

---

# Asset Management

When implementing any feature:

* Use existing assets whenever available.
* If an asset is missing, continue implementation using a placeholder.
* Register missing assets in:

```text
/not_found_image.txt
```

For each missing asset include:

* Proposed filename
* Intended usage
* Page or component

Never stop implementation because an asset does not exist yet.

---

# Git Workflow

After completing a requested phase:

1. Run lint.
2. Run build.
3. Fix issues.
4. Create a git commit.

Use Conventional Commits.

Examples:

```text
feat(auth): implement google oauth login

feat(predictions): implement daily prediction flow

feat(ranking): add tournament leaderboard
```

---

# Administrative Scope

There is no admin panel.

There are no admin CRUD screens.

Administrative operations are handled through:

* External scripts
* Supabase
* Google Sheets integrations

The web application only exposes participant-facing functionality.

Current Project Status
Current Progress

Phase 1 has already been completed successfully.

Implemented and working:

Supabase connection
Google OAuth authentication
Authentication callback flow
User creation trigger
Layout structure
Routing
RLS policies

Important:

Google OAuth login is already working correctly.
Do not redesign or replace the authentication flow.
Do not create a new authentication system.
Do not modify authentication architecture unless explicitly requested.
Reuse the existing authentication implementation.

The next development target is:

Phase 2 - Core Prediction System

Only implement Phase 2 requirements closing with a commit.

Do not start work from Phase 3 or later phases.