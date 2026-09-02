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

  // ── Calendar + time-slot picker (Phase 5b) ──────────────────
  /** react-day-picker root — outer container */
  calendarRoot: "text-white text-sm",
  /** react-day-picker month caption ("May 2027") */
  calendarCaption: "text-sm font-semibold text-white mb-2",
  /** react-day-picker weekday header row (Mo Tu We ...) */
  calendarHead: "text-xs text-text-muted uppercase",
  /** Base day cell — button styling */
  dayCell: "w-9 h-9 text-sm rounded-lg hover:bg-slot-hover transition-colors",
  /** Selected day */
  dayCellSelected: "bg-slot-selected text-white hover:bg-slot-selected",
  /** Today's date, when not selected */
  dayCellToday: "text-brand font-semibold",
  /** Fully-booked or blocked day */
  dayCellDisabled: "text-text-muted opacity-40 cursor-not-allowed line-through",

  /** Time slot pill — base */
  timeSlot: "h-9 px-3 text-xs rounded-lg bg-slot-idle border border-border-input text-white hover:bg-slot-hover transition-colors",
  /** Selected slot */
  timeSlotSelected: "bg-slot-selected border-slot-selected text-white hover:bg-slot-selected",
  /** Busy (already booked/blocked) slot */
  timeSlotBusy: "bg-slot-busy border-slot-busy text-text-muted cursor-not-allowed opacity-70",
  /** Outside operational hours / not applicable */
  timeSlotDisabled: "bg-slot-disabled border-border text-text-muted cursor-not-allowed opacity-40",
} as const;
