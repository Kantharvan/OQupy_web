# Unified Oqupy experience

Public discovery, authentication and every dashboard route now share the dark surface palette, deeper orange (#f65b0b), header, controls and typography. Desktop workspace navigation becomes a horizontal role-aware navigation strip on mobile. The confirmation link opens the redesigned bookings page.

Booking duration is editable from 0.5 to 24 hours in half-hour increments, subject to the complete interval fitting availability. Slots display AM/PM; owner hours and timed blockouts use explicit hour/minute/AM-PM controls while retaining existing API contracts. Timed blockouts now convert IST to UTC correctly.

## Validation

- ESLint, TypeScript and production webpack test build passed locally.
- 38 Playwright tests passed across desktop IST and mobile America/New_York.
- Tests verify a 1.5-hour session survives OTP, submits the expected ISO timestamp and ₹900 amount, then appears in the workspace. They also cover invalid/closing-time durations, profile updates, logout/session clearing, owner operating-hour updates, timed blockouts, failed booking approval and retry, admin approval/role updates, direct role-restricted navigation and viewport overflow.
- The duration regression test was verified to fail when the old [1, 2, 4] restriction was temporarily restored, then pass with the custom-duration implementation.
- All API, SMS and Google calls use controlled fixtures. Screenshots below are sanitized fixtures; no production bookings or account changes were made.

## Review images

[Desktop overview](overview-desktop.png) · [Mobile overview](overview-mobile.png) · [Mobile booking](booking-mobile.png) · [Owner operating hours](studio-hours.png) · [Admin](admin.png) · [Login](login.png)

## Boundaries

Google uses the documented `outline_dark` theme and a light colour-scheme boundary around its iframe to avoid the white surround on a dark page. The installed React wrapper has older theme types, so the supported value uses a narrow cast. The SDK is mocked in tests: callback/ID-token and style configuration are verified, but actual Google rendering and OAuth still need a manual check on a registered origin. Preview origins continue to hide Google sign-in; the login screenshot deliberately does not simulate the branded button. See [Google reference](https://developers.google.com/identity/gsi/web/reference/js-reference).

No backend schema change is needed: durationHours already accepts fractional numbers. Client-side duration limits and role guards do not replace server enforcement. Existing server-calculated price and studio-local availability day-boundary follow-ups remain as recorded in [the booking review](../studio-booking/README.md). All-day blockout/recurrence date semantics retain their existing API contract; only timed blockout entry is converted explicitly from IST. Payments remain a booking-request placeholder; overview amounts are labelled confirmed booking value, not revenue.

This PR does not change hosting settings or deploy production.
