"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, createStudio, updateStudio, type Studio, type StudioType, type CreateStudioDto } from "@/lib/api/studios";
import { getBlockoutsByStudio, createBlockout, deleteBlockout, type Blockout, type CreateBlockoutDto } from "@/lib/api/blockouts";
import { t } from "@/styles/tokens";

const STUDIO_TYPES: StudioType[] = ["Dance", "Fitness", "Music", "Art", "Yoga"];

export default function DashboardStudiosPage() {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    if (!user) return;
    getOwnerStudios(user.id)
      .then((res) => setStudios(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // One studio per owner for now.
  const studio = studios[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${t.textPrimary}`}>My Studio</h2>
          <p className={`text-sm ${t.textMuted} mt-0.5`}>Manage your listed studio.</p>
        </div>
        {!isLoading && !studio && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className={`h-10 px-5 ${t.btnPrimary} text-sm`}
          >
            {showForm ? "Cancel" : "+ Add Studio"}
          </button>
        )}
      </div>

      {showForm && !studio && (
        <StudioForm
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {isLoading ? (
        <div className={`${t.cardBox} h-32 animate-pulse`} />
      ) : !studio ? (
        <div className={`${t.cardBox} p-10 text-center`}>
          <div className="w-16 h-16 rounded-xl bg-bg-input mx-auto mb-3" />
          <p className={`${t.textPrimary} font-semibold mb-1`}>No studio yet</p>
          <p className={`text-sm ${t.textMuted}`}>Add your studio to start accepting bookings.</p>
        </div>
      ) : (
        <StudioPanel studio={studio} onUpdated={load} />
      )}
    </div>
  );
}

function StudioForm({
  studio,
  onSaved,
  onCancel,
}: {
  studio?: Studio;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const isEditing = !!studio;
  const [name, setName] = useState(studio?.name ?? "");
  const [location, setLocation] = useState(studio?.location ?? "");
  const [price, setPrice] = useState(studio?.price ?? "");
  const [types, setTypes] = useState<StudioType[]>(studio?.type ?? []);
  const [description, setDescription] = useState(studio?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleType(type: StudioType) {
    setTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !location || !price || types.length === 0) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const dto: CreateStudioDto = {
        name,
        location,
        price,
        type: types,
        description: description || undefined,
      };
      if (isEditing) {
        await updateStudio(studio.name, dto);
      } else {
        await createStudio(dto);
      }
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : `Failed to ${isEditing ? "save" : "create"} studio`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`${t.cardBox} flex flex-col gap-3 p-4 mb-6`}>
      <input
        type="text"
        placeholder="Studio name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={`h-10 ${t.inputField} px-3 text-sm`}
      />
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
        />
        <input
          type="text"
          placeholder="Price per hour (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {STUDIO_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleType(type)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors ${
              types.includes(type)
                ? "border-brand bg-brand-btn text-white"
                : `${t.borderInput} ${t.textSecondary} hover:border-zinc-500`
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={`${t.inputField} px-3 py-2 text-sm resize-none`}
      />
      {formError && <p className="text-red-400 text-xs">{formError}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className={`h-10 ${t.btnPrimary} text-sm flex-1`}>
          {isSubmitting ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save Changes" : "Create Studio"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`h-10 px-4 rounded-xl border text-sm ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors`}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function StudioPanel({ studio, onUpdated }: { studio: Studio; onUpdated: () => void }) {
  const cover = studio.images[0];
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <StudioForm
        studio={studio}
        onSaved={() => {
          setEditing(false);
          onUpdated();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

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
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors`}
          >
            {expanded ? "Hide blockouts ↑" : "Blockouts ↓"}
          </button>
        </div>
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

  const [, startTransition] = useTransition();
  useEffect(() => { startTransition(() => { load(); }); }, [load]);

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
