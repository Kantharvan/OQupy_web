"use client";
import { useEffect, useState } from "react";
import { getAssignedStudios } from "@/lib/api/studio-management";
import type { Studio } from "@/lib/api/studios";
import {
  getBookingsByStudio,
  confirmBooking,
  cancelBooking,
  type Booking,
} from "@/lib/api/bookings";
import { BlockoutsPanel } from "@/components/dashboard/blockouts-panel";
import { BookingCard } from "@/components/dashboard/booking-card";
import { PageHeading } from "@/components/ui/page-heading";
export default function ManagedStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const all: Studio[] = [];
        for (let page = 1; active; page++) {
          const result = await getAssignedStudios(page);
          all.push(...result.data);
          if (!result.data.length || all.length >= result.total) break;
        }
        if (active) {
          setStudios(all);
          setSelected(all[0]?.id || "");
        }
      } catch {
        if (active)
          setError("Could not load assigned studios. Refresh to try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="STUDIO MANAGEMENT"
        title="Managed studios"
        description="Review booking requests and manage availability for studios assigned to you."
      />
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading assigned studios…</p>
      ) : !error && !studios.length ? (
        <p>
          No studios assigned. Ask the studio owner to add your account as a
          manager.
        </p>
      ) : null}
      {!!studios.length && (
        <>
          <label className="form-field">
            Studio
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {studios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <ManagerWorkspace key={selected} studioId={selected} />
        </>
      )}
    </>
  );
}
function ManagerWorkspace({ studioId }: { studioId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    getBookingsByStudio(studioId, page, 20)
      .then((r) => {
        if (active) {
          setBookings(r.data);
          setTotal(r.total);
          setError("");
        }
      })
      .catch(() => {
        if (active) {
          setBookings([]);
          setError(
            "Could not load bookings. Your studio access may have changed.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studioId, page, revision]);
  async function decide(id: string, approve: boolean) {
    setBusy(id);
    setError("");
    try {
      await (approve ? confirmBooking(id) : cancelBooking(id));
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update booking");
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="flex flex-col gap-6 mt-6">
      <section>
        <h2>Booking requests</h2>
        {error && <p role="alert">{error}</p>}
        {loading ? (
          <p role="status">Loading bookings…</p>
        ) : (
          <>
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                actions={
                  b.status === "AwaitingApproval" ? (
                    <>
                      <button
                        className="button-primary"
                        disabled={!!busy}
                        onClick={() => decide(b.id, true)}
                      >
                        Approve
                      </button>
                      <button
                        className="button-secondary"
                        disabled={!!busy}
                        onClick={() => decide(b.id, false)}
                      >
                        Reject
                      </button>
                    </>
                  ) : undefined
                }
              />
            ))}
            {!bookings.length && !error && <p>No bookings yet.</p>}
            <div className="action-row">
              <button
                disabled={page === 1}
                onClick={() => {
                  setLoading(true);
                  setPage(page - 1);
                }}
              >
                Previous bookings
              </button>
              <span>Page {page}</span>
              <button
                disabled={page * 20 >= total}
                onClick={() => {
                  setLoading(true);
                  setPage(page + 1);
                }}
              >
                Next bookings
              </button>
            </div>
          </>
        )}
      </section>
      <section>
        <h2>Unavailable times</h2>
        <BlockoutsPanel studioId={studioId} />
      </section>
    </div>
  );
}
