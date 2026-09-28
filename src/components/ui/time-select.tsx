"use client";
/** Explicit AM/PM controls; preserve minute precision and the HH:mm API contract. */
export function TimeSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  function update(h: number, m: number, p: string) {
    onChange(
      `${String((h % 12) + (p === "PM" ? 12 : 0)).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    );
  }
  return (
    <fieldset className="time-select">
      <legend>{label}</legend>
      <div>
        <select
          aria-label={`${label} hour`}
          value={hour % 12 || 12}
          onChange={(e) => update(Number(e.target.value), minute, period)}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <span aria-hidden="true">:</span>
        <select
          aria-label={`${label} minute`}
          value={minute}
          onChange={(e) => update(hour, Number(e.target.value), period)}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} AM or PM`}
          value={period}
          onChange={(e) => update(hour, minute, e.target.value)}
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
    </fieldset>
  );
}
