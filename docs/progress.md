# OQupy Web — Build Progress

## Phase 0 — Project Scaffold ✅
- Next.js 16, TypeScript strict, Tailwind CSS v4, ESLint, App Router, src/ directory
- `docs/` folder with context, decisions, progress, flow

---

## Phase 0.5 — Design System ✅
- Design tokens set in `src/app/globals.css` using Tailwind v4 `@theme`
- Color palette locked: `#0a0a0a` page bg · `#141414` card · `#1a1a1a` input · `#c2410c` CTA btn · `#f97316` brand/logo · `white` Google btn
- `layout.tsx` updated: OQupy metadata, dark bg enforced
- Root `/` redirects to `/login`
- No shadcn/ui — raw Tailwind v4 (shadcn targets Tailwind v3; incompatible)

### Token system ✅
- `src/styles/tokens.ts` — single source of truth for all Tailwind class shortcuts
- `CLAUDE.md` updated with mandatory token usage rules and page template
- All existing pages refactored to use `import { t } from "@/styles/tokens"` — no hardcoded hex in components
- **To change the theme:** edit hex values in `globals.css` only
- **To build a new page:** import `t` from `@/styles/tokens` and use `t.page`, `t.cardBox`, `t.btnPrimary`, etc.

---

## Phase 1 — Auth Flows (In Progress)

### Completed
- [x] `src/app/(auth)/layout.tsx` — Suspense wrapper
- [x] `src/app/(auth)/login/page.tsx` — simplified single-flow UI:
  - **Phone / OTP** (only flow) — +91 prefix, 10-digit input, Send OTP button disabled until exactly 10 digits entered → navigates to `/verify-otp`
  - OR divider + Continue with Google button (stub, wired when backend ready)
  - No email/password tab — removed (Google covers password-based users)
  - No "Register" link — removed (post-login onboarding pattern adopted, see below)
- [x] `src/app/(auth)/verify-otp/page.tsx` — 6-box OTP input (auto-focus, auto-advance, paste, backspace nav), 30s resend countdown, Verify button disabled until all 6 digits filled, Back to Login
- [x] Both pages use token system (`t.*` classes, no hardcoded hex)

### Post-login onboarding (replaces /register)
- New users are detected after OTP verify or Google login via backend response (`isNewUser: true` or `user.role === null`)
- Frontend redirects new users to `/onboarding` instead of a separate register page
- `/onboarding` will collect: name, role selection, and any role-specific details
- This keeps the login page minimal and registration frictionless (no pre-auth signup form)
- **Backend requirement:** `POST /auth/verify-otp` and `POST /auth/google` responses must include `isNewUser: boolean` (or equivalent) so the frontend can branch correctly

### Backend contract (from OQupy_srv audit)
- Auth: custom JWT (email + password) — `JWT_EXPIRES_IN=7d`, single token, Redis blacklist on logout
- Phone OTP endpoints (`POST /auth/send-otp`, `POST /auth/verify-otp`) to be added to srv
- Both flows return `{ token, user }` — same shape
- Four roles: `studio_owner` | `instructor` | `student` | `admin`

### Pending
- [ ] `src/lib/api/client.ts` — base fetch wrapper (Authorization header, 401 handling)
- [ ] `src/lib/api/auth.ts` — `sendOTP()`, `verifyOTP()`, `login()`, `logout()`, `me()`
- [ ] `src/context/AuthContext.tsx` — token in memory, expose `user`, `login`, `logout`
- [ ] `src/middleware.ts` — protect routes, redirect unauthenticated to `/login`
- [ ] Role-based redirect after login: student → `/studios`, owner → `/dashboard`, admin → `/admin`, instructor → `/dashboard`
- [ ] `src/app/(onboarding)/page.tsx` — post-login: name, role selector (4 roles), role-specific details; shown to new users only
- [ ] Role-based redirect after onboarding: student → `/studios`, owner → `/dashboard`, admin → `/admin`, instructor → `/dashboard`

---

## Upcoming Phases

| Phase | Module                 | Status         |
|-------|------------------------|----------------|
| 0     | Scaffold               | ✅ Done        |
| 0.5   | Design system + tokens | ✅ Done        |
| 1     | Auth flows             | 🔄 In Progress |
| 2     | Studio discovery       | Pending        |
| 3     | Bookings / Enroll      | Pending        |
| 4     | Studio owner dashboard | Pending        |
| 5     | Admin panel            | Pending        |
