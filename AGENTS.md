# Agent guide — OQupy web

## Scope and sources

This repository is the Next.js web client for OQupy, a creative-space marketplace for studio owners, instructors, students, and admins. It consumes the separate OQupy_srv REST API; it does not contain that backend.

Read `CLAUDE.md`, `docs/flow.md`, and the relevant source before changing behavior. When available, read sibling `../OQupy_shared_content/contracts/`, `roles/roles.md`, and `webapp-notes.md` before API changes. Coordinate contract updates with the backend. That sibling checkout is not guaranteed in cloud environments. Shared notes and historical review records may describe earlier implementations: verify against current source and report discrepancies rather than silently changing contracts.

## Architecture and conventions

- Next.js 16.3.6 App Router, React 19, strict TypeScript, Tailwind v4; npm lockfile at repository root.
- `src/app/(auth)`: phone OTP and Google login; `(onboarding)`: onboarding; `studios/`: discovery, studio details and booking flow; `dashboard/`: role-specific management.
- `src/lib/api/`: typed endpoint wrappers. Use `apiRequest` in `client.ts` for bearer headers, one silent refresh/retry on protected-endpoint 401s, and session clearing. OTP send/verify and Google sign-in failures remain on their auth screens instead of triggering session refresh.
- Access tokens live in memory. Refresh tokens also persist under localStorage key `oqupy_refresh`; refresh returns only a new access token. Do not implement the older notes' assumption that both tokens rotate or are memory-only.
- `src/context/`: auth state and Google provider. Confirm actual role/null-role routing in components and backend contracts; do not infer permission enforcement from UI visibility.
- Public discovery starts at `/studios` (the root redirects there). Shared public UI lives in `src/components/ui/`, `studios/`, and `booking/`; booking rules and safe auth return paths live in `src/lib/booking/`. Preserve the selected date/time/duration through login and onboarding.
- Public, auth and dashboard routes share `SiteHeader`, global colour tokens and reusable controls. Auth pages use `AuthShell`; dashboard pages use the role-aware workspace layout, `PageHeading`, `BookingCard` and `BlockoutsPanel`. `t` in `@/styles/tokens` points to the shared surface/control classes. Extend these components rather than introducing a parallel design system. `CLAUDE.md` points to these shared conventions.
- Session lengths accept 0.5–24 hours in half-hour increments and must fit the complete available interval. Display 12-hour AM/PM times while retaining API `HH:mm` operating hours and ISO booking timestamps derived from IST selections. Use `TimeSelect` for editable operating/blockout times. UI role guards improve navigation but do not replace backend authorization.
- Keep temporary screenshots under ignored `screenshots/` or Playwright `test-results/`. Deliberate, sanitized PR review screenshots and limitations can be committed under `docs/review/`, as in `docs/review/studio-booking/`.
- Booking submits a request awaiting approval and collects no payment. Legacy price parsing and full-duration slot checks live in `src/lib/booking/`; malformed/zero rates block requests. Times are explicitly IST, not the visitor timezone. Server-calculated prices and studio-local availability day boundaries remain follow-ups documented in `docs/review/studio-booking/README.md`; frontend validation does not enforce server security.

## Environments and deployment

| Mode | API target and configuration |
| --- | --- |
| Fully local | Frontend at `http://localhost:3000`; explicitly set `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`. Backend, PostgreSQL and Redis must be started separately or with the backend launcher. |
| Local UI against hosted dev | The documented hosted dev target is `https://oqupy-dev.up.railway.app/api/v1`. Set that URL explicitly and verify the backend CORS allowlist and dev service availability. This uses remote data, not a local sandbox. |
| Production | `.github/workflows/smoke.yml` targets `https://oqupy-web.vercel.app` and `https://oqupy-prod.up.railway.app/api/v1`. The API client also defaults to this production API when its variable is absent. |
| Preview | Vercel project settings control preview variables and branch mappings; these settings are not committed here. Verify the selected API and corresponding backend CORS before testing. |

