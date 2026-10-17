# OQupy web — current implementation and remaining work

Reviewed against source on 2026-10-17. Hosting health and provider settings require live verification.

## Implemented

- Studio discovery/search, area/city display, Google Maps links and availability.
- OTP/Google callbacks, student onboarding, safe retained booking selections and refresh sessions.
- Half-hour durations from 0.5 to 24 hours, AM/PM display and explicit IST scheduling.
- Role-specific workspace, owner listing/hours/blockouts, admin approval and grouped user-role management.
- Backend-authoritative prices, serialized booking mutations and shared IST interval rules.
- Public class projection and student enrollment without access to private owner history.
- Fixture browser tests and separate real-backend role journeys in CI; read-only production smoke.

## Stabilization priorities

Protect the existing booking, authentication and management flows before adding features.
Tests must demonstrate outcomes and failure recovery; do not replace real API/persistence checks with mocks or remove useful authorization cases to reduce test counts.
See [testing](testing.md) for suite responsibilities.

Remaining verification/work:
- Real Google/OTP walkthroughs on a registered origin and designated test identity.
- Review notification delivery/wiring, backups/restore, alerting and legacy production data with the backend.
- Customer cancellation currently has no dashboard action; the API is covered separately.
- Cancellation deadlines/refunds and payment collection remain unimplemented product work.
- Verify repository/provider merge and deployment gates; committed workflow files do not establish dashboard state.

## Evidence at PR #14

38 Playwright cases passed across desktop IST and mobile America/New_York. The custom-duration regression test failed when the old fixed-duration restriction was restored and passed with the implementation. See [review screenshots and boundaries](review/unified-app/README.md).

The merged commit `9a4710116667e9c2eb9d62be4772fc06ebaec210` passed [main CI](https://github.com/Kantharvan/OQupy_web/actions/runs/36462273446), and Vercel reported deployment success. A subsequent production read-only check confirmed discovery, 1.5-hour availability, AM/PM labels, the ₹900 estimate at ₹600/hour, retained login return parameters, the new login design and Google's button without the white surround. Backend health reported database and Redis OK.

A completed real OAuth/OTP → booking → authenticated dashboard walkthrough was not performed against production. Automated workspace tests used fixtures. No production booking or account mutation was made during verification.
