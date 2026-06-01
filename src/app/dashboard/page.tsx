"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOwnerStudios, type Studio } from "@/lib/api/studios";
import { getBookingsByStudio, type Booking } from "@/lib/api/bookings";
import { t } from "@/styles/tokens";
import Link from "next/link";

type RevenueRange = "week" | "month" | "all";

function startOf(range: RevenueRange): Date | null {
  const now = new Date();
  if (range === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    return d;
  }
  if (range === "month") {
    const d = new Date(now);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("month");

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const studiosRes = await getOwnerStudios(user!.id, 1, 50);
        const studioList: Studio[] = studiosRes.data;
        setStudios(studioList);

        const bookingArrays = await Promise.all(
          studioList.map((s) => getBookingsByStudio(s.id, 1, 100).then((r) => r.data))
        );
        const flat = bookingArrays.flat();
        flat.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllBookings(flat);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [user]);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const pending = allBookings.filter((b) => b.status === "AwaitingApproval").length;

  const revenue = useMemo(() => {
    const from = startOf(revenueRange);
    return allBookings
      .filter((b) => b.status === "Approved" && b.paymentAmount && (from ? new Date(b.dateTime) >= from : true))
      .reduce((sum, b) => sum + (b.paymentAmount ?? 0), 0);
  }, [allBookings, revenueRange]);

  return (
    <div className="max-w-5xl">
      {/* Greeting */}
      <h2 className={`text-2xl font-bold ${t.textPrimary} mb-1`}>Hey, {firstName} 👋</h2>
      <p className={`${t.textMuted} text-sm mb-8`}>Here&apos;s what&apos;s happening with your studios.</p>

      {/* Studios */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${t.textSecondary} uppercase tracking-wider`}>Your Studio</h3>
          <Link href="/dashboard/studios" className={`text-xs ${t.link}`}>
            {studios.length > 1 ? `View all ${studios.length} →` : "+ Add Studio"}
          </Link>
        </div>

        {isLoading ? (
          <div className={`${t.cardBox} h-24 animate-pulse`} />
        ) : studios.length === 0 ? (
          <div className={`${t.cardBox} p-6 flex items-center gap-4`}>
            <div className="w-14 h-14 rounded-xl bg-bg-input shrink-0" />
            <div>
              <p className={`font-medium ${t.textPrimary}`}>No studio yet</p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>Add your first studio to start accepting bookings.</p>
            </div>
            <Link href="/dashboard/studios" className={`ml-auto h-9 px-4 ${t.btnPrimary} text-sm flex items-center`}>
              Add Studio
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {studios.slice(0, 2).map((studio) => (
              <StudioCard key={studio.id} studio={studio} />
            ))}
            {studios.length > 2 && (
              <Link href="/dashboard/studios" className={`text-xs ${t.link} pl-1`}>
                +{studios.length - 2} more studios →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/dashboard/bookings">
          <div className={`${t.cardBox} p-5`}>
            <p className={`text-2xl font-bold ${t.textPrimary}`}>{isLoading ? "—" : allBookings.length}</p>
            <p className={`text-xs ${t.textMuted} mt-1`}>Total Bookings</p>
          </div>
        </Link>
        <Link href="/dashboard/bookings">
          <div className={`${t.cardBox} p-5 ${pending > 0 ? "border-amber-500/40" : ""}`}>
            <p className={`text-2xl font-bold ${pending > 0 ? t.brandText : t.textPrimary}`}>{isLoading ? "—" : pending}</p>
            <p className={`text-xs ${t.textMuted} mt-1`}>Pending Approval</p>
          </div>
        </Link>
      </div>

      {/* Revenue */}
      <section className="mb-8">
        <div className={`${t.cardBox} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${t.textPrimary}`}>Revenue</h3>
            <div className="flex gap-1">
              {(["week", "month", "all"] as RevenueRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRevenueRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    revenueRange === r ? `bg-bg-input ${t.textPrimary}` : `${t.textMuted} hover:text-white`
                  }`}
                >
                  {r === "week" ? "7 days" : r === "month" ? "This month" : "All time"}
                </button>
              ))}
            </div>
          </div>
          <p className={`text-3xl font-bold ${t.textPrimary}`}>
            {isLoading ? "—" : `₹${revenue.toLocaleString()}`}
          </p>
          <p className={`text-xs ${t.textMuted} mt-1`}>From approved bookings</p>
        </div>
      </section>

      {/* Recent bookings */}
      <div className={`${t.cardBox} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${t.textPrimary}`}>Recent Bookings</h3>
          <Link href="/dashboard/bookings" className={`text-xs ${t.link}`}>View all →</Link>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-bg-input rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allBookings.length === 0 ? (
          <p className={`text-sm ${t.textMuted}`}>No bookings yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {allBookings.slice(0, 5).map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${t.textPrimary} truncate`}>{b.eventName}</p>
                  <p className={`text-xs ${t.textMuted}`}>
                    {b.studioName} · {new Date(b.dateTime).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StudioCard({ studio }: { studio: Studio }) {
  const cover = studio.images[0];
  return (
    <div className={`${t.cardBox} p-4 flex items-center gap-4`}>
      <div className="w-14 h-14 rounded-xl bg-bg-input overflow-hidden shrink-0 flex items-center justify-center">
        {cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cover} alt={studio.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-bg-input flex items-center justify-center">
              <span className={`text-xs ${t.textMuted}`}>No image</span>
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${t.textPrimary} truncate`}>{studio.name}</p>
        <p className={`text-xs ${t.textMuted} mt-0.5`}>📍 {studio.location}</p>
        <p className={`text-xs ${t.textMuted}`}>{studio.type.join(", ")} · ₹{studio.price}/hr</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href={`/dashboard/bookings?studioId=${studio.id}`}
          className={`h-8 px-3 rounded-lg border text-xs ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors flex items-center`}
        >
          Bookings
        </Link>
        <Link
          href="/dashboard/studios"
          className={`h-8 px-3 rounded-lg border text-xs ${t.borderInput} ${t.textSecondary} hover:border-zinc-500 transition-colors flex items-center`}
        >
          Blockouts
        </Link>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AwaitingApproval: "bg-yellow-500/15 text-yellow-400",
    Approved: "bg-green-500/15 text-green-400",
    Cancelled: "bg-red-500/15 text-red-400",
  };
  const label: Record<string, string> = {
    AwaitingApproval: "Pending",
    Approved: "Approved",
    Cancelled: "Cancelled",
  };
  return (
    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${map[status] ?? "bg-bg-input text-text-muted"}`}>
      {label[status] ?? status}
    </span>
  );
}
