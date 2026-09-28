"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import {
  getBookingsByStudio,
  getUserBookings,
  type Booking,
} from "@/lib/api/bookings";
import { PageHeading } from "@/components/ui/page-heading";
import { BookingCard } from "@/components/dashboard/booking-card";
import { priceLabel, money } from "@/lib/booking/price";
export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [asOf, setAsOf] = useState(0);
  const owner = user?.role === "studio_owner";
  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        let list: Booking[];
        if (owner) {
          const result = await getOwnerStudios(user!.id, 1, 50);
          if (active) setStudios(result.data);
          list = (
            await Promise.all(
              result.data.map((s) => getBookingsByStudio(s.id, 1, 100)),
            )
          ).flatMap((r) => r.data);
        } else {
          list = (await getUserBookings(user!.id, 1, 50)).data;
        }
        if (active) {
          setAsOf(Date.now());
          setBookings(
            list.sort(
              (a, b) => Date.parse(b.dateTime) - Date.parse(a.dateTime),
            ),
          );
        }
      } catch {
        if (active)
          setError("We couldn’t load your activity. Refresh to try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, owner]);
  const pending = bookings.filter(
    (b) => b.status === "AwaitingApproval",
  ).length;
  const upcoming = bookings.filter(
    (b) => b.status === "Confirmed" && Date.parse(b.dateTime) > asOf,
  ).length;
  const value = bookings
    .filter((b) => b.status === "Confirmed")
    .reduce((sum, b) => sum + (b.paymentAmount || 0), 0);
  return (
    <>
      <PageHeading
        eyebrow={owner ? "YOUR STUDIO, IN MOTION" : "MAKE ROOM FOR WHAT’S NEXT"}
        title={`Welcome back${user?.name ? `, ${user.name.split(" ")[0]}` : ""}.`}
        description={
          owner
            ? "Your spaces, requests and upcoming sessions in one place."
            : "Keep your plans close. Your next session starts here."
        }
        action={
          <Link
            className="button-primary"
            href={owner ? "/dashboard/studios" : "/studios"}
          >
            {owner ? "Manage my studios" : "Find a space"} ↗
          </Link>
        }
      />
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : (
        <>
          <div className="metric-grid">
            <Link href="/dashboard/bookings" className="metric-card">
              <p>UPCOMING SESSIONS</p>
              <strong>{loading ? "—" : upcoming}</strong>
              <span>Confirmed and on your calendar ↗</span>
            </Link>
            <Link href="/dashboard/bookings" className="metric-card">
              <p>AWAITING APPROVAL</p>
              <strong>{loading ? "—" : pending}</strong>
              <span>Requests still in progress ↗</span>
            </Link>
            <div className="metric-card">
              <p>{owner ? "CONFIRMED BOOKING VALUE" : "RECENT BOOKINGS"}</p>
              <strong>
                {loading ? "—" : owner ? money(value) : bookings.length}
              </strong>
              <span>
                {owner
                  ? "Listed amounts · not collected revenue"
                  : "From your latest booking history"}
              </span>
            </div>
          </div>
          <section className="workspace-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">YOUR ACTIVITY</p>
                <h2>Sessions at a glance</h2>
              </div>
              <Link href="/dashboard/bookings" className="text-brand">
                View all →
              </Link>
            </div>
            {loading ? (
              <p role="status" className="empty-state">
                Loading your sessions…
              </p>
            ) : bookings.length ? (
              <div className="session-list">
                {bookings.slice(0, 5).map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Your next chapter starts with a space.</h3>
                <p>
                  New bookings will appear here, from the first request to the
                  final confirmation.
                </p>
                <Link href="/studios" className="button-secondary">
                  Explore studios
                </Link>
              </div>
            )}
          </section>
          {owner && (
            <section className="workspace-section">
              <div className="section-title">
                <h2>Your spaces</h2>
                <Link className="text-brand" href="/dashboard/studios">
                  Manage →
                </Link>
              </div>
              <div className="managed-studio-grid">
                {studios.map((s) => (
                  <Link
                    key={s.id}
                    href="/dashboard/studios"
                    className="surface-card managed-studio-summary"
                  >
                    <span className="eyebrow">{s.type.join(" / ")}</span>
                    <h3>{s.name}</h3>
                    <p>{s.location}</p>
                    <strong>{priceLabel(s.price)}</strong>
                  </Link>
                ))}
              </div>
              {!loading && !studios.length && (
                <div className="empty-state">
                  <h3>Give your space a home.</h3>
                  <Link href="/dashboard/studios" className="button-primary">
                    Add a studio
                  </Link>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
