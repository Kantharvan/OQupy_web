"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import { getBlockoutsByStudio, createBlockout, deleteBlockout, type Blockout, type CreateBlockoutDto } from "@/lib/api/blockouts";
import { t } from "@/styles/tokens";

export default function DashboardStudiosPage() {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOwnerStudios(user.id)
      .then((res) => setStudios(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${t.textPrimary}`}>My Studios</h2>
          <p className={`text-sm ${t.textMuted} mt-0.5`}>Manage your listed studios.</p>
        </div>
        <button type="button" className={`h-10 px-5 ${t.btnPrimary} text-sm`} disabled>
          + Add Studio
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className={`${t.cardBox} h-32 animate-pulse`} />
          ))}
        </div>
      ) : studios.length === 0 ? (
        <div className={`${t.cardBox} p-10 text-center`}>
          <div className="w-16 h-16 rounded-xl bg-bg-input mx-auto mb-3" />
          <p className={`${t.textPrimary} font-semibold mb-1`}>No studios yet</p>
          <p className={`text-sm ${t.textMuted}`}>Add your first studio to start accepting bookings.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {studios.map((studio) => (
            <StudioPanel key={studio.id} studio={studio} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudioPanel({ studio }: { studio: Studio }) {
  const cover = studio.images[0];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`${t.cardBox} overflow-hidden`}>
      {/* Studio header row */}
      <div className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-bg-input overflow-hidden shrink-0 flex items-center justify-center">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={studio.name} className="w-full h-full object-cover" />
            : <span className={`text-xs ${t.textMuted}`}>No image</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${t.textPrimary} truncate`}>{studio.name}</p>
          <p className={`text-xs ${t.textMuted} mt-0.5`}>📍 {studio.location}</p>
          <p className={`text-xs ${t.textMuted}`}>{studio.type.join(", ")} · ₹{studio.price}/hr</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 h-8 px-3 rounded-lg border text-xs font-medium ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors`}
        >
          {expanded ? "Hide blockouts ↑" : "Blockouts ↓"}
        </button>
      </div>

      {/* Blockouts section */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-4">
          <BlockoutsPanel studioId={studio.id} />
        </div>
      )}
    </div>
  );
}

function BlockoutsPanel({ studioId }: { studioId: string }) {
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [durationHours, setDurationHours] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getBlockoutsByStudio(studioId, 1, 50);
      setBlockouts(res.data.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    } finally {
      setIsLoading(false);
    }
  }, [studioId]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !date) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const dateTimeStr = allDay
        ? new Date(`${date}T00:00:00.000Z`).toISOString()
        : new Date(`${date}T${startTime}:00.000Z`).toISOString();
      const dto: CreateBlockoutDto = {
        studioId,
        eventName,
        dateTime: dateTimeStr,
        allDay,
        durationHours: allDay ? 24 : Number(durationHours),
      };
      const created = await createBlockout(dto);
      setBlockouts((prev) => [...prev, created].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
      setShowForm(false);
      setEventName("");
      setDate("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create blockout");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteBlockout(id);
      setBlockouts((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-semibold ${t.textPrimary}`}>Blockouts</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={`h-8 px-3 ${t.btnPrimary} text-xs`}
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="flex flex-col gap-3 mb-4 p-4 rounded-xl bg-bg-input">
          <input
            type="text"
            placeholder="Reason (e.g. Maintenance, Private event)"
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
            <label className={`flex items-center gap-2 text-sm ${t.textSecondary}`}>
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="accent-orange-500"
              />
              All day
            </label>
          </div>
          {!allDay && (
            <div className="flex gap-3">
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
          )}
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <button type="submit" disabled={isSubmitting} className={`h-10 ${t.btnPrimary} text-sm`}>
            {isSubmitting ? "Saving…" : "Save Blockout"}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 bg-bg-input rounded-xl animate-pulse" />
          ))}
        </div>
      ) : blockouts.length === 0 ? (
        <p className={`text-sm ${t.textMuted} py-2`}>No blockouts — studio is open for all dates.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {blockouts.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 py-2 border-b border-border last:border-0">
              <div>
                <p className={`text-sm font-medium ${t.textPrimary}`}>{b.eventName}</p>
                <p className={`text-xs ${t.textMuted}`}>
                  {new Date(b.dateTime).toLocaleDateString()}
                  {b.allDay ? " · All day" : ` · ${b.durationHours}h`}
                  {b.recurringType !== "none" && ` · Repeats ${b.recurringType.replace("_", "-")}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(b.id)}
                disabled={deletingId === b.id}
                className="shrink-0 h-7 px-3 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors disabled:opacity-50"
              >
                {deletingId === b.id ? "…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
