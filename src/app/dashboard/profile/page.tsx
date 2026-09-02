"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api/users";
import { t } from "@/styles/tokens";

const ROLE_LABELS: Record<string, string> = {
  studio_owner: "Studio Owner",
  instructor: "Instructor",
  student: "Student",
  admin: "Admin",
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const updated = await updateUserProfile(user.id, { name: name.trim() || undefined });
      setUser(updated);
      setSavedMsg("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${t.textPrimary}`}>Profile</h2>
        <p className={`text-sm ${t.textMuted} mt-0.5`}>Manage your account details.</p>
      </div>

      <div className={`${t.cardBox} p-6 flex flex-col gap-5`}>
        <div className="flex flex-col gap-1">
          <label className={`text-xs uppercase tracking-wider ${t.textMuted}`}>Role</label>
          <p className={`text-sm font-medium ${t.textPrimary}`}>
            {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : "—"}
          </p>
        </div>

        {user?.email && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs uppercase tracking-wider ${t.textMuted}`}>Email</label>
            <p className={`text-sm ${t.textSecondary}`}>{user.email}</p>
          </div>
        )}

        {user?.phone && (
          <div className="flex flex-col gap-1">
            <label className={`text-xs uppercase tracking-wider ${t.textMuted}`}>Phone</label>
            <p className={`text-sm ${t.textSecondary}`}>{user.phone}</p>
          </div>
        )}

        <div className={`border-t border-border`} />

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs uppercase tracking-wider ${t.textMuted}`}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className={`h-10 ${t.inputField} px-3 text-sm`}
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {savedMsg && <p className="text-green-400 text-xs">{savedMsg}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className={`h-10 ${t.btnPrimary} text-sm self-start px-6`}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
