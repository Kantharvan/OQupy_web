import type { Booking } from "@/lib/api/bookings";
import { money } from "@/lib/booking/price";
import { formatSessionDate, durationLabel } from "@/lib/booking/availability";
import type { ReactNode } from "react";
const labels: Record<string, string> = {
  AwaitingApproval: "Awaiting approval",
  Confirmed: "Confirmed",
  Cancelled: "Cancelled",
  Completed: "Completed",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {labels[status] || status}
    </span>
  );
}
export function BookingCard({
  booking,
  actions,
}: {
  booking: Booking;
  actions?: ReactNode;
}) {
  return (
    <article className="session-card">
      <div className="session-symbol" aria-hidden="true">
        ↗
      </div>
      <div className="session-content">
        <div className="session-title">
          <h2>{booking.eventName}</h2>
          <StatusBadge status={booking.status} />
        </div>
        <p>{booking.studioName || booking.clientName || "Studio session"}</p>
        <p className="session-meta">
          {formatSessionDate(booking.dateTime)} ·{" "}
          {durationLabel(booking.durationHours)}
        </p>
        {booking.clientName && (
          <p className="session-meta">Booked for {booking.clientName}</p>
        )}
      </div>
      <div className="session-actions">
        {booking.paymentAmount != null && (
          <strong>{money(booking.paymentAmount)}</strong>
        )}
        {actions}
      </div>
    </article>
  );
}
