"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api/users";
import { PageHeading } from "@/components/ui/page-heading";
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      setUser(await updateUserProfile(user.id, { name: name.trim() }));
      setMessage("Your profile has been updated.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR ACCOUNT"
        title="Make yourself at home."
        description="Keep your details up to date, so every session starts smoothly."
      />
      <div className="profile-grid">
        <section className="surface-card profile-summary">
          <span className="avatar avatar-large">
            {(user?.name || "O").slice(0, 1).toUpperCase()}
          </span>
          <h2>{user?.name || "Your profile"}</h2>
          <p className="tag">{user?.role?.replace("_", " ")}</p>
          <dl>
            {user?.email && (
              <>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </>
            )}
            {user?.phone && (
              <>
                <dt>Phone</dt>
                <dd>{user.phone}</dd>
              </>
            )}
          </dl>
        </section>
        <section className="surface-card profile-form">
          <p className="eyebrow">THE BASICS</p>
          <h2>Personal details</h2>
          <p className="page-description">
            This is how your name appears on bookings and requests.
          </p>
          <form onSubmit={save}>
            <label className="form-field">
              Display name
              <input
                required
                autoComplete="name"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="notice notice-error">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="notice notice-success">
                {message}
              </p>
            )}
            <button
              className="button-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
