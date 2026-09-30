# Browser → real backend booking test

These tests supplement the mocked Playwright suite. It drives the mobile UI through a custom booking request, owner approval and customer confirmation using a real local Nest API, PostgreSQL and Redis. It then cancels via the API and verifies the UI status and released availability. Customer cancellation currently has no dashboard button.

## Prerequisites

Use the companion backend launch-hardening change, including `scripts/isolated-env.cjs` and `scripts/browser-fixture.ts`. Follow `OQupy_srv/docs/launch-readiness.md` to start dedicated loopback PostgreSQL/Redis, migrate/build the backend, create `/tmp/oqupy-browser-fixture.json` and start the API on port 4401. The fixture has test session credentials: do not commit or upload it.

The script disables external credentials even if a developer's ignored `.env` contains them. Never run this workflow against shared/production databases. Its database-name guard does not replace checking that the services are disposable.

From this frontend directory:

```bash
npm run build:integration
npx playwright install chromium
OQUPY_INTEGRATION_FIXTURE=/tmp/oqupy-browser-fixture.json npm run test:integration
```

Playwright starts the UI at `http://127.0.0.1:3101`. The build embeds the API `http://127.0.0.1:4401/api/v1`; it is not deployable. Browser requests to other hosts/ports are aborted instead of accidentally reaching production. Google is disabled and test sessions come from the real local Redis refresh endpoint. A US browser timezone verifies the submitted IST timestamp; a separate owner browser verifies approval propagation.

Use a fresh fixture per run. Cleanup via the backend fixture script, then stop the API and disposable services. Before returning to mocked browser tests run `npm run build:test` again; before normal deployment use its own production build/environment.

## Scope and CI

The test asserts the real persisted API result: 1.5 hours × ₹600 = ₹900, Pending payment, AwaitingApproval → Confirmed → Cancelled, with the interval present/released in availability. It also fails on the previous student class-fetch error caused by calling an owner-only endpoint.

This test does not intercept API responses or emulate database behavior. It does not verify Google OAuth, SMS delivery or a physical mobile browser. Failure screenshots may contain the local fixture names; traces are disabled to avoid retaining refresh credentials.

The regular fixture suite remains separate. `.github/workflows/integration.yml` now runs the real journeys on PRs, main pushes, nightly and manual dispatch, provided the read-only companion checkout key is configured. See [release verification](../docs/testing.md) for key scope, exact triggers, required checks and rollout order. The expanded roles tests require the companion backend fixture expansion.
