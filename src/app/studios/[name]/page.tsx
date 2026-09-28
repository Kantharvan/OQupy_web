"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getStudioByName, type Studio } from "@/lib/api/studios";
import { SiteHeader } from "@/components/ui/site-header";
import { StudioImage } from "@/components/studios/studio-card";
import { PublicEventsSection } from "@/components/studios/public-events";
import { BookingPanel } from "@/components/booking/booking-panel";

function StudioDetail() {
  const params = useParams<{ name: string }>();
  const name = decodeURIComponent(params.name);
  const { user } = useAuth();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getStudioByName(name)
      .then((data) => {
        if (active) setStudio(data);
      })
      .catch(() => {
        if (active)
          setError(
            "We couldn’t load this studio. Please return to the studios and try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [name]);
  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <Link href="/studios" className="back-link">
          ← Explore all studios
        </Link>
        {error ? (
          <p role="alert" className="empty-state">
            {error}
          </p>
        ) : !studio ? (
          <div role="status" className="empty-state">
            Loading your space…
          </div>
        ) : (
          <div className="detail-grid">
            <article>
              <p className="eyebrow">
                {studio.type.join(" · ") || "A space to create"}
              </p>
              <h1 className="detail-title">{studio.name}</h1>
              <p className="mb-6 text-stone-300">{studio.location}</p>
              <StudioImage studio={studio} large />
              <section className="detail-section">
                <h2>Room for your next idea</h2>
                <p>
                  {studio.description ||
                    "Explore the available times and amenities to plan your next session."}
                </p>
              </section>
              {studio.amenities.length > 0 && (
                <section className="detail-section">
                  <h2>What’s in the space</h2>
                  <ul className="amenities-grid">
                    {studio.amenities.map((a) => (
                      <li key={a}>
                        <span aria-hidden="true" className="text-orange-300">
                          ✓
                        </span>{" "}
                        {a}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {studio.instructors.some((i) => i.name?.trim()) && (
                <section className="detail-section">
                  <h2>Meet the instructors</h2>
                  <ul className="flex flex-wrap gap-3">
                    {studio.instructors
                      .filter((i) => i.name?.trim())
                      .map((i) => (
                        <li className="tag" key={i.id}>
                          {i.name}
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              <section className="detail-section">
                <h2>Before you book</h2>
                <p>
                  Bookings are requests and need approval.{" "}
                  {studio.cancellationPolicy > 0
                    ? `The listed cancellation notice is ${studio.cancellationPolicy} hours. `
                    : ""}
                  Review the details before confirming your session.
                </p>
              </section>
              {user?.role === "student" && (
                <PublicEventsSection studioId={studio.id} />
              )}
            </article>
            <BookingPanel key={studio.id} studio={studio} />
          </div>
        )}
      </main>
    </>
  );
}
export default function StudioDetailPage() {
  return (
    <Suspense>
      <StudioDetail />
    </Suspense>
  );
}
