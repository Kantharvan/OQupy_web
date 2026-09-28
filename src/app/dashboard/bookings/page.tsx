"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import {
  getBookingsByStudio,
  getUserBookings,
  confirmBooking,
  cancelBooking,
  type Booking,
} from "@/lib/api/bookings";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingCard } from "@/components/dashboard/booking-card";
function BookingsContent() {
  const { user } = useAuth();
  const initial = useSearchParams().get("studioId");
  const owner = user?.role === "studio_owner";
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selected, setSelected] = useState(initial || "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [filter, setFilter] = useState("all");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user || !owner) return;
    let active = true;
    getOwnerStudios(user.id)
      .then((r) => {
        if (active) {
          setStudios(r.data);
          setSelected(
            r.data.some((s) => s.id === initial)
              ? initial!
              : r.data[0]?.id || "",
          );
          if (!r.data.length) setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("We couldn’t load your studios.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user, owner, initial, retry]);
  useEffect(() => {
    if (!user || (owner && !selected)) return;
    let active = true;
    const request = owner
      ? getBookingsByStudio(selected, 1, 50)
      : getUserBookings(user.id);
    request
      .then((r) => {
        if (active) {
          setBookings(
            r.data.sort(
              (a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime),
            ),
          );
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError("We couldn’t load your bookings. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, owner, selected, retry]);
  async function decide(id: string, approve: boolean) {
    setActionId(id);
    setError("");
    try {
      const updated = await (approve ? confirmBooking(id) : cancelBooking(id));
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updated } : b)),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update this request. Try again.",
      );
    } finally {
      setActionId("");
    }
  }
  const visible = bookings.filter(
    (b) => filter === "all" || b.status === filter,
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR SESSIONS"
        title={owner ? "Booking requests" : "My bookings"}
        description={
          owner
            ? "Review requests and make room for your next guests."
            : "Every plan, from your first request to your next session."
        }
        action={
          !owner && (
            <Link href="/studios" className="button-primary">
              Book another space ↗
            </Link>
          )
        }
      />
      {owner && studios.length > 0 && (
        <label className="form-field studio-filter">
          Studio
          <select
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value);
              setLoading(true);
              setBookings([]);
            }}
          >
            {studios.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="filter-bar" aria-label="Booking filters">
        {[
          ["all", "All sessions"],
          ["AwaitingApproval", "Awaiting approval"],
          ["Confirmed", "Confirmed"],
          ["Cancelled", "Cancelled"],
        ].map(([value, label]) => (
          <button
            key={value}
            className="filter-pill"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div role="alert" className="notice notice-error">
          {error}
          <button
            className="text-brand underline ml-3"
            onClick={() => {
              setLoading(true);
              setRetry((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <div role="status" className="empty-state">
          Loading your sessions…
        </div>
      ) : visible.length ? (
        <div className="session-list">
          {visible.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              actions={
                owner && b.status === "AwaitingApproval" ? (
                  <div className="action-row">
                    <button
                      className="button-primary"
                      disabled={!!actionId}
                      onClick={() => decide(b.id, true)}
                    >
                      {actionId === b.id ? "Updating…" : "Approve"}
                    </button>
                    <button
                      className="button-danger"
                      disabled={!!actionId}
                      onClick={() => decide(b.id, false)}
                    >
                      Decline
                    </button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-state">
            <p className="eyebrow">ROOM FOR NEW PLANS</p>
            <h3>No sessions here yet.</h3>
            <p>
              {owner
                ? "New booking requests will appear here."
                : "Explore a space you love and choose a time that works for you."}
            </p>
            <Link
              href={owner ? "/dashboard/studios" : "/studios"}
              className="button-secondary"
            >
              {owner ? "Manage studios" : "Explore studios"}
            </Link>
          </div>
        )
      )}
    </>
  );
}
export default function DashboardBookingsPage() {
  return (
    <Suspense>
      <BookingsContent />
    </Suspense>
  );
}
