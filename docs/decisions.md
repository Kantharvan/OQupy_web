# OQupy Web — Decisions

## Stack
- **Next.js 15** (App Router) — SSR + client components, file-based routing
- **TypeScript** strict mode
- **Tailwind CSS** — utility-first styling
- **ESLint** — linting

## Architecture decisions
- App Router (not Pages Router) — modern Next.js pattern, layout-based routing
- Separate repos for web and mobile — different toolchains, independent deploys
- API client in `src/lib/api/` — centralised fetch wrapper with auth token handling
- Auth state in context/store — access token in memory, refresh token in httpOnly cookie (TBD)
