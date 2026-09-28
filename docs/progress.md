# Oqupy web — Status and remaining work

Updated 2026-09-28 after [PR #14](https://github.com/Kantharvan/OQupy_web/pull/14). This is a dated implementation/verification record, not a continuous health monitor.

## Shipped

- Public discovery, search, studio details and availability-aware booking requests.
- OTP/Google authentication, profile completion and retained booking intent.
- Custom 0.5–24-hour sessions in half-hour increments, AM/PM display and IST conversion.
- Shared dark UI across authentication and all workspace pages: overview, bookings, profile, studios, availability and admin.
- Owner operating-hour controls and timed/recurring blockouts; admin listing review and role management.
- Shared cards, controls and layouts, with deeper orange accents and Google dark-button styling.
- PR-based validation with lint, TypeScript, production build and behavior-focused browser tests.

## Evidence at PR #14

38 Playwright cases passed across desktop IST and mobile America/New_York. The custom-duration regression test failed when the old fixed-duration restriction was restored and passed with the implementation. See [review screenshots and boundaries](review/unified-app/README.md).

The merged commit `9a4710116667e9c2eb9d62be4772fc06ebaec210` passed [main CI](https://github.com/Kantharvan/OQupy_web/actions/runs/36462273446), and Vercel reported deployment success. A subsequent production read-only check confirmed discovery, 1.5-hour availability, AM/PM labels, the ₹900 estimate at ₹600/hour, retained login return parameters, the new login design and Google's button without the white surround. Backend health reported database and Redis OK.

A completed real OAuth/OTP → booking → authenticated dashboard walkthrough was not performed against production. Automated workspace tests used fixtures. No production booking or account mutation was made during verification.

## Remaining work

- Calculate and validate booking prices on the server rather than accepting client `paymentAmount` as authoritative.
- Query availability using studio-local day boundaries, including intervals beginning on a preceding day; resolve all-day/recurrence semantics with the backend.
- Add browser-to-real-backend integration coverage against disposable services for those contracts.
- Complete a controlled authenticated walkthrough for each role, including real Google OAuth on a registered origin.
- Design and implement payment collection/refunds separately; current payment fields are placeholders.
- Review production listing data/photos; sample-looking listings remain visible.
- Verify required CI checks and merge/deployment gates in repository/provider settings. The last documented GitHub observation showed main protected but an empty required-check list; see [CONTRIBUTING.md](../CONTRIBUTING.md).

The development OTP helper requires a server-only Redis URL and returns 404 outside development. Keep it confined to a disposable local backend; it is not a production login mechanism. See [AGENTS.md](../AGENTS.md).
