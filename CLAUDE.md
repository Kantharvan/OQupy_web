@AGENTS.md

# Oqupy web — Claude Code guide

Follow [AGENTS.md](AGENTS.md) for architecture, environment boundaries and validation, and [CONTRIBUTING.md](CONTRIBUTING.md) for the PR workflow. Keep these shared rules authoritative rather than duplicating them here.

## Before changing behavior

Read [current user flows](docs/flow.md), the relevant source and tests. [Project status](docs/progress.md) separates shipped behavior from remaining work. Do not infer implementation from old phase plans or from a type existing in an API DTO.

When available, read the relevant `OQupy_shared_content/contracts/`, `roles/roles.md` and `webapp-notes.md`. Look for a sibling checkout; this machine also has a checkout at `/Users/knvasagam/MINE/OQupy_shared_content`. That absolute path is not portable or guaranteed. Compare notes with both implementations and coordinate contract changes through PRs; do not silently overwrite discrepancies or push shared-contract changes directly to main.

## UI changes

Public, auth and workspace pages use one design system. Reuse `SiteHeader`, `AuthShell`, `PageHeading`, `BookingCard`, `TimeSelect` and `BlockoutsPanel` where appropriate. Theme values and shared component classes live in `src/app/globals.css`; `src/styles/tokens.ts` provides optional shortcuts to them. Every component does not need a `t` import. Keep theme colours centralized and use layout utilities as needed; avoid separate page-specific palettes or another UI system.

Use the official Google-rendered button with the supported dark theme. Do not replace it with the old generic white-button example. Changes to the Google integration require a registered-origin check in addition to mocked SDK tests.

Preserve custom durations and safe booking return paths through login/onboarding. Times display AM/PM; operating hours retain `HH:mm`, while booking and timed blockout selections in IST become ISO timestamps. Client validation and role visibility do not replace backend enforcement.

## Evidence and delivery

Make changes through feature branches and PRs. Tests must protect observable behavior and failure cases; no coverage quota applies. Use ignored `test-results/` or `screenshots/` for temporary captures and `docs/review/` for deliberate sanitized review evidence. Report whether checks used fixtures, a real local backend or production, and distinguish Google button appearance from a completed OAuth flow.

See [docs/testing.md](docs/testing.md) for the automated release checks, companion checkout permissions and remaining provider verification.
