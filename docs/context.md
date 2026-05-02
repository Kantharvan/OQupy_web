# OQupy Web — Context

## What is OQupy?
OQupy is a studio booking platform connecting students, instructors, and studio owners.
This repo is the web frontend — a Next.js app that consumes the OQupy REST API.

## Backend
- Repo: https://github.com/Kantharvan/OQupy_srv
- API base URL: https://oqupysrv-production.up.railway.app/api/v1
- Auth: JWT (access token 15m) + refresh token (30d, stored in Redis)

## Three user roles
- **Student** — browses studios, enrolls in public bookings/classes
- **Studio Owner** — manages their studio, creates bookings, confirms/cancels
- **Admin** — approves studios, manages users
