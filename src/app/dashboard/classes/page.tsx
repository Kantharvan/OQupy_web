"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  getStudentEnrollments,
  unenroll,
  type Enrollment,
} from "@/lib/api/enrollments";
import { PageHeading } from "@/components/ui/page-heading";
import { StatusBadge } from "@/components/dashboard/booking-card";
import { formatSessionDate, durationLabel } from "@/lib/booking/availability";

export default function MyClassesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      const all: Enrollment[] = [];
      let page = 1;
      for (;;) {
        const response = await getStudentEnrollments(user!.id, page, 100);
        if (!active) return;
        all.push(...response.data);
        if (all.length >= response.total || !response.data.length) break;
        page++;
      }
      if (active) {
        setEnrollments(all);
        setError("");
      }
    }
    load()
      .catch(() => {
        if (active)
          setError("We couldn’t load your classes. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, retry]);
  async function withdraw(enrollment: Enrollment) {
    if (
      !user ||
      !window.confirm(`Withdraw from ${enrollment.booking.eventName}?`)
    )
      return;
    setBusy(enrollment.id);
    setError("");
    setNotice("");
    try {
      await unenroll(enrollment.bookingId, user.id);
      setEnrollments((items) =>
        items.filter((item) => item.id !== enrollment.id),
      );
      setNotice("You’ve withdrawn from the class.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not withdraw. Please try again.",
      );
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR LEARNING"
        title="My classes"
        description="Classes you’ve joined, with their latest status."
      />
      {error && (
        <div className="notice notice-error" role="alert">
          {error}{" "}
          <button
            className="button-secondary"
            onClick={() => {
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {notice && (
        <p className="notice notice-success" role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="empty-state" role="status">
          Loading your classes…
        </p>
      ) : enrollments.length ? (
        <div className="session-list">
          {enrollments.map((enrollment) => (
            <article className="session-card" key={enrollment.id}>
              <div className="session-content">
                <div className="session-title">
                  <h2>{enrollment.booking.eventName}</h2>
                  <StatusBadge status={enrollment.booking.status} />
                </div>
                <p>{enrollment.booking.studio.name}</p>
                <p className="session-meta">
                  {formatSessionDate(enrollment.booking.dateTime)} IST ·{" "}
                  {durationLabel(enrollment.booking.durationHours)}
                </p>
              </div>
              <div className="session-actions">
                <button
                  className="button-danger"
                  disabled={!!busy}
                  onClick={() => withdraw(enrollment)}
                >
                  {busy === enrollment.id ? "Withdrawing…" : "Withdraw"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <h2>No class enrollments yet.</h2>
            <Link className="button-primary" href="/studios">
              Explore classes
            </Link>
          </div>
        )
      )}
    </>
  );
}
