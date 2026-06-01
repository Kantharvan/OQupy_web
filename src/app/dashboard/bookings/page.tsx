"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import { getBookingsByStudio, confirmBooking, cancelBooking, type Booking, type BookingStatus } from "@/lib/api/bookings";
import { t } from "@/styles/tokens";

const STATUS_LABELS: Record<BookingStatus, string> = {
  AwaitingApproval: "Pending",
  Approved: "Approved",
  Cancelled: "Cancelled",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  AwaitingApproval: "bg-yellow-500/15 text-yellow-400",
  Approved: "bg-green-500/15 text-green-400",
  Cancelled: "bg-red-500/15 text-red-400",
};

function DashboardBookingsContent() {
  const searchParams = useSearchParams();
  const preselectedStudioId = searchParams.get("studioId");
  const { user } = useAuth();

  const [studios, setStudios] = useState<Studio[]>([]);
  const [selectedStudioId, setSelectedStudioId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingStudios, setIsLoadingStudios] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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

  const loadBookings = useCallback(async () => {
    if (!selectedStudioId) return;
    setIsLoadingBookings(true);
    try {
      const res = await getBookingsByStudio(selectedStudioId, 1, 50);
      setBookings(res.data.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
    } finally {
      setIsLoadingBookings(false);
    }
  }, [selectedStudioId]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  async function handleConfirm(id: string) {
    setActionId(id);
    try {
      const updated = await confirmBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b));
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(id: string) {
    setActionId(id);
    try {
      const updated = await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? updated : b));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-bold ${t.textPrimary}`}>Bookings</h2>
        <p className={`text-sm ${t.textMuted} mt-0.5`}>Review and manage booking requests.</p>
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

      {isLoadingBookings ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`${t.cardBox} h-20 animate-pulse`} />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className={`${t.cardBox} p-10 text-center`}>
          <p className="text-4xl mb-3">📅</p>
          <p className={`${t.textPrimary} font-semibold`}>No bookings yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <div key={b.id} className={`${t.cardBox} p-4 flex items-center gap-4`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`font-semibold text-sm ${t.textPrimary} truncate`}>{b.eventName}</p>
                  <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                    {STATUS_LABELS[b.status]}
                  </span>
                </div>
                <p className={`text-xs ${t.textMuted}`}>
                  {new Date(b.dateTime).toLocaleString()} · {b.durationHours}h
                  {b.clientName && ` · ${b.clientName}`}
                </p>
                {b.paymentAmount && (
                  <p className={`text-xs ${t.brandText} mt-0.5`}>₹{b.paymentAmount}</p>
                )}
              </div>

              {b.status === "AwaitingApproval" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleConfirm(b.id)}
                    disabled={actionId === b.id}
                    className="h-8 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleCancel(b.id)}
                    disabled={actionId === b.id}
                    className="h-8 px-3 rounded-lg bg-red-600/30 hover:bg-red-600/50 text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardBookingsPage() {
  return (
    <Suspense>
      <DashboardBookingsContent />
    </Suspense>
  );
}
