"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getOwnerStudios,
  createStudio,
  updateStudio,
  type Studio,
  type StudioType,
  type CreateStudioDto,
  type OperationalHours,
} from "@/lib/api/studios";
import { PageHeading } from "@/components/ui/page-heading";
import { StudioImage } from "@/components/studios/studio-card";
import { BlockoutsPanel } from "@/components/dashboard/blockouts-panel";
import { TimeSelect } from "@/components/ui/time-select";
import { priceLabel } from "@/lib/booking/price";
import { t } from "@/styles/tokens";

const STUDIO_TYPES: StudioType[] = ["Dance", "Fitness", "Music", "Art", "Yoga"];

const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
type WeekDay = (typeof WEEK_DAYS)[number];

function defaultHours(): OperationalHours {
  return Object.fromEntries(
    WEEK_DAYS.map((d) => [d, { open: "08:00", close: "22:00" }]),
  );
}

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

  useEffect(() => {
    load();
  }, [load]);

  // One studio per owner for now.
  const studio = studios[0];

  return (
    <div>
      <PageHeading
        eyebrow="YOUR SPACES"
        title="A home for your studio."
        description="Shape your listing, set your hours and welcome your next guests."
        action={
          !isLoading &&
          !studio && (
            <button
              type="button"
              className="button-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancel" : "Add a studio ↗"}
            </button>
          )
        }
      />
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
          <p className={`text-sm ${t.textMuted}`}>
            Add your studio to start accepting bookings.
          </p>
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
  const [imageUrl, setImageUrl] = useState(studio?.images[0] ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hours, setHours] = useState<OperationalHours>(
    studio?.operationalHours ?? defaultHours(),
  );
  const [sameAllDays, setSameAllDays] = useState(true);

  function setDayHours(day: WeekDay, field: "open" | "close", value: string) {
    if (sameAllDays) {
      setHours(
        Object.fromEntries(
          WEEK_DAYS.map((d) => [d, { ...hours[d], [field]: value }]),
        ),
      );
    } else {
      setHours((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: value },
      }));
    }
  }

  function toggleType(type: StudioType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    );
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
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        operationalHours: hours,
      };
      if (isEditing) {
        await updateStudio(studio.name, dto);
      } else {
        await createStudio(dto);
      }
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditing ? "save" : "create"} studio`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card studio-form">
      <input
        type="text"
        aria-label="Studio name"
        placeholder="Studio name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={`h-10 ${t.inputField} px-3 text-sm`}
      />
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          aria-label="Location"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className={`flex-1 h-10 ${t.inputField} px-3 text-sm`}
        />
        <input
          type="text"
          aria-label="Price per hour (₹)"
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
            aria-pressed={types.includes(type)}
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
        aria-label="Description (optional)"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className={`${t.inputField} px-3 py-2 text-sm resize-none`}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className={`text-xs ${t.textMuted}`}>Operating hours</label>
          <button
            type="button"
            onClick={() => setSameAllDays((v) => !v)}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              sameAllDays
                ? "border-brand bg-brand-btn text-white"
                : `${t.borderInput} ${t.textSecondary} hover:border-zinc-500`
            }`}
          >
            {sameAllDays ? "Same every day" : "Per day"}
          </button>
        </div>
        {sameAllDays ? (
          <div className="hours-row">
            <span className={`text-xs ${t.textSecondary} w-16`}>All days</span>
            <TimeSelect
              label="Opening time"
              value={hours["monday"]?.open ?? "08:00"}
              onChange={(value) => setDayHours("monday", "open", value)}
            />
            <span className={`text-xs ${t.textMuted}`}>to</span>
            <TimeSelect
              label="Closing time"
              value={hours["monday"]?.close ?? "22:00"}
              onChange={(value) => setDayHours("monday", "close", value)}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="hours-row">
                <span className={`text-xs ${t.textSecondary} w-16 capitalize`}>
                  {day.slice(0, 3)}
                </span>
                <TimeSelect
                  label={`${day} opening time`}
                  value={hours[day]?.open ?? "08:00"}
                  onChange={(value) => setDayHours(day, "open", value)}
                />
                <span className={`text-xs ${t.textMuted}`}>to</span>
                <TimeSelect
                  label={`${day} closing time`}
                  value={hours[day]?.close ?? "22:00"}
                  onChange={(value) => setDayHours(day, "close", value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs ${t.textMuted}`}>
          Cover image URL (optional)
        </label>
        <input
          type="url"
          aria-label="Cover image URL"
          placeholder="https://…"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className={`h-10 ${t.inputField} px-3 text-sm`}
        />
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-32 object-cover rounded-xl mt-1"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      {formError && <p className="text-red-400 text-xs">{formError}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`h-10 ${t.btnPrimary} text-sm flex-1`}
        >
          {isSubmitting
            ? isEditing
              ? "Saving…"
              : "Creating…"
            : isEditing
              ? "Save Changes"
              : "Create Studio"}
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

function StudioPanel({
  studio,
  onUpdated,
}: {
  studio: Studio;
  onUpdated: () => void;
}) {
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
    <div className="surface-card managed-studio">
      {/* Approval status banner */}
      {studio.approvalStatus === "pending" && (
        <div className="px-4 py-3 bg-yellow-500/10 border-b border-yellow-500/20 flex items-start gap-2">
          <span className="text-yellow-400 text-sm shrink-0">⏳</span>
          <div>
            <p className={`text-sm font-medium text-yellow-300`}>
              Pending review
            </p>
            <p className={`text-xs text-yellow-400/80 mt-0.5`}>
              Your studio is under review. It will be visible to users once
              approved.
            </p>
          </div>
        </div>
      )}
      {studio.approvalStatus === "rejected" && (
        <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 flex items-start gap-2">
          <span className="text-red-400 text-sm shrink-0">✗</span>
          <div>
            <p className={`text-sm font-medium text-red-300`}>Not approved</p>
            {studio.approvalReason && (
              <p className={`text-xs text-red-400/80 mt-0.5`}>
                Reason: {studio.approvalReason}
              </p>
            )}
            <p className={`text-xs text-red-400/60 mt-0.5`}>
              Update your studio details and contact support to re-submit.
            </p>
          </div>
        </div>
      )}

      <StudioImage studio={studio} large />
      <div className="managed-studio-body">
        <div>
          <p className="eyebrow">{studio.type.join(" / ")}</p>
          <h2>{studio.name}</h2>
          <p className="page-description">{studio.location}</p>
          <strong className="text-brand">{priceLabel(studio.price)}</strong>
        </div>
        <div className="action-row">
          <button className="button-secondary" onClick={() => setEditing(true)}>
            Edit studio
          </button>
          <button
            className="button-secondary"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide availability" : "Manage availability"}
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
