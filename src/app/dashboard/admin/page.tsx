"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPendingStudios, approveStudio, type PendingStudio } from "@/lib/api/admin";
import { t } from "@/styles/tokens";

export default function DashboardAdminPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
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

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

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
