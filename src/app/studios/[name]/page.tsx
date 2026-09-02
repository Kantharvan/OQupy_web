"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  addMinutes,
  areIntervalsOverlapping,
  format,
  isBefore,
  isSameDay,
  parse,
  startOfDay,
} from "date-fns";
import { useAuth } from "@/context/AuthContext";
import {
  getStudioByName,
  getStudioAvailability,
  type Studio,
  type AvailabilityResponse,
} from "@/lib/api/studios";
import {
  createBooking,
  getBookingsByStudio,
  type Booking,
  type BookingType,
  type PaymentMethod,
} from "@/lib/api/bookings";
import { enroll } from "@/lib/api/enrollments";
import { t } from "@/styles/tokens";

const SLOT_MINUTES = 30;
const DURATION_OPTIONS = [1, 2, 4] as const;
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "netbanking", label: "NetBanking" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
];

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localWallClockToISO(day: Date, time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const local = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm, 0, 0);
  return local.toISOString();
}

export default function StudioDetailPage() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { user, isLoading: isAuthLoading } = useAuth();

  const [studio, setStudio] = useState<Studio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudioByName(name)
      .then(setStudio)
      .catch((err) => setError(err instanceof Error ? err.message : "Studio not found"))
      .finally(() => setIsLoading(false));
  }, [name]);

  return (
    <main className={`min-h-screen ${t.page} px-4 py-8`}>
      <div className="max-w-3xl mx-auto">
        <Link href="/studios" className={`text-xs ${t.link} mb-6 inline-block`}>
          ← Back to studios
        </Link>

        {isLoading ? (
          <div className={`${t.cardBox} h-64 animate-pulse`} />
        ) : error || !studio ? (
          <div className={`${t.cardBox} p-10 text-center`}>
            <p className={`${t.textPrimary} font-semibold`}>Studio not found</p>
            <p className={`text-sm ${t.textMuted} mt-1`}>{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className={`${t.cardBox} overflow-hidden`}>
              <div className="w-full h-64 bg-bg-input flex items-center justify-center overflow-hidden">
                {studio.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl opacity-30">🏢</span>
                )}
              </div>
              <div className="p-6">
                <h1 className={`text-2xl font-bold ${t.textPrimary}`}>{studio.name}</h1>
                <p className={`text-sm ${t.textMuted} mt-1`}>📍 {studio.location}</p>
                <p className={`text-sm ${t.textSecondary} mt-1`}>{studio.type.join(", ")}</p>
                <p className={`font-bold text-lg ${t.brandText} mt-3`}>
                  ₹{studio.price}<span className={`text-sm font-normal ${t.textMuted}`}>/hr</span>
                </p>
                {studio.description && (
                  <p className={`text-sm ${t.textSecondary} mt-4`}>{studio.description}</p>
                )}
                {studio.amenities.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-4">
                    {studio.amenities.map((a) => (
                      <span key={a} className={`text-xs px-2.5 py-1 rounded-full bg-bg-input ${t.textSecondary}`}>{a}</span>
                    ))}
                  </div>
                )}
                {studio.instructors.length > 0 && (
                  <div className="mt-4">
                    <p className={`text-xs uppercase ${t.textMuted} mb-2`}>Instructors</p>
                    <div className="flex gap-2 flex-wrap">
                      {studio.instructors.map((i) => (
                        <span key={i.id} className={`text-xs px-2.5 py-1 rounded-full bg-bg-input ${t.textSecondary}`}>{i.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Public instructor events — students can enroll */}
            {user?.role === "student" && (
              <PublicEventsSection studioId={studio.id} />
            )}

            <div className={`${t.cardBox} p-6`}>
              <h2 className={`font-semibold ${t.textPrimary} mb-4`}>Book this studio</h2>
              {isAuthLoading ? null : !user ? (
                <div className="text-center py-4">
                  <p className={`text-sm ${t.textMuted} mb-3`}>Sign in to book this studio.</p>
                  <Link href="/login" className={`h-10 px-5 ${t.btnPrimary} text-sm inline-flex items-center`}>Sign in</Link>
                </div>
              ) : user.role === "studio_owner" ? (
                <p className={`text-sm ${t.textMuted}`}>Studio owners can&apos;t book studios directly.</p>
              ) : (
                <BookingFlow studio={studio} userRole={user.role} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ── Public instructor events for student enrollment ───────────────────────────

function PublicEventsSection({ studioId }: { studioId: string }) {
  const [events, setEvents] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getBookingsByStudio(studioId, 1, 50)
      .then((res) => {
        const upcoming = res.data.filter(
          (b) =>
            b.bookingType === "instructor_event" &&
            b.isPublic &&
            b.status === "Confirmed" &&
            new Date(b.dateTime) > new Date()
        );
        setEvents(upcoming.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
      })
      .finally(() => setIsLoading(false));
  }, [studioId]);

  async function handleEnroll(bookingId: string) {
    setEnrollingId(bookingId);
    setErrors((prev) => { const n = { ...prev }; delete n[bookingId]; return n; });
    try {
      await enroll(bookingId);
      setEnrolledIds((prev) => new Set([...prev, bookingId]));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to enroll";
      setErrors((prev) => ({ ...prev, [bookingId]: msg }));
    } finally {
      setEnrollingId(null);
    }
  }

  if (isLoading || events.length === 0) return null;

  return (
    <div className={`${t.cardBox} p-6`}>
      <h2 className={`font-semibold ${t.textPrimary} mb-4`}>Upcoming Classes</h2>
      <div className="flex flex-col">
        {events.map((ev) => {
          const enrolled = enrolledIds.has(ev.id);
          return (
            <div key={ev.id} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className={`text-sm font-medium ${t.textPrimary} truncate`}>{ev.eventName}</p>
                <p className={`text-xs ${t.textMuted} mt-0.5`}>
                  {new Date(ev.dateTime).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}{new Date(ev.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}{ev.durationHours}h
                </p>
                {errors[ev.id] && <p className="text-red-400 text-xs mt-0.5">{errors[ev.id]}</p>}
              </div>
              <button
                type="button"
                disabled={enrolled || enrollingId === ev.id}
                onClick={() => handleEnroll(ev.id)}
                className={`shrink-0 h-8 px-4 rounded-lg text-xs font-medium transition-colors ${
                  enrolled
                    ? "bg-green-500/15 text-green-400 cursor-default"
                    : `${t.btnPrimary} disabled:opacity-50`
                }`}
              >
                {enrolled ? "Enrolled ✓" : enrollingId === ev.id ? "…" : "Enroll"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Booking flow ──────────────────────────────────────────────────────────────

function BookingFlow({ studio, userRole }: { studio: Studio; userRole: string | null }) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isFetchingAvailability, setIsFetchingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [eventName, setEventName] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isInstructor = userRole === "instructor";
  const bookingType: BookingType = isInstructor ? "instructor_event" : "student_practice";

  const priceNumeric = useMemo(() => {
    const n = parseFloat(studio.price);
    return Number.isFinite(n) ? n : 0;
  }, [studio.price]);
  const totalAmount = priceNumeric * durationHours;

  const loadAvailability = useCallback(async (day: Date) => {
    setIsFetchingAvailability(true);
    setAvailabilityError(null);
    setSelectedTime(null);
    try {
      const res = await getStudioAvailability(studio.id, toYMD(day));
      setAvailability(res);
    } catch (err) {
      setAvailabilityError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setIsFetchingAvailability(false);
    }
  }, [studio.id]);

  const handleDaySelect = useCallback((day: Date | undefined) => {
    setSelectedDay(day);
    if (day) void loadAvailability(day);
    else setAvailability(null);
  }, [loadAvailability]);

  const slots = useMemo(() => {
    if (!availability || !selectedDay) return [] as SlotInfo[];
    const { operationalHours, busy } = availability;
    if (!operationalHours) return [];

    const open = parse(operationalHours.open, "HH:mm", selectedDay);
    const close = parse(operationalHours.close, "HH:mm", selectedDay);
    const now = new Date();
    const busyIntervals = busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));

    const out: SlotInfo[] = [];
    let cursor = open;
    while (isBefore(cursor, close)) {
      const slotStart = cursor;
      const slotEnd = addMinutes(cursor, SLOT_MINUTES);
      const isPast = isSameDay(now, selectedDay) && isBefore(slotStart, now);
      const isBusy = busyIntervals.some((iv) =>
        areIntervalsOverlapping({ start: slotStart, end: slotEnd }, iv, { inclusive: false })
      );
      out.push({ label: format(slotStart, "HH:mm"), start: slotStart, busy: isBusy, past: isPast });
      cursor = slotEnd;
    }
    return out;
  }, [availability, selectedDay]);

  const disabledDayMatcher = useCallback((day: Date) => isBefore(day, startOfDay(new Date())), []);

  const wouldConflict = useMemo(() => {
    if (!selectedDay || !selectedTime || !availability) return false;
    const start = parse(selectedTime, "HH:mm", selectedDay);
    const end = addMinutes(start, durationHours * 60);
    return availability.busy.some((b) =>
      areIntervalsOverlapping({ start, end }, { start: new Date(b.start), end: new Date(b.end) }, { inclusive: false })
    );
  }, [selectedDay, selectedTime, durationHours, availability]);

  const canSubmit = !!selectedDay && !!selectedTime && !!eventName.trim() && !wouldConflict && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay || !selectedTime || !eventName.trim()) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createBooking({
        studioId: studio.id,
        bookingType,
        eventName: eventName.trim(),
        dateTime: localWallClockToISO(selectedDay, selectedTime),
        durationHours,
        isPublic: isInstructor ? isPublic : undefined,
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
        paymentMethod,
        paymentStatus: "Pending",
        paymentAmount: totalAmount,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit";
      if (msg.toLowerCase().includes("conflict") || msg.includes("already booked")) {
        setFormError("This slot was just taken by someone else. Pick another time.");
        if (selectedDay) await loadAvailability(selectedDay);
        setSelectedTime(null);
      } else {
        setFormError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-6">
        <p className="text-3xl mb-2">✅</p>
        <p className={`${t.textPrimary} font-semibold`}>Booking requested</p>
        <p className={`text-sm ${t.textMuted} mt-1`}>
          The studio owner will review and approve your booking. Payment via{" "}
          {paymentMethod.toUpperCase()} will be collected after approval.
          {isInstructor && isPublic && " Your session will be visible to students once approved."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Section 1 — Date */}
      <section>
        <h3 className={`text-xs uppercase ${t.textMuted} mb-2`}>1. Pick a date</h3>
        <div className={`${t.calendarRoot} bg-bg-input rounded-xl p-3`}>
          <DayPicker
            mode="single"
            selected={selectedDay}
            onSelect={handleDaySelect}
            disabled={disabledDayMatcher}
            classNames={{
              caption_label: t.calendarCaption,
              weekday: t.calendarHead,
              day: t.dayCell,
              selected: t.dayCellSelected,
              today: t.dayCellToday,
              disabled: t.dayCellDisabled,
            }}
          />
        </div>
      </section>

      {/* Section 2 — Time slot */}
      {selectedDay && (
        <section>
          <h3 className={`text-xs uppercase ${t.textMuted} mb-2`}>2. Pick a start time</h3>
          {isFetchingAvailability ? (
            <p className={`text-sm ${t.textMuted}`}>Loading availability…</p>
          ) : availabilityError ? (
            <p className="text-sm text-red-400">{availabilityError}</p>
          ) : availability && !availability.operationalHours ? (
            <p className={`text-sm ${t.textMuted}`}>Studio is closed on {format(selectedDay, "EEEE")}. Pick a different day.</p>
          ) : slots.length === 0 ? (
            <p className={`text-sm ${t.textMuted}`}>No slots available.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {slots.map((s) => {
                const isSelected = selectedTime === s.label;
                const isBlocked = s.busy || s.past;
                return (
                  <button
                    key={s.label}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => setSelectedTime(s.label)}
                    className={isSelected ? t.timeSlotSelected : isBlocked ? t.timeSlotBusy : t.timeSlot}
                    title={s.busy ? "Already booked" : s.past ? "Past" : ""}
                  >
                    {s.label}{s.busy && " ·busy"}
                  </button>
                );
              })}
            </div>
          )}
          {selectedTime && (
            <div className="mt-4">
              <label className={`text-xs uppercase ${t.textMuted} mb-2 block`}>Duration</label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((d) => (
                  <button key={d} type="button" onClick={() => setDurationHours(d)}
                    className={durationHours === d ? t.timeSlotSelected : t.timeSlot}>
                    {d}h
                  </button>
                ))}
              </div>
              {wouldConflict && (
                <p className="text-red-400 text-xs mt-2">This duration overlaps a busy window. Pick a shorter slot or a different time.</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Section 3 — Event details */}
      {selectedTime && !wouldConflict && (
        <section>
          <h3 className={`text-xs uppercase ${t.textMuted} mb-2`}>3. Event details</h3>
          <input
            type="text"
            placeholder={isInstructor ? "Class / event name" : "What's this for? (e.g. Dance rehearsal)"}
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            required
            className={`w-full h-10 ${t.inputField} px-3 text-sm`}
          />
          {isInstructor && (
            <label className={`flex items-center gap-2 mt-3 text-sm ${t.textSecondary} cursor-pointer`}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-orange-500 w-4 h-4"
              />
              <span>Open for student enrollment</span>
              <span className={`text-xs ${t.textMuted}`}>(students can see and enroll once approved)</span>
            </label>
          )}
          {!isInstructor && (
            <div className="flex gap-3 flex-wrap mt-3">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
              />
              <input
                type="text"
                placeholder="Your phone (optional)"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
              />
            </div>
          )}
        </section>
      )}

      {/* Section 4 — Payment stub */}
      {selectedTime && !wouldConflict && (
        <section>
          <h3 className={`text-xs uppercase ${t.textMuted} mb-2`}>4. Payment</h3>
          <div className={`${t.cardBox} p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${t.textSecondary}`}>{durationHours}h × ₹{studio.price}/hr</span>
              <span className={`font-bold text-lg ${t.brandText}`}>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <label className={`text-xs uppercase ${t.textMuted}`}>Method</label>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)}
                  className={paymentMethod === m.value ? t.timeSlotSelected : t.timeSlot}>
                  {m.label}
                </button>
              ))}
            </div>
            <p className={`text-xs ${t.textMuted}`}>
              Payment via Razorpay is collected after the studio owner approves your booking. No charge now.
            </p>
          </div>
        </section>
      )}

      {formError && <p className="text-red-400 text-sm">{formError}</p>}

      <button type="submit" disabled={!canSubmit} className={`h-11 ${t.btnPrimary} text-sm font-semibold`}>
        {isSubmitting ? "Sending…" : "Request booking"}
      </button>
    </form>
  );
}

type SlotInfo = { label: string; start: Date; busy: boolean; past: boolean };
