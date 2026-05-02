/**
 * OQupy design tokens — single source of truth for Tailwind classes.
 *
 * These map to CSS custom properties defined in globals.css @theme.
 * Import and use these in every component so changing the theme only
 * requires editing globals.css (the CSS vars) and this file (the class names).
 *
 * Usage:
 *   import { t } from "@/styles/tokens";
 *   <div className={t.card}>...</div>
 */

export const t = {
  // ── Backgrounds ──────────────────────────────────────────────
  page:        "bg-bg-page",           // #0a0a0a — full page background
  card:        "bg-bg-card",           // #141414 — cards, modals, sheets
  input:       "bg-bg-input",          // #1a1a1a — inputs, search bar, tab strip

  // ── Borders ──────────────────────────────────────────────────
  border:      "border-border",        // zinc-800 — card borders
  borderInput: "border-border-input",  // zinc-700 — input borders
  focusBrand:  "focus:border-brand focus:outline-none",

  // ── Brand (orange) ───────────────────────────────────────────
  brandText:   "text-brand",           // #f97316 — logo, prices, links
  brandBtn:    "bg-brand-btn hover:bg-brand-hover active:bg-[#7c2d12] text-white transition-colors",

  // ── Text ─────────────────────────────────────────────────────
  textPrimary:   "text-white",
  textSecondary: "text-text-secondary", // zinc-400
  textMuted:     "text-text-muted",     // zinc-500

  // ── Common component patterns ────────────────────────────────
  /** Standard card wrapper */
  cardBox:     "bg-bg-card border border-border rounded-2xl",

  /** Standard text input */
  inputField:  "bg-bg-input border border-border-input rounded-xl px-4 text-white placeholder:text-text-muted text-sm outline-none focus:border-brand transition-colors",

  /** Primary CTA button */
  btnPrimary:  "bg-brand-btn hover:bg-brand-hover active:bg-[#7c2d12] text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",

  /** White secondary button (e.g. Google) */
  btnWhite:    "bg-white hover:bg-zinc-100 active:bg-zinc-200 text-black font-semibold rounded-xl transition-colors",

  /** Orange text link */
  link:        "text-brand hover:text-[#fb923c] transition-colors",

  /** OR divider line */
  dividerLine: "flex-1 h-px bg-border",
} as const;
