# Release verification

Changes go through PRs. No coverage quota substitutes for a failing regression or an observable user outcome.

| Layer | Trigger | What it proves |
| --- | --- | --- |
| `Lint, Typecheck & Build` | Every PR/push to main | Build/static checks and 40 desktop/mobile fixture tests, including errors, auth callbacks, workspace navigation and permissions |
| `Full stack integration` | Every PR/push to main; nightly 00:30 UTC; manual | Real browser → Nest → PostgreSQL/Redis with disposable services, using the current repo revision and companion main |
| `Nightly Smoke` | Nightly 01:15 UTC; successful Vercel status for current main; manual | Read-only production discovery, search, availability, custom duration/price, sign-in handoff and anonymous workspace guards on desktop/mobile |

The backend runs its API suite independently. Its release smoke checks storage health, CORS, public scheduling/classes and private guards, then runs these same production browser tests after a successful production Railway status. Both workflows use fixed production URLs, not event-supplied URLs. Preview and superseded commit statuses are ignored. The deployment event path becomes active only after the workflow is merged into main; verify its first automatic run after the next release. Nightly/manual runs remain the fallback.

## Full stack access and isolation

`.github/workflows/integration.yml` checks out both private repositories. This repository needs the Actions secret `OQUPY_SRV_READ_KEY`: an SSH deploy key whose public half is installed on `Kantharvan/OQupy_srv` with **read-only** access. The backend needs the reverse `OQUPY_WEB_READ_KEY`. Never reuse a personal/admin/deployment token. Do not commit the private keys. Revoke the deploy key and delete the paired secret when retiring access. Checkout uses `persist-credentials: false`.

Trusted workflow authors can use these keys to read the companion source. Fork PRs have no key and fail with a clear setup error; move reviewed changes onto a trusted maintainer branch. Never switch this to `pull_request_target` executing untrusted PR code.

CI has PostgreSQL 16/Redis 7 service containers and literal disposable credentials. `isolated-env.cjs` disables external providers. Test builds target loopback only; browser requests to external hosts are aborted. Fixture sessions bootstrap student, owner, instructor, admin and new-owner accounts. No real Google/SMS delivery is claimed. Cleanup runs on failures; credential files, traces and backend request logs are never uploaded. Exact checked-out SHAs appear in the run log.

The three real journeys cover:

- Customer fractional request → owner approval → customer confirmation → HTTP cancellation → availability released.
- Instructor public class → owner approval → student enrollment persisted → duplicate rejected.
- Owner studio creation → hidden while pending → admin approval → public discovery → persisted AM/PM operating hours → blockout visible in public availability.

Use [integration/README.md](../integration/README.md) locally. Manual workflow runs accept `companion_ref` to test coordinated branches; PR runs always use companion main. Merge the backend fixture expansion before the frontend expanded journeys, then rerun frontend integration. Before both PRs are merged, backend browser smoke cannot use the new frontend smoke command on main.

## Production smoke

`npm run test:smoke` uses the live deployment without a local build or API mocks. It aborts browser POST/PUT/PATCH/DELETE requests, sends no OTP and creates no booking. Screenshots and HTML reports are retained seven days on failure; traces are disabled. A sampled studio must have a valid price and a 1.5-hour slot fourteen days ahead. An unavailable sample can be a data/occupancy alert rather than a software regression: inspect the artifact and API response before changing an assertion. Never silently skip a failed check.

GitHub Actions failure notifications depend on each maintainer's GitHub notification settings. A failed smoke does not automatically roll back production.

## Required settings and remaining verification

Require `Lint, Typecheck & Build` and `Full stack integration` before merging frontend main, plus conversation resolution and no force pushes. Keep stable check names. Backend must require `Lint, Build & E2E` and `Full stack integration`; GitHub currently rejects protection there with a paid-plan requirement. Railway production reports `checkSuites: true` (wait for CI). These are external settings: verify them rather than assuming the YAML enforces merging.

Before public launch, verify real Google sign-in on the registered origin and OTP delivery with a designated test phone. The production Railway service inspected September 29 has no MSG91 credential names configured. Provider tests need those settings and a test identity; fixture callbacks cannot certify delivery. Also verify notification delivery, backup restore and incident alert recipients. Customer cancellation is API-only and cancellation deadlines/payments remain product follow-ups, not smoke-test guarantees.

A release normally needs green automated checks and targeted review of changed UX. Provider/auth configuration changes and new critical journeys still need explicit verification.
