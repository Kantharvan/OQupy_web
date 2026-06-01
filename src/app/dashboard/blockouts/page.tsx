"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import { getBlockoutsByStudio, createBlockout, deleteBlockout, type Blockout, type CreateBlockoutDto } from "@/lib/api/blockouts";
import { t } from "@/styles/tokens";

function DashboardBlockoutsContent() {
  const searchParams = useSearchParams();
  const preselectedStudioId = searchParams.get("studioId");
  const { user } = useAuth();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<string>("");
  const [blockouts, setBlockouts] = useState<Blockout[]>([]);
  const [isLoadingStudios, setIsLoadingStudios] = useState(true);
  const [isLoadingBlockouts, setIsLoadingBlockouts] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [durationHours, setDurationHours] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOwnerStudios(user.id)
      .then((res) => {
        setStudios(res.data);
        const initial = preselectedStudioId ?? res.data[0]?.id ?? "";
        setSelectedStudioId(initial);
      })
      .finally(() => setIsLoadingStudios(false));
  }, [user, preselectedStudioId]);

  const loadBlockouts = useCallback(async () => {
    if (!selectedStudioId) return;
    setIsLoadingBlockouts(true);
    try {
      const res = await getBlockoutsByStudio(selectedStudioId, 1, 50);
      setBlockouts(res.data.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()));
    } finally {
      setIsLoadingBlockouts(false);
    }
  }, [selectedStudioId]);

  useEffect(() => { loadBlockouts(); }, [loadBlockouts]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudioId || !eventName || !date) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const dateTimeStr = allDay
        ? new Date(`${date}T00:00:00.000Z`).toISOString()
        : new Date(`${date}T${startTime}:00.000Z`).toISOString();

      const dto: CreateBlockoutDto = {
        studioId: selectedStudioId,
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${t.textPrimary}`}>Blockouts</h2>
          <p className={`text-sm ${t.textMuted} mt-0.5`}>Mark dates your studio is unavailable.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`h-10 px-5 ${t.btnPrimary} text-sm`}
        >
          {showForm ? "Cancel" : "+ Add Blockout"}
        </button>
      </div>

      {/* Studio selector */}
      {!isLoadingStudios && studios.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {studios.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStudioId(s.id)}
              className={`px-4 h-9 rounded-xl text-sm font-medium border transition-colors ${
                selectedStudioId === s.id
                  ? "bg-brand-btn text-white border-transparent"
                  : `${t.borderInput} ${t.textSecondary} hover:border-zinc-500`
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Add blockout form */}
      {showForm && (
        <div className={`${t.cardBox} p-5 mb-6`}>
          <h3 className={`font-semibold ${t.textPrimary} mb-4`}>New Blockout</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Reason (e.g. Maintenance, Private event)"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
              className={`h-11 ${t.inputField} px-4`}
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`flex-1 h-11 ${t.inputField} px-4 [color-scheme:dark]`}
              />
              <label className={`flex items-center gap-2 text-sm ${t.textSecondary} px-2`}>
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
                  className={`flex-1 h-11 ${t.inputField} px-4 [color-scheme:dark]`}
                />
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="Duration (hrs)"
                  className={`flex-1 h-11 ${t.inputField} px-4`}
                />
              </div>
            )}
            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`h-11 ${t.btnPrimary} text-sm`}
            >
              {isSubmitting ? "Saving…" : "Save Blockout"}
            </button>
          </form>
        </div>
      )}

      {/* List */}
      {isLoadingBlockouts ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${t.cardBox} h-16 animate-pulse`} />
          ))}
        </div>
      ) : blockouts.length === 0 ? (
        <div className={`${t.cardBox} p-10 text-center`}>
          <p className="text-4xl mb-3">🚫</p>
          <p className={`${t.textPrimary} font-semibold`}>No blockouts</p>
          <p className={`text-sm ${t.textMuted} mt-1`}>Your studio is open for all dates.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {blockouts.map((b) => (
            <div key={b.id} className={`${t.cardBox} p-4 flex items-center justify-between gap-4`}>
              <div>
                <p className={`font-medium text-sm ${t.textPrimary}`}>{b.eventName}</p>
                <p className={`text-xs ${t.textMuted} mt-0.5`}>
                  {new Date(b.dateTime).toLocaleDateString()}
                  {b.allDay ? " · All day" : ` · ${b.durationHours}h`}
                  {b.recurringType !== "none" && ` · Repeats ${b.recurringType.replace("_", "-")}`}
                </p>
              </div>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={deletingId === b.id}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors disabled:opacity-50`}
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

export default function DashboardBlockoutsPage() {
  return (
    <Suspense>
      <DashboardBlockoutsContent />
    </Suspense>
  );
}
