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

---

## Phase 1 — Auth Flows (In Progress)

### Completed
- [x] `src/app/(auth)/layout.tsx` — Suspense wrapper
- [x] `src/app/(auth)/login/page.tsx` — tabbed UI:
  - **Phone / OTP tab** (default) — +91 phone input → Send OTP → navigates to `/verify-otp`
  - **Email / Password tab** — email + password fields, Sign In, Forgot password? link
  - Shared OR divider + Continue with Google button
- [x] `src/app/(auth)/verify-otp/page.tsx` — 6-box OTP input (auto-focus, auto-advance, paste, backspace nav), 30s resend countdown, Back to Login

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
- [ ] `src/app/(auth)/register/page.tsx` — name, email, password, role selector (4 roles)
- [ ] `src/app/(auth)/forgot-password/page.tsx` — email input → POST /auth/reset-password

---

## Upcoming Phases

| Phase | Module                 | Status         |
|-------|------------------------|----------------|
| 0     | Scaffold               | ✅ Done        |
| 0.5   | Design system          | ✅ Done        |
| 1     | Auth flows             | 🔄 In Progress |
| 2     | Studio discovery       | Pending        |
| 3     | Bookings / Enroll      | Pending        |
| 4     | Studio owner dashboard | Pending        |
| 5     | Admin panel            | Pending        |
