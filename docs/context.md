# Oqupy web — Context

Oqupy is a creative-space marketplace for students, instructors and studio owners. This repository contains the Next.js App Router web client; [OQupy_srv](https://github.com/Kantharvan/OQupy_srv) implements the REST API.

The production web app is [oqupy-web.vercel.app](https://oqupy-web.vercel.app/studios). The client and smoke workflow currently target `https://oqupy-prod.up.railway.app/api/v1`. Local work should explicitly target a disposable backend; see the [setup guide](../README.md).

## Roles

| Role | Current web experience |
| --- | --- |
| Student | Browse studios, request practice sessions, access available class enrollment, manage personal bookings/profile |
| Instructor | Request instructor sessions, optionally mark events public, manage personal bookings/profile |
| Studio owner | Manage studios and operating hours, block availability, review studio bookings |
| Admin | Review studio submissions and assign user roles through the admin workspace |

Guests can browse without authentication. New-user onboarding collects a display name and sets the student role; elevated roles are managed by admins. Client navigation guards are not server authorization.

Access tokens are held in memory. Refresh tokens persist in localStorage under `oqupy_refresh` and are restored on startup. The refresh endpoint supplies a new access token while the client retains the existing refresh token. This is the current implementation, not an httpOnly-cookie design.

[User flows](flow.md) · [Architecture decisions](decisions.md) · [Status and follow-ups](progress.md)
