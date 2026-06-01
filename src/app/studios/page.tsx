"use client";

import { useState, useEffect, useCallback } from "react";
import { t } from "@/styles/tokens";
import { getStudios, type Studio, type StudiosQuery } from "@/lib/api/studios";

const PAGE_SIZE = 12;

function StudioCard({ studio }: { studio: Studio }) {
  const cover = studio.images[0];
  return (
    <div className={`${t.cardBox} overflow-hidden flex flex-col hover:border-zinc-600 transition-colors cursor-pointer`}>
      <div className="relative w-full h-44 bg-bg-input flex items-center justify-center overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={studio.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl opacity-30">🏢</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className={`font-semibold text-sm ${t.textPrimary} truncate`}>{studio.name}</h3>
        <p className={`text-xs ${t.textMuted} truncate`}>📍 {studio.location}</p>
        {studio.description && (
          <p className={`text-xs ${t.textSecondary} mt-1 line-clamp-2`}>{studio.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className={`font-bold text-sm ${t.brandText}`}>
            ₹{studio.price}<span className={`text-xs font-normal ${t.textMuted}`}>/hr</span>
          </span>
          {studio.amenities.length > 0 && (
            <span className={`text-xs ${t.textMuted}`}>{studio.amenities.slice(0, 2).join(" · ")}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedLocation(location), 400);
    return () => clearTimeout(id);
  }, [location]);

  const fetchStudios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: StudiosQuery = { page, limit: PAGE_SIZE };
      if (debouncedSearch) query.search = debouncedSearch;
      if (debouncedLocation) query.location = debouncedLocation;
      if (date) query.date = date;
      if (startTime) query.startTime = startTime;
      if (endTime) query.endTime = endTime;
      const res = await getStudios(query);
      setStudios(res.data);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load studios");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, debouncedLocation, date, startTime, endTime]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedLocation, date, startTime, endTime]);

  useEffect(() => {
    fetchStudios();
  }, [fetchStudios]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(debouncedSearch || debouncedLocation || date || startTime || endTime);

  function clearFilters() {
    setSearch("");
    setLocation("");
    setDate("");
    setStartTime("");
    setEndTime("");
  }

  return (
    <main className={`min-h-screen ${t.page} px-4 py-8`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-black tracking-widest ${t.brandText} uppercase`}>OQupy</h1>
          <p className={`mt-1 ${t.textSecondary} text-sm`}>Find your perfect studio space.</p>
        </div>

        {/* Search bar + location */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Search studios…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 h-11 ${t.inputField} px-4`}
          />
          <input
            type="text"
            placeholder="Where? (city, area…)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={`w-full sm:w-52 h-11 ${t.inputField} px-4`}
          />
        </div>

        {/* Date + time row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`flex-1 h-11 ${t.inputField} px-4 [color-scheme:dark]`}
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="Start time"
            className={`flex-1 h-11 ${t.inputField} px-4 [color-scheme:dark]`}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="End time"
            className={`flex-1 h-11 ${t.inputField} px-4 [color-scheme:dark]`}
          />
        </div>

        {/* Results count + clear */}
        {!isLoading && !error && (
          <div className="flex items-center gap-3 mb-4">
            <p className={`text-xs ${t.textMuted}`}>
              {total === 0
                ? hasFilters ? "No studios match your filters." : "No studios yet."
                : `${total} studio${total !== 1 ? "s" : ""}${hasFilters ? " found" : ""}`}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className={`text-xs ${t.link} underline underline-offset-2`}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button onClick={fetchStudios} className={`h-10 px-6 ${t.btnPrimary}`}>Retry</button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${t.cardBox} overflow-hidden animate-pulse`}>
                <div className="w-full h-44 bg-bg-input" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-3.5 bg-bg-input rounded w-3/4" />
                  <div className="h-3 bg-bg-input rounded w-1/2" />
                  <div className="h-3 bg-bg-input rounded w-full mt-1" />
                  <div className="h-3 bg-bg-input rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && studios.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {studios.map((studio) => (
              <StudioCard key={studio.id} studio={studio} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`h-9 px-4 rounded-xl border text-sm ${t.borderInput} ${t.textSecondary} disabled:opacity-30 hover:border-zinc-500 transition-colors`}
            >
              ← Prev
            </button>
            <span className={`text-sm ${t.textMuted}`}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`h-9 px-4 rounded-xl border text-sm ${t.borderInput} ${t.textSecondary} disabled:opacity-30 hover:border-zinc-500 transition-colors`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
