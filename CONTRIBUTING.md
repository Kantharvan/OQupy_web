# Contributing to Oqupy

All changes go through a focused pull request. Do not push application changes
directly to main or merge/deploy without the maintainer's direction.

Tests should protect user behavior or a real failure mode. Prefer realistic API
fixtures and observable results over implementation details, snapshots of entire
pages, or coverage quotas. A regression test must fail against the broken behavior.
Keep external payment, email, SMS and production data out of automated tests.

## Frontend validation

- `npm ci`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build:test`
- `npx playwright install chromium`
- `npm test`

Browser tests run the production build, with API calls intercepted using controlled
fixtures at `http://127.0.0.1:4400/api/v1`. They validate frontend behavior and API
payloads, not a running backend. Desktop uses IST and mobile uses a US timezone to
catch accidental browser-local booking conversions. Google Identity Services is mocked; the test build uses a dummy client ID and cannot verify real OAuth. No coverage threshold is used.
Do not deploy the test build; normal deployments use `npm run build` and their own
API environment. Run the backend's independent E2E suite for server contracts.

## GitHub settings

Require PRs and the `Lint, Typecheck & Build` check for main. It now includes the
browser tests as well as static validation. Retain stable check names so repository
rules do not silently stop matching them. Require conversation resolution and block
force pushes. For a solo-maintainer repository, do not require an approval the PR
author cannot supply; request review where a second maintainer is available.

On September 29, frontend main was configured to require `Lint, Typecheck & Build`
and `Full stack integration`, strict up-to-date checks, and administrator enforcement.
PRs remain required with zero mandatory approvals for the solo maintainer.
See `docs/testing.md` for companion access, rollout and provider verification.
