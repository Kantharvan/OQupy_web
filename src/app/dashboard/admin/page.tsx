"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPendingStudios, approveStudio, getUsers, setUserRole, type PendingStudio, type AdminUser } from "@/lib/api/admin";
import { type User } from "@/lib/api/auth";
import { t } from "@/styles/tokens";

const ROLE_OPTIONS: NonNullable<User["role"]>[] = ["student", "instructor", "studio_owner", "admin"];

export default function DashboardAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [tab, setTab] = useState<"studios" | "users">("studios");

  if (isAuthLoading) return null;

  if (user?.role !== "admin") {
    return (
      <div className={`${t.cardBox} p-10 text-center`}>
        <p className={`${t.textPrimary} font-semibold`}>Not authorized</p>
        <p className={`text-sm ${t.textMuted} mt-1`}>This page is for admins only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("studios")}
          className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === "studios" ? `bg-bg-input ${t.textPrimary}` : `${t.textSecondary} hover:bg-bg-input`
          }`}
        >
          Pending Studios
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
            tab === "users" ? `bg-bg-input ${t.textPrimary}` : `${t.textSecondary} hover:bg-bg-input`
          }`}
        >
          Users
        </button>
      </div>

      {tab === "studios" ? <PendingStudiosPanel /> : <UsersPanel />}
    </div>
  );
}

function PendingStudiosPanel() {
  const [studios, setStudios] = useState<PendingStudio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    getPendingStudios()
      .then((res) => setStudios(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDecision(id: string, approvalStatus: "approved" | "rejected") {
    setActionId(id);
    try {
      await approveStudio(id, approvalStatus);
      setStudios((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update studio");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${t.textPrimary}`}>Pending Studios</h2>
        <p className={`text-sm ${t.textMuted} mt-0.5`}>Review and approve or reject studio listings.</p>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${t.cardBox} h-28 animate-pulse`} />
          ))}
        </div>
      ) : studios.length === 0 ? (
        <div className={`${t.cardBox} p-10 text-center`}>
          <p className="text-4xl mb-3">✅</p>
          <p className={`${t.textPrimary} font-semibold`}>No pending studios</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {studios.map((s) => (
            <div key={s.id} className={`${t.cardBox} p-4`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={`font-semibold ${t.textPrimary}`}>{s.name}</p>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>📍 {s.location} · {s.type.join(", ")} · ₹{s.price}/hr</p>
                  <p className={`text-xs ${t.textMuted} mt-1`}>Owner: {s.owner.name} ({s.owner.email})</p>
                  {s.description && <p className={`text-xs ${t.textSecondary} mt-2`}>{s.description}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDecision(s.id, "approved")}
                    disabled={actionId === s.id}
                    className="h-8 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecision(s.id, "rejected")}
                    disabled={actionId === s.id}
                    className="h-8 px-3 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(() => {
    getUsers()
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q) || u.phone?.includes(q)
    );
  }, [users, search]);

  async function handleRoleChange(id: string, role: NonNullable<User["role"]>) {
    setSavingId(id);
    setError(null);
    try {
      const updated = await setUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${t.textPrimary}`}>Users</h2>
        <p className={`text-sm ${t.textMuted} mt-0.5`}>Find a user by email, name, or phone and set their role.</p>
      </div>

      <input
        type="text"
        placeholder="Search by email, name, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`h-10 ${t.inputField} px-3 text-sm mb-4 w-full max-w-sm`}
      />

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-bg-input rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className={`text-sm ${t.textMuted}`}>No users match.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((u) => (
            <div key={u.id} className={`${t.cardBox} p-3 flex items-center gap-4`}>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${t.textPrimary} truncate`}>{u.name || "(no name)"}</p>
                <p className={`text-xs ${t.textMuted} truncate`}>{u.email ?? u.phone}</p>
              </div>
              <select
                value={u.role ?? ""}
                onChange={(e) => handleRoleChange(u.id, e.target.value as NonNullable<User["role"]>)}
                disabled={savingId === u.id}
                className={`h-9 ${t.inputField} px-2 text-sm shrink-0`}
              >
                {!u.role && <option value="" disabled>No role</option>}
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
