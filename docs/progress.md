# OQupy Web — Build Progress

## Phase 0 — Project Scaffold ✅
- Next.js 16, TypeScript strict, Tailwind CSS v4, ESLint, App Router, src/ directory
- `docs/` folder with context, decisions, progress, flow

## Phase 0.5 — Design System ✅
- Design tokens set in `src/app/globals.css` using Tailwind v4 `@theme`
- Color palette locked: `#0a0a0a` page bg · `#141414` card · `#1a1a1a` input · `#c2410c` CTA btn · `#f97316` brand/logo
- `src/styles/tokens.ts` — single source of truth for all Tailwind class shortcuts
- All pages use `import { t } from "@/styles/tokens"` — no hardcoded hex in components
- Root `/` redirects to `/login`
- No shadcn/ui — incompatible with Tailwind v4

## Phase 1 — Auth Flow ✅
- `src/app/(auth)/login/page.tsx` — phone +91 input + Google Sign-In; calls `POST /auth/send-otp` before navigating to `/verify-otp`; shows loading state + error on failure
- `src/app/(auth)/verify-otp/page.tsx` — 6-box OTP input, paste, auto-advance, backspace nav, 30s resend countdown, post-verify routing by role
- `src/app/(onboarding)/page.tsx` — role picker (student / instructor / studio_owner / admin), calls `PATCH /users/:id`; routes to correct destination after role set
- `src/lib/api/auth.ts` — `sendOTP`, `verifyOTP`, `googleAuth`, `getMe`, `logout`
- `src/lib/api/users.ts` — `updateUserRole`
- `src/lib/api/client.ts` — `apiRequest` with auth headers, silent 401 refresh, redirect on session expiry
- `src/context/AuthContext.tsx` — in-memory token store, user state, boots via `GET /auth/me`
- `src/context/GoogleProvider.tsx` — wraps app for Google Sign-In SDK
- Removed deprecated `src/middleware.ts` (Next.js 16 renamed to `proxy`; was a no-op anyway)

## Fix — OTP Not Sent Before Navigation ✅
- Login page was navigating to `/verify-otp` without calling `POST /auth/send-otp`
- Fixed: `handleSendOTP` now async, calls `sendOTP(phone)` first, shows error on failure, button shows "Sending…" state

---

## Upcoming Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Scaffold + design system | ✅ Done |
| 1 | Auth flow (login / OTP / Google / onboarding) | ✅ Done |
| 2 | Studios list (`/studios`) — student landing | Pending |
| 3 | Dashboard (`/dashboard`) — instructor + studio owner | Pending |
| 4 | Admin panel (`/admin`) | Pending |
| 5 | Studio detail + booking flow | Pending |
| 6 | User profile + settings | Pending |
