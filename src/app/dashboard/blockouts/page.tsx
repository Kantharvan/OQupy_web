"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import { PageHeading } from "@/components/ui/page-heading";
import { BlockoutsPanel } from "@/components/dashboard/blockouts-panel";
import Link from "next/link";
function AvailabilityContent() {
  const { user } = useAuth();
  const initial = useSearchParams().get("studioId");
  const [studios, setStudios] = useState<Studio[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
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
        }
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn’t load your studios. Please refresh to try again.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, initial]);
  return (
    <>
      <PageHeading
        eyebrow="YOUR SCHEDULE"
        title="Make room. Take a break."
        description="Manage unavailable times, maintenance and recurring breaks for your spaces. Timed entries use IST."
      />
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status" className="empty-state">
          Loading your spaces…
        </p>
      ) : studios.length ? (
        <>
          <label className="form-field studio-filter">
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
          <BlockoutsPanel key={selected} studioId={selected} />
        </>
      ) : (
        !error && (
          <div className="empty-state">
            <h3>First, add your space.</h3>
            <p>Your studio’s unavailable times will live here.</p>
            <Link href="/dashboard/studios" className="button-primary">
              Add a studio
            </Link>
          </div>
        )
      )}
    </>
  );
}
export default function DashboardBlockoutsPage() {
  return (
    <Suspense>
      <AvailabilityContent />
    </Suspense>
  );
}
