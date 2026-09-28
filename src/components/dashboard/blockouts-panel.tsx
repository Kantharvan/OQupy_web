"use client";
import { useState, useEffect, useCallback, useTransition } from "react";
import {
  getBlockoutsByStudio,
  createBlockout,
  deleteBlockout,
  type Blockout,
  type CreateBlockoutDto,
  type RecurringType,
  type DayOfWeek,
} from "@/lib/api/blockouts";
import { TimeSelect } from "@/components/ui/time-select";
import { slotISO, formatSessionDate } from "@/lib/booking/availability";
import { t } from "@/styles/tokens";
const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
  { key: "sun", label: "S" },
];

const REPEAT_OPTIONS: { value: RecurringType; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "bi_weekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
];

export function BlockoutsPanel({ studioId }: { studioId: string }) {
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState("1");
  const [recurringType, setRecurringType] = useState<RecurringType>("none");
  const [recurringDays, setRecurringDays] = useState<DayOfWeek[]>([]);
  const [recurringIndefinite, setRecurringIndefinite] = useState(true);
  const [recurringUntil, setRecurringUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBlockoutsByStudio(studioId, 1, 50);
      setBlockouts(
        res.data.sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
      );
    } catch {
      setFormError("We couldn’t load unavailable times. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [studioId]);

  const [, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => {
      load();
    });
  }, [load]);

  function toggleDay(day: DayOfWeek) {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function resetForm() {
    setEventName("");
    setDate("");
    setAllDay(true);
    setStartTime("09:00");
    setDurationHours("1");
    setRecurringType("none");
    setRecurringDays([]);
    setRecurringIndefinite(true);
    setRecurringUntil("");
    setFormError(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !date) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const dateTimeStr = allDay
        ? new Date(`${date}T00:00:00.000Z`).toISOString()
        : slotISO(date, startTime);
      const dto: CreateBlockoutDto = {
        studioId,
        eventName,
        dateTime: dateTimeStr,
        allDay,
        durationHours: allDay ? 24 : Number(durationHours),
        recurringType,
        recurringDays: recurringType !== "none" ? recurringDays : [],
        recurringIndefinite:
          recurringType !== "none" ? recurringIndefinite : false,
        recurringUntil:
          recurringType !== "none" && !recurringIndefinite && recurringUntil
            ? new Date(`${recurringUntil}T00:00:00.000Z`).toISOString()
            : undefined,
      };
      const created = await createBlockout(dto);
      setBlockouts((prev) =>
        [...prev, created].sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
      );
      setShowForm(false);
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create blockout",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteBlockout(id);
      setBlockouts((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setFormError("Could not remove this blockout. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const showRecurringDays =
    recurringType === "weekly" || recurringType === "bi_weekly";

  return (
    <section className="surface-card blockout-panel">
      <div className="section-title">
        <p className={`text-sm font-semibold ${t.textPrimary}`}>Blockouts</p>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            resetForm();
          }}
          className={`h-8 px-3 ${t.btnPrimary} text-xs`}
        >
          {showForm ? "Cancel" : "Add unavailable time"}
        </button>
      </div>

      {formError && (
        <p role="alert" className="notice notice-error">
          {formError}
        </p>
      )}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 mb-4 p-4 rounded-xl bg-bg-input"
        >
          {/* Reason */}
          <input
            type="text"
            aria-label="Reason"
            placeholder="Reason (e.g. Maintenance, Private event)"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className={`h-10 ${t.inputField} px-3 text-sm`}
          />

          {/* Date + All day toggle */}
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="date"
              aria-label="Blockout date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`flex-1 h-10 ${t.inputField} px-3 text-sm [color-scheme:dark]`}
            />
            <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
              <button
                type="button"
                onClick={() => setAllDay(true)}
                className={`px-3 h-10 text-xs font-medium transition-colors ${allDay ? "bg-brand-btn text-white" : `${t.textSecondary} hover:bg-bg-card`}`}
              >
                All day
              </button>
              <button
                type="button"
                onClick={() => setAllDay(false)}
                className={`px-3 h-10 text-xs font-medium transition-colors border-l border-border ${!allDay ? "bg-brand-btn text-white" : `${t.textSecondary} hover:bg-bg-card`}`}
              >
                Timed
              </button>
            </div>
          </div>

          {/* Time + duration (timed only) */}
          {!allDay && (
            <div className="form-columns">
              <TimeSelect
                label="Start time"
                value={startTime}
                onChange={setStartTime}
              />
              <input
                type="number"
                aria-label="Duration (hours)"
                required
                min="0.5"
                step="0.5"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="Duration (hrs)"
                className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
              />
            </div>
          )}

          {/* Repeat */}
          <select
            aria-label="Repeat"
            value={recurringType}
            onChange={(e) => {
              setRecurringType(e.target.value as RecurringType);
              setRecurringDays([]);
            }}
            className={`h-10 ${t.inputField} px-3 text-sm [color-scheme:dark]`}
          >
            {REPEAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Day-of-week pills (weekly / bi-weekly) */}
          {showRecurringDays && (
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d.key}
                  aria-label={d.key}
                  aria-pressed={recurringDays.includes(d.key)}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors border ${
                    recurringDays.includes(d.key)
                      ? "bg-brand-btn border-brand text-white"
                      : `${t.borderInput} ${t.textSecondary} hover:border-zinc-500`
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Until / Forever (recurring only) */}
          {recurringType !== "none" && (
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => setRecurringIndefinite(true)}
                  className={`px-3 h-9 text-xs font-medium transition-colors ${recurringIndefinite ? "bg-brand-btn text-white" : `${t.textSecondary} hover:bg-bg-card`}`}
                >
                  Forever
                </button>
                <button
                  type="button"
                  onClick={() => setRecurringIndefinite(false)}
                  className={`px-3 h-9 text-xs font-medium transition-colors border-l border-border ${!recurringIndefinite ? "bg-brand-btn text-white" : `${t.textSecondary} hover:bg-bg-card`}`}
                >
                  Until
                </button>
              </div>
              {!recurringIndefinite && (
                <input
                  type="date"
                  aria-label="Repeat until"
                  value={recurringUntil}
                  onChange={(e) => setRecurringUntil(e.target.value)}
                  required
                  className={`flex-1 h-9 ${t.inputField} px-3 text-sm [color-scheme:dark]`}
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`h-10 ${t.btnPrimary} text-sm`}
          >
            {isSubmitting ? "Saving…" : "Save Blockout"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-bg-input rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : blockouts.length === 0 ? (
        <p className={`text-sm ${t.textMuted} py-2`}>
          No blockouts — studio is open for all dates.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {blockouts.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0"
            >
              <div>
                <p className={`text-sm font-medium ${t.textPrimary}`}>
                  {b.eventName}
                </p>
                <p className={`text-xs ${t.textMuted}`}>
                  {b.allDay
                    ? new Date(b.dateTime).toLocaleDateString("en-IN", {
                        timeZone: "UTC",
                      })
                    : `${formatSessionDate(b.dateTime)} IST`}
                  {b.allDay ? " · All day" : ` · ${b.durationHours}h`}
                  {b.recurringType !== "none" &&
                    ` · ${REPEAT_OPTIONS.find((o) => o.value === b.recurringType)?.label}`}
                  {b.recurringType !== "none" &&
                    b.recurringIndefinite &&
                    " · Forever"}
                  {b.recurringType !== "none" &&
                    !b.recurringIndefinite &&
                    b.recurringUntil &&
                    ` · Until ${new Date(b.recurringUntil).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                disabled={deletingId === b.id}
                className="shrink-0 h-7 px-3 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors disabled:opacity-50"
              >
                {deletingId === b.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