These are repository-documented targets, not a guarantee of current hosting-dashboard state or service health. No Vercel deployment workflow/configuration is committed. CI tests pushes/PRs to main; do not equate that with a verified hosting branch mapping. Historical shared notes may reference other URLs; current client/smoke configuration defines the repository target.

## Local setup

Run commands from this repository root. CI uses Node 22; use Node 22 to match CI, then `npm ci`. The sibling backend still has a 20.19.0 local pin; do not mistake it for the frontend CI version.

Create an ignored `.env.development`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# Add the dev Google OAuth client ID only when testing Google Sign-In:
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
# Optional server-side OTP helper, targeting the same local Redis as the API:
# REDIS_URL=redis://localhost:6379
```

- `npm run dev` explicitly loads `.env.development` through dotenv-cli and starts Next.
- Google login requires `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `src/context/GoogleProvider.tsx`, matching the backend's `GOOGLE_CLIENT_ID` and configured browser origin. A missing ID does not provide working Google authentication.
- Backend local variables must include `PORT=4000` and `ALLOWED_ORIGINS=http://localhost:3000`; see its root `AGENTS.md`.
- For the macOS full-stack launcher, check out the repos as siblings, prepare both env files and databases, install dependencies in both, then run `npm run dev:local` from `../OQupy_srv/oqupy-srv`. `OQUPY_WEB_DIR` overrides the frontend path.
- The launcher requires Homebrew and starts PostgreSQL 16/Redis; it does not install packages or initialize/migrate the database. It is not portable to an Ubuntu cloud container unchanged.
- `/api/dev/otp` invokes `redis-cli`, needs server-only `REDIS_URL`, and returns 404 outside `NODE_ENV=development`. Keep it confined to trusted local development and never connect it to production Redis.
- The backend README's promise of role login tokens from its seed script is stale; inspect that script before relying on it.
- No `.env.example` is currently committed here. Do not assume a developer's ignored env files are available in CI/cloud.

## Build, validation and configuration boundaries

```bash
npm run lint
npx tsc --noEmit
npm run build:test
npx playwright install chromium
npm test
```

CI runs these checks with Chromium system dependencies installed. Playwright tests use a production build on port 3100 and intercept the fixture API at `http://127.0.0.1:4400/api/v1`; they do not call a running backend. Desktop runs in IST and mobile Chromium in America/New_York. They cover discovery, OTP/onboarding, custom durations, retained booking selections and payloads, price/availability rules, conflict/error recovery, role-specific workspace actions, sign-out and layout overflow. Google Identity Services is mocked with a dummy test client ID; this verifies callback payloads/theme configuration, not real OAuth or Google-rendered pixels. Failure reports are uploaded by CI. For full-stack contract changes, also run the backend suite against disposable services and the opt-in `integration/README.md` workflow. Public classes use `/bookings/public/studio/:studioId`; never expose private owner history to work around an authorization error. Browser mocks alone cannot prove integration. Never deploy `build:test` output: its public API URL is intentionally the fixture endpoint.

`npm run build:prod` explicitly loads `.env.production`; `npm run build` runs Next's normal build and `npm start` serves its output. Set intended public variables before building; do not rely on changing them only when starting an already-built client. Audit ignored `.env.local` and shell overrides when a target appears wrong, without printing credentials.

The stable required-check candidate is `Lint, Typecheck & Build`, which now includes browser tests. Read `CONTRIBUTING.md` for PR-only changes, meaningful regression tests and repository protection follow-ups; workflow success alone does not prove required checks are enforced.

The nightly smoke workflow uses live production endpoints; do not use it as a substitute for isolated feature tests. Documentation-only changes need source/link/command review, not fabricated application test results.

Never commit env files, tokens, database URLs with credentials, or private service keys. `NEXT_PUBLIC_*` values are browser-visible: never use that prefix for Redis/JWT/provider secrets. Do not run mutating feature tests against the production fallback.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Contribution workflow

Follow CONTRIBUTING.md. Make changes through PRs, and test user behavior and
failure cases rather than pursuing coverage percentages. Include validation
results and known limitations in every PR.
