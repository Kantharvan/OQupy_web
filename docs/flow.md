# Oqupy web — Current user flows

This describes the implemented frontend as of PR #14, replacing the original phase plan. Source and tests define actual behavior; API contracts live in the separate backend/shared-contract repositories. Setup and test commands are in the [README](../README.md).

## Routes

| Route | Purpose / access |
| --- | --- |
| `/` | Redirects to `/studios` |
| `/studios` | Public discovery and search |
| `/studios/[name]` | Public detail and booking panel; names are URL-encoded |
| `/login` | Phone OTP request and Google sign-in |
| `/verify-otp` | OTP verification and resend |
| `/onboarding` | Signed-in profile completion; sets new users to student |
| `/dashboard` | Role-specific overview |
| `/dashboard/bookings` | Personal bookings or owner studio bookings |
| `/dashboard/profile` | View account details and edit display name |
| `/dashboard/studios` | Owner studio creation/editing and availability management |
| `/dashboard/blockouts` | Owner availability/blockout management |
| `/dashboard/admin` | Admin studio review and user-role management |

Dashboard layout waits for auth, redirects guests to login and users without a role to onboarding. Owner/admin-only pages deny other roles without mounting their page content. Backend authorization is still required. Unknown routes use the shared branded not-found page.

## Discovery → booking request

1. Browse or search studios, then open a studio detail page.
2. Choose a date and session length: 0.5–24 hours in half-hour increments. Availability must fit the entire duration; busy intervals and closing time disable invalid slots.
3. Choose a start time labelled in AM/PM. All scheduling uses IST rather than the browser timezone. The API receives an ISO timestamp and numeric `durationHours`.
4. Guests can inspect availability. Sign-in links carry the selected studio/date/time/duration in a validated `next` path. OTP, Google and onboarding retain that path and availability is checked again on return.
5. Signed-in users enter a session name. Instructors can request a public instructor event; studio owners are directed to their workspace rather than the public booking form.
6. Submitting creates a request awaiting approval. The confirmation links to `/dashboard/bookings`. No payment is collected. Conflicts clear the selected time and reload availability.

The displayed estimate comes from the parsed hourly studio rate multiplied by duration. Invalid/zero rates block requests. Server-authoritative pricing remains a follow-up; client estimates are not a security boundary.

Upcoming public instructor classes are shown to students when applicable, with enrollment actions. Do not assume class enrollment and personal studio requests are the same booking-history contract.

## Authentication and session lifecycle

Phone login calls `POST /auth/send-otp` before navigating to verification. Verification and Google ID-token sign-in set user/token state. New users complete their display name and become students; there is no self-service elevated-role picker.

After sign-in, a valid studio return path takes precedence for non-owner users. Otherwise students go to discovery, admins to `/dashboard/admin`, and owners/instructors to the workspace. See the auth pages for role-specific routing.

Access tokens are in memory; refresh tokens also persist under localStorage key `oqupy_refresh`. `apiRequest` refreshes and retries a protected request once on 401. OTP/Google failures stay on their auth screens. Session expiry clears tokens and navigates to login, preserving a safe studio return path where applicable. Workspace sign-out uses the auth logout method and returns to discovery.

Google requires a configured client ID and registered origin. Preview environments hide the button. SDK fixtures verify the callback and configuration, not real OAuth.

## Workspace

All pages share the public header, dark theme and role-aware navigation. Desktop uses a sidebar; mobile uses a horizontal navigation strip.

- Overview shows booking summaries and relevant links; confirmed booking value is not revenue.
- Bookings provide status filtering and permitted confirmation/cancellation actions. Failed approval remains visible and retryable.
- Profile saves the display name and updates auth context.
- Studio management edits listing fields and opening/closing times with explicit hour/minute/AM-PM controls. API hours remain `HH:mm`.
- Availability supports timed/all-day and recurring blockouts. Timed inputs convert IST to ISO timestamps; all-day and recurrence-date semantics retain the existing contract.
- Admin reviews pending studios and changes user roles.

## Verification boundaries

Playwright protects booking calculations, full-duration availability, auth handoff, workspace mutations/failures, role navigation and viewport layout using API fixtures. Desktop runs in IST; mobile Chromium runs in America/New_York. There is no coverage-percentage gate or installed Vitest/MSW test stack.

Real-backend integration, production authenticated flows and Google OAuth require separate checks. See [remaining work](progress.md) and [review evidence](review/unified-app/README.md).
