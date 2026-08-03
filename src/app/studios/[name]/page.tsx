"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getStudioByName, type Studio } from "@/lib/api/studios";
import { createBooking, type BookingType } from "@/lib/api/bookings";
import { t } from "@/styles/tokens";

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
        <Link href="/studios" className={`text-xs ${t.link} mb-6 inline-block`}>← Back to studios</Link>

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
              </div>
            </div>

            <div className={`${t.cardBox} p-6`}>
              <h2 className={`font-semibold ${t.textPrimary} mb-4`}>Request a booking</h2>
              {isAuthLoading ? null : !user ? (
                <div className="text-center py-4">
                  <p className={`text-sm ${t.textMuted} mb-3`}>Sign in to request a booking at this studio.</p>
                  <Link href="/login" className={`h-10 px-5 ${t.btnPrimary} text-sm inline-flex items-center`}>
                    Sign in
                  </Link>
                </div>
              ) : (
                <BookingRequestForm studioId={studio.id} userRole={user.role} />
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function BookingRequestForm({ studioId, userRole }: { studioId: string; userRole: string | null }) {
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState("1");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const bookingType: BookingType = userRole === "student" ? "student_practice" : "instructor_event";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !date) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await createBooking({
        studioId,
        bookingType,
        eventName,
        dateTime: new Date(`${date}T${startTime}:00.000Z`).toISOString(),
        durationHours: Number(durationHours),
        clientName: clientName || undefined,
        clientPhone: clientPhone || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to submit booking request");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-3xl mb-2">✅</p>
        <p className={`${t.textPrimary} font-semibold`}>Request sent</p>
        <p className={`text-sm ${t.textMuted} mt-1`}>The studio owner will review and approve your booking.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="What's this for? (e.g. Dance rehearsal)"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        required
        className={`h-10 ${t.inputField} px-3 text-sm`}
      />
      <div className="flex gap-3 flex-wrap">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm [color-scheme:dark]`}
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm [color-scheme:dark]`}
        />
        <input
          type="number"
          min="0.5"
          step="0.5"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
          placeholder="Duration (hrs)"
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
        />
      </div>
      <div className="flex gap-3 flex-wrap">
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
      {formError && <p className="text-red-400 text-xs">{formError}</p>}
      <button type="submit" disabled={isSubmitting} className={`h-10 ${t.btnPrimary} text-sm`}>
        {isSubmitting ? "Sending…" : "Request Booking"}
      </button>
    </form>
  );
}
