import type { AvailabilityResponse } from "@/lib/api/studios";

// Oqupy currently serves Indian studios. A studio timezone belongs in the API
// before supporting venues outside India; never use the visitor's browser zone.
export const STUDIO_TIME_ZONE = "Asia/Kolkata";
export function studioToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function slotISO(date: string, time: string) {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}
export function timeOptions(
  availability: AvailabilityResponse,
  duration: number,
  now = Date.now(),
) {
  const hours = availability.operationalHours;
  if (!hours) return [];
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };
  const close = toMinutes(hours.close);
  const result: { time: string; available: boolean; reason: string }[] = [];
  for (let minute = toMinutes(hours.open); minute < close; minute += 30) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const start = Date.parse(slotISO(availability.date, time));
    const end = start + duration * 3600000;
    const reason =
      start <= now
        ? "Past"
        : minute + duration * 60 > close
          ? "Closes before session ends"
          : availability.busy.some(
                (b) => start < Date.parse(b.end) && end > Date.parse(b.start),
              )
            ? "Unavailable"
            : "";
    result.push({ time, available: !reason, reason });
  }
  return result;
}
