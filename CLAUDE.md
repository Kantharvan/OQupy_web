@AGENTS.md

# OQupy Web — Claude Code Rules

## Design system — MANDATORY for every new page or component

All pages and components MUST use the token system. Never hardcode hex color values.

### The two files that control all styling

| File | Purpose |
|------|---------|
| `src/app/globals.css` | CSS custom properties (`--color-brand`, `--color-bg-card`, etc.) — edit here to change the theme globally |
| `src/styles/tokens.ts` | Tailwind class shortcuts — import and use in every component |

### Required import on every page/component

```ts
import { t } from "@/styles/tokens";
```

### Token usage cheatsheet

```tsx
// Page background
<main className={t.page}>

// Card / modal / sheet
<div className={t.cardBox}>        // includes bg + border + rounded-2xl

// Text input
<input className={`h-12 ${t.inputField}`} />

// Primary CTA button (orange)
<button className={`h-12 ${t.btnPrimary}`}>

// White button (e.g. Google sign-in)
<button className={`h-12 ${t.btnWhite}`}>

// Brand text (orange — logo, prices, links)
<span className={t.brandText}>

// Orange link
<Link className={t.link}>

// Text colours
<p className={t.textPrimary}>      // white
<p className={t.textSecondary}>    // zinc-400
<p className={t.textMuted}>        // zinc-500

// OR divider
<div className={t.dividerLine} />  // horizontal rule
```

### Rules
1. **Never use raw hex** like `bg-[#c2410c]` or `text-[#f97316]` in components — use tokens.
2. **Never use Tailwind color utilities** like `bg-orange-600` — use tokens.
3. If a token doesn't exist for what you need, **add it to `src/styles/tokens.ts` first**, then use it.
4. `globals.css` is the only place hex values are allowed.

### Page template

```tsx
import { t } from "@/styles/tokens";

export default function MyPage() {
  return (
    <main className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4`}>
      <div className={`w-full max-w-sm ${t.cardBox} p-8`}>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>Title</h1>
        <input className={`w-full h-12 ${t.inputField}`} />
        <button className={`w-full h-12 ${t.btnPrimary}`}>Action</button>
      </div>
    </main>
  );
}
```

---

## Screenshots
- Always save Playwright screenshots to `screenshots/<name>.png`
- Never save screenshots to the project root or `.playwright-mcp/`
- `screenshots/` is gitignored — safe to write freely

---

## Tech stack notes
- **Next.js 16** (App Router) + **TypeScript strict** + **Tailwind v4**
- No shadcn/ui — incompatible with Tailwind v4
- API base: `https://oqupysrv-production.up.railway.app/api/v1`
- Auth: JWT (7d), stored in memory; Redis blacklist on logout
- Four roles: `studio_owner` | `instructor` | `student` | `admin`
