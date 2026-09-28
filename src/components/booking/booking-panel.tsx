"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getStudioAvailability,
  type AvailabilityResponse,
  type Studio,
} from "@/lib/api/studios";
import { createBooking } from "@/lib/api/bookings";
import { hourlyRate, money, priceLabel } from "@/lib/booking/price";
import { slotISO, studioToday, timeOptions } from "@/lib/booking/availability";

export function BookingPanel({ studio }: { studio: Studio }) {
  const params = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const initialDate = params.get("date") || "";
  const [date, setDate] = useState(
    /^\d{4}-\d{2}-\d{2}$/.test(initialDate) && initialDate >= studioToday()
      ? initialDate
      : "",
  );
  const [duration, setDuration] = useState(
    [1, 2, 4].includes(Number(params.get("duration")))
      ? Number(params.get("duration"))
      : 1,
  );
  const [time, setTime] = useState(params.get("time") || "");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [event, setEvent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const rate = hourlyRate(studio.price);
  const isInstructor = user?.role === "instructor";
  useEffect(() => {
    if (!date) return;
    let active = true;
    getStudioAvailability(studio.id, date)
      .then((data) => {
        if (active) {
          setAvailability(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Availability could not be loaded",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [studio.id, date, retry]);
  const options =
    availability?.date === date && !error
      ? timeOptions(availability, duration)
      : [];
  const selectionValid =
    !loading && options.some((s) => s.time === time && s.available);
  const canBook =
    selectionValid &&
    rate !== null &&
    !!event.trim() &&
    !!user &&
    user.role !== "studio_owner" &&
    !!user.role &&
    !sending;
  const nextQuery = new URLSearchParams();
  if (date) nextQuery.set("date", date);
  if (time) nextQuery.set("time", time);
  nextQuery.set("duration", String(duration));
  const next = `/studios/${encodeURIComponent(studio.name)}?${nextQuery}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canBook || rate === null) return;
    setSending(true);
    setFormError("");
    try {
      await createBooking({
        studioId: studio.id,
        bookingType: isInstructor ? "instructor_event" : "student_practice",
        eventName: event.trim(),
        dateTime: slotISO(date, time),
        durationHours: duration,
        isPublic: isInstructor ? isPublic : undefined,
        paymentStatus: "Pending",
        paymentAmount: Math.round(rate * duration * 100) / 100,
      });
      setSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Booking could not be requested";
      setFormError(
        /conflict|already booked|overlap/i.test(message)
          ? "That time was just taken. Choose another available time."
          : message,
      );
      setTime("");
      setLoading(true);
      setRetry((n) => n + 1);
    } finally {
      setSending(false);
    }
  }

  if (submitted)
    return (
      <section className="booking-panel" role="status">
        <p className="eyebrow">REQUEST SENT</p>
        <h2 className="text-3xl mt-3">You’re one step closer.</h2>
        <p className="mt-4 text-stone-300 leading-7">
          Your booking is awaiting approval. No payment has been taken. Check
          your bookings for the latest status.
        </p>
        <Link className="button-primary mt-6" href="/dashboard/bookings">
          View my bookings →
        </Link>
      </section>
    );
  return (
    <aside className="booking-panel" aria-label="Booking">
      <div className="flex justify-between gap-4 items-start">
        <div>
          <p className="eyebrow">MAKE ROOM FOR YOUR NEXT SESSION</p>
          <h2 className="text-2xl font-semibold mt-3">Check availability</h2>
        </div>
      </div>
      <p className="text-xl font-semibold mt-4">{priceLabel(studio.price)}</p>
      <p className="text-sm text-stone-400 mt-2">
        Choose your date and time. All times are IST.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
        <label className="form-field">
          Date
          <input
            type="date"
            min={studioToday()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
              setAvailability(null);
              setError("");
              setLoading(!!e.target.value);
            }}
          />
        </label>
        <fieldset>
          <legend className="field-label">Session length</legend>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 4].map((d) => (
              <button
                key={d}
                type="button"
                className={`choice ${duration === d ? "choice-selected" : ""}`}
                aria-pressed={duration === d}
                onClick={() => {
                  setDuration(d);
                  setTime("");
                }}
              >
                {d} {d === 1 ? "hour" : "hours"}
              </button>
            ))}
          </div>
        </fieldset>
        {date && (
          <fieldset>
            <legend className="field-label">Start time</legend>
            {loading ? (
              <p role="status" className="text-sm text-stone-400">
                Checking available times…
              </p>
            ) : error ? (
              <div role="alert">
                <p className="text-sm text-red-300">
                  We couldn’t check availability.
                </p>
                <button
                  type="button"
                  className="text-orange-300 underline mt-2"
                  onClick={() => {
                    setLoading(true);
                    setRetry((n) => n + 1);
                  }}
                >
                  Retry availability
                </button>
              </div>
            ) : options.length ? (
              <>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {options.map((slot) => (
                    <button
                      type="button"
                      key={slot.time}
                      disabled={!slot.available}
                      aria-label={`${slot.time}${slot.reason ? ` — ${slot.reason}` : ""}`}
                      aria-pressed={time === slot.time}
                      className={`choice ${time === slot.time ? "choice-selected" : ""}`}
                      onClick={() => setTime(slot.time)}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
                {!options.some((s) => s.available) && (
                  <p className="text-sm text-stone-400 mt-3">
                    No times fit this session. Try a shorter duration or another
                    date.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-stone-400">
                The studio is closed on this date. Try another day.
              </p>
            )}
          </fieldset>
        )}
        {rate === null && (
          <p role="alert" className="text-sm text-amber-300">
            This studio’s price needs confirmation before it can be booked.
          </p>
        )}
        {selectionValid && rate !== null && (
          <div className="booking-total">
            <span>
              {duration}h × {money(rate)}
            </span>
            <strong>{money(Math.round(rate * duration * 100) / 100)}</strong>
          </div>
        )}
        {user &&
          user.role &&
          user.role !== "studio_owner" &&
          selectionValid && (
            <>
              <label className="form-field">
                {isInstructor
                  ? "Class or event name"
                  : "What’s your session for?"}
                <input
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  placeholder="e.g. Dance rehearsal"
                  maxLength={200}
                  required
                />
              </label>
              {isInstructor && (
                <label className="flex gap-3 text-sm text-stone-300">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  Open for student enrollment after approval
                </label>
              )}
            </>
          )}
        {formError && (
          <p role="alert" className="text-sm text-red-300">
            {formError}
          </p>
        )}
        {authLoading ? (
          <p role="status">Checking your session…</p>
        ) : !user ? (
          <>
            <Link
              className="button-primary w-full"
              href={`/login?next=${encodeURIComponent(next)}`}
            >
              Sign in to request booking →
            </Link>
            <p className="text-center text-xs leading-5 text-stone-400">
              Explore times freely. Sign in when you’re ready to request a
              booking.
            </p>
          </>
        ) : user.role === "studio_owner" ? (
          <p className="text-sm text-stone-300">
            Studio owners manage their schedule from the dashboard.
          </p>
        ) : !user.role ? (
          <Link
            href={`/onboarding?next=${encodeURIComponent(next)}`}
            className="button-primary"
          >
            Complete your profile to book
          </Link>
        ) : (
          <>
            <button
              className="button-primary"
              type="submit"
              disabled={!canBook}
            >
              {sending ? "Sending request…" : "Request booking →"}
            </button>
            <p className="text-center text-xs leading-5 text-stone-400">
              Subject to approval. No payment is taken now.
            </p>
          </>
        )}
      </form>
    </aside>
  );
}
