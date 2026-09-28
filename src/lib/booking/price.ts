/** Accept numeric API prices and the legacy INR/hour strings still in stored data. */
export function hourlyRate(value: string | number): number | null {
  const match = String(value)
    .trim()
    .match(
      /^(?:₹\s*|INR\s*)?(\d+(?:,\d{2,3})*(?:\.\d{1,2})?)\s*(?:\/\s*(?:hr|hour))?$/i,
    );
  if (!match) return null;
  const amount = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function money(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function priceLabel(value: string | number): string {
  const amount = hourlyRate(value);
  return amount === null ? "Price unavailable" : `${money(amount)}/hr`;
}
