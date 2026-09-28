"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStudios, type StudiosResponse } from "@/lib/api/studios";
import { SiteHeader } from "@/components/ui/site-header";
import { StudioCard } from "@/components/studios/studio-card";

function StudiosContent() {
  const params = useSearchParams();
  const router = useRouter();
  const search = params.get("search") || "";
  const location = params.get("location") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [result, setResult] = useState<StudiosResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    getStudios({ search, location, page, limit: 12 })
      .then((data) => {
        if (active) {
          setResult(data);
          setError("");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load studios",
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [search, location, page, retry]);

  function navigate(query: URLSearchParams) {
    setLoading(true);
    setError("");
    router.push(`/studios${query.size ? `?${query}` : ""}`, { scroll: false });
    setRetry((n) => n + 1);
  }

  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <section className="browse-intro">
          <div>
            <p className="eyebrow">A little room. Endless possibility.</p>
            <h1 className="hero-title">
              Find your space.
              <br />
              <span>Make it yours.</span>
            </h1>
          </div>
          <p className="intro-copy">
            For rehearsals, quiet practice and your next big idea. Discover a
            studio that fits the way you move.
          </p>
        </section>
        <form
          key={`${search}:${location}`}
          className="search-panel"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const q = new URLSearchParams();
            for (const key of ["search", "location"]) {
              const value = String(data.get(key) || "").trim();
              if (value) q.set(key, value);
            }
            navigate(q);
          }}
        >
          <label className="search-field">
            <span>What are you looking for?</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Studio name or keyword"
            />
          </label>
          <label className="search-field">
            <span>Where?</span>
            <input
              name="location"
              defaultValue={location}
              placeholder="City or neighbourhood"
            />
          </label>
          <button className="button-primary" type="submit">
            Find a studio <span aria-hidden="true">→</span>
          </button>
        </form>
        <div className="section-heading">
          <div>
            <p className="eyebrow">ROOM TO CREATE</p>
            <h2>
              {search || location
                ? "Your search results"
                : "Explore the spaces"}
            </h2>
          </div>
          <p className="text-sm text-stone-400" role="status">
            {loading
              ? "Finding studios…"
              : `${result?.total || 0} ${result?.total === 1 ? "space" : "spaces"} to explore`}
          </p>
        </div>
        {(search || location) && (
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-stone-300">
            <span>
              Showing {search && `“${search}”`}
              {search && location && " in "}
              {location}
            </span>
            <button
              className="text-orange-300 underline underline-offset-4"
              onClick={() => navigate(new URLSearchParams())}
            >
              Clear filters
            </button>
          </div>
        )}
        {error ? (
          <section role="alert" className="empty-state">
            <h3>We couldn’t load the studios</h3>
            <p>Please try again in a moment.</p>
            <button
              className="button-primary"
              onClick={() => {
                setLoading(true);
                setRetry((n) => n + 1);
              }}
            >
              Try again
            </button>
          </section>
        ) : loading ? (
          <div className="studio-grid" aria-label="Loading studios">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : result?.data.length ? (
          <div className="studio-grid">
            {result.data.map((studio) => (
              <StudioCard key={studio.id} studio={studio} />
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <span className="text-4xl text-orange-300" aria-hidden="true">
              ⌕
            </span>
            <h3>
              {search || location
                ? "No spaces match just yet"
                : "New spaces are on their way"}
            </h3>
            <p>
              {search || location
                ? "Try a different neighbourhood or clear your filters to explore all studios."
                : "Check back soon to discover studios near you."}
            </p>
            {(search || location) && (
              <button
                className="button-primary"
                onClick={() => navigate(new URLSearchParams())}
              >
                Explore all studios
              </button>
            )}
          </section>
        )}
        {!loading && !error && result && result.total > 12 && (
          <nav
            aria-label="Results pages"
            className="flex justify-center items-center gap-5 mt-10"
          >
            <button
              className="button-secondary"
              disabled={page === 1}
              onClick={() => {
                const q = new URLSearchParams(params);
                q.set("page", String(page - 1));
                navigate(q);
              }}
            >
              Previous
            </button>
            <span>
              {page} / {Math.ceil(result.total / 12)}
            </span>
            <button
              className="button-secondary"
              disabled={page >= Math.ceil(result.total / 12)}
              onClick={() => {
                const q = new URLSearchParams(params);
                q.set("page", String(page + 1));
                navigate(q);
              }}
            >
              Next
            </button>
          </nav>
        )}
        <footer className="site-footer">
          <span>OQupy — The floor is yours.</span>
          <span>Choose your space. Check a date. Make a request.</span>
        </footer>
      </main>
    </>
  );
}

export default function StudiosPage() {
  return (
    <Suspense>
      <StudiosContent />
    </Suspense>
  );
}
