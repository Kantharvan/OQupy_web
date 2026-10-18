"use client";
import { useEffect, useState } from "react";
import { getPublicClasses, type PublicClass } from "@/lib/api/bookings";
import { enroll, getStudentEnrollments } from "@/lib/api/enrollments";
import { useAuth } from "@/context/AuthContext";
import { formatSessionDate, durationLabel } from "@/lib/booking/availability";
import { t } from "@/styles/tokens";
export function PublicEventsSection({ studioId }: { studioId: string }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<PublicClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const studentId = user.id;
    let active = true;
    async function load() {
      try {
        const classes = await getPublicClasses(studioId);
        const ids = new Set<string>();
        let page = 1;
        let fetched = 0;
        // Enrollment history is paginated independently of the public class list.
        while (active) {
          const result = await getStudentEnrollments(studentId, page, 100);
          result.data.forEach((enrollment) => ids.add(enrollment.bookingId));
          fetched += result.data.length;
          if (!result.data.length || fetched >= result.total) break;
          page++;
        }
        if (!active) return;
        setEnrolledIds(ids);
        setEvents(classes.data.filter((b) =>
          b.bookingType === "instructor_event" && b.isPublic &&
          b.status === "Confirmed" && new Date(b.dateTime) > new Date(),
        ).sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime)));
      } catch {
        if (active) setErrors({ load: "Classes or enrollment status could not be loaded. Please refresh to try again." });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [studioId, user]);

  async function handleEnroll(bookingId: string) {
    setEnrollingId(bookingId);
    setErrors((prev) => {
      const n = { ...prev };
      delete n[bookingId];
      return n;
    });
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

  if (errors.load) return <p role="alert">{errors.load}</p>;
  if (isLoading || events.length === 0) return null;

  return (
    <div className={`${t.cardBox} p-6`}>
      <h2 className={`font-semibold ${t.textPrimary} mb-4`}>
        Upcoming Classes
      </h2>
      <div className="flex flex-col">
        {events.map((ev) => {
          const enrolled = enrolledIds.has(ev.id);
          return (
            <div
              key={ev.id}
              className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0"
            >
              <div className="min-w-0">
                <p className={`text-sm font-medium ${t.textPrimary} truncate`}>
                  {ev.eventName}
                </p>
                <p className={`text-xs ${t.textMuted} mt-0.5`}>
                  {formatSessionDate(ev.dateTime)} IST ·{" "}
                  {durationLabel(ev.durationHours)}
                </p>
                {errors[ev.id] && (
                  <p className="text-red-400 text-xs mt-0.5">{errors[ev.id]}</p>
                )}
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
                {enrolled
                  ? "Enrolled ✓"
                  : enrollingId === ev.id
                    ? "…"
                    : "Enroll"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
