# Oqupy web — Current decisions

## Stack and ownership

Next.js 16 App Router, React 19, strict TypeScript and Tailwind v4. The web and backend repositories deploy independently. `src/lib/api/` contains typed endpoint wrappers around a shared client; it does not implement backend business rules. Package versions and scripts are defined in `package.json` and the npm lockfile.

## One UI system

Public, auth and workspace routes share theme tokens and component classes in `src/app/globals.css`. `src/styles/tokens.ts` supplies style shortcuts; it is not mandatory to import it into every component. Shared components own common headers, auth layouts, page headings, booking cards and time inputs. No shadcn/ui dependency is currently installed; this is not a claim about Tailwind compatibility.

The primary orange is `#f65b0b`, with separate readable text accents. Use centralized tokens rather than per-page colour overrides. Google retains its provider-rendered button with dark-outline styling and an iframe colour-scheme boundary.

## Authentication

Auth state lives in React context. Access tokens are in memory and refresh tokens persist in localStorage under `oqupy_refresh`. A protected 401 triggers one refresh/retry; refresh returns a new access token while the existing refresh token is retained. This records shipped behavior, not a cookie migration decision. Any storage/security redesign needs coordinated frontend/backend review.

## Booking time and money

Display AM/PM and interpret selected studio times in IST. Preserve `HH:mm` for operating hours and send ISO timestamps for booking/timed blockout inputs. Session lengths allow half-hour steps from 0.5 to 24 hours only when the complete interval fits availability.

The frontend parses legacy studio rate strings and displays an estimate. Booking requests do not collect payment; backend-authoritative pricing and availability day boundaries remain explicit follow-ups in [progress](progress.md).

## Tests and delivery

All changes go through PRs. Prefer tests that fail for a real regression and assert visible behavior or request contracts; do not optimize for a coverage percentage. The current Playwright suite uses controlled APIs and Google/SMS fixtures. Real backend integration is separate. CI checks and deployment success are different evidence from production flow verification.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for commands and repository protection settings.
