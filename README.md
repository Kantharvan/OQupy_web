# Oqupy web

Oqupy connects students, instructors and studio owners with spaces for practice and classes. This repository is the Next.js web client; the REST API lives in [OQupy_srv](https://github.com/Kantharvan/OQupy_srv).

[Production app](https://oqupy-web.vercel.app/studios) · [Contribution workflow](CONTRIBUTING.md) · [Agent guide](AGENTS.md) · [Current user flows](docs/flow.md)

## What is implemented

- Public studio discovery, search, details and availability.
- Phone OTP and Google sign-in, profile onboarding and retained booking selections.
- Custom sessions from 30 minutes to 24 hours in half-hour increments, subject to availability; AM/PM display with IST scheduling.
- Booking requests awaiting approval, with role-specific booking management.
- A shared dark UI across public pages, authentication and the workspace: overview, bookings, profile, studio management, availability and admin.

Payments are not integrated. Displayed booking amounts are not evidence that money was collected. See [current status and remaining work](docs/progress.md).

## Local development

Use Node 22 (matching CI) and npm with the committed lockfile:

```bash
npm ci
```

Create an ignored `.env.development` in this repository:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# Optional, for Google login on a registered local origin:
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
# Optional development OTP helper; use a local disposable Redis instance:
# REDIS_URL=redis://localhost:6379
```

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Start the backend, PostgreSQL and Redis separately; the frontend command does not start them. The backend needs `PORT=4000` and `ALLOWED_ORIGINS=http://localhost:3000` along with its own database/auth settings. See its agent guide for setup.

For the optional macOS full-stack launcher, prepare sibling checkouts, dependencies, environment files and databases, then run `npm run dev:local` from `../OQupy_srv/oqupy-srv`. It requires Homebrew and PostgreSQL 16/Redis. It does not install dependencies or migrate the database; do not assume it creates usable role login tokens. `OQUPY_WEB_DIR` can override the frontend path.

Always set the API target explicitly for local work: the client falls back to production if `NEXT_PUBLIC_API_URL` is absent. Google login requires a matching frontend/backend client ID and an authorized browser origin; it is hidden when `NEXT_PUBLIC_VERCEL_ENV=preview`. Never commit environment files or credentials.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build:test
npx playwright install chromium
npm test
```

Playwright starts the production test build at `http://127.0.0.1:3100` and intercepts API requests to a fixture endpoint on port 4400. No backend process is required for this suite. Desktop uses IST; mobile Chromium uses America/New_York. API, SMS and Google fixtures protect real accounts and data, but do not prove real-backend integration or OAuth. Open the browser report with `npx playwright show-report`.

`build:test` embeds a dummy Google client ID and fixture API URL. **Never deploy this build.** Normal deployments use `npm run build` with the intended public environment variables set at build time. `npm run build:prod` explicitly loads `.env.production`; `npm start` serves the resulting build.

GitHub CI runs lint, typecheck, build and browser tests under `Lint, Typecheck & Build`. The separate nightly smoke workflow reads live production pages and availability. Vercel deployment configuration and branch protection are external settings; check [CONTRIBUTING.md](CONTRIBUTING.md) for their verification boundaries.

A separate [real-backend mobile booking test](integration/README.md) verifies request, approval and cancellation against disposable local services. It is opt-in and is not yet part of the regular CI job.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/app/` | Public, auth, onboarding and dashboard routes |
| `src/components/` | Shared UI, studio discovery, booking and workspace components |
| `src/app/globals.css`, `src/styles/tokens.ts` | Shared theme, component classes and style shortcuts |
| `src/lib/api/` | Typed REST clients and session refresh |
| `src/lib/booking/` | Price parsing, availability, IST conversion and safe auth return paths |
| `tests/` | Behavior and regression tests using Playwright |
| `docs/review/` | Sanitized review screenshots and scoped validation records |

See [design and architecture decisions](docs/decisions.md) before introducing a new UI system or changing authentication contracts.

See [release verification](docs/testing.md) for automated full-stack CI and production smoke.
