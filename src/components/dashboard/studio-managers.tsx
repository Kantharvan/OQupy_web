"use client";
import { useEffect, useState } from "react";
import {
  addManager,
  getManagers,
  removeManager,
  getStudioActivity,
  type Manager,
  type Activity,
} from "@/lib/api/studio-management";
export function StudioManagers({ studioId }: { studioId: string }) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([getManagers(studioId), getStudioActivity(studioId)])
      .then(([people, log]) => {
        if (active) {
          setManagers(people);
          setActivity(log.data);
          setError("");
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load studio managers. Close and reopen to retry.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studioId, revision]);
  async function change(userId?: string) {
    setBusy(true);
    setError("");
    try {
      if (userId) await removeManager(studioId, userId);
      else await addManager(studioId, email.trim());
      setEmail("");
      setRevision((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update access");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="p-4 border-t border-border">
      <h3>Studio managers</h3>
      <p>
        Managers can review booking requests and manage unavailable times for
        this studio. Listing details, pricing, confirmed-booking cancellations
        and access remain with you.
      </p>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading managers…</p>
      ) : (
        <>
          <ul>
            {managers.map((m) => (
              <li key={m.userId} className="action-row">
                <span>
                  {m.user.name} · {m.user.email}
                </span>
                <button
                  className="button-secondary"
                  disabled={busy}
                  onClick={() => change(m.userId)}
                >
                  Remove {m.user.name}
                </button>
              </li>
            ))}
          </ul>
          {!managers.length && <p>No managers assigned.</p>}
          <form
            className="flex flex-wrap gap-3 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void change();
            }}
          >
            <label>
              Manager email
              <input
                className="form-input"
                aria-label="Manager email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <button className="button-primary" disabled={busy || !email.trim()}>
              {busy ? "Saving…" : "Assign manager"}
            </button>
          </form>
          <p>
            The person must already have an active account and have completed
            onboarding.
          </p>
          <details className="mt-4">
            <summary>Recent studio activity</summary>
            <ul>
              {activity.map((a) => (
                <li key={a.id}>
                  {(
                    {
                      "manager.assign": "Manager assigned",
                      "manager.remove": "Manager removed",
                      "booking.confirm": "Booking approved",
                      "booking.cancel": "Booking cancelled or rejected",
                      "blockout.create": "Unavailable time added",
                      "blockout.update": "Unavailable time updated",
                      "blockout.remove": "Unavailable time removed",
                    } as Record<string, string>
                  )[a.action] || "Studio updated"}{" "}
                  · {a.actor?.name || "Former account"} ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
            {!activity.length && <p>No activity recorded yet.</p>}
          </details>
        </>
      )}
    </section>
  );
}
