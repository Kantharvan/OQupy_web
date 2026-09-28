import { test, expect } from "@playwright/test";
import { hourlyRate, priceLabel } from "../src/lib/booking/price";
import {
  timeOptions,
  slotISO,
  timeLabel,
  validDuration,
} from "../src/lib/booking/availability";
import { studioReturnPath } from "../src/lib/booking/return-path";

test("legacy and numeric prices produce the same charge; malformed prices cannot become free bookings", () => {
  for (const value of [600, "600", "₹600/hr", "INR 600/hour"])
    expect(hourlyRate(value)).toBe(600);
  expect(hourlyRate("₹1,200.50/hr")).toBe(1200.5);
  expect(priceLabel("₹600/hr")).toBe("₹600.00/hr");
  for (const value of ["", "free", "-600", "0", "600oops", "₹₹600/hr/hr"])
    expect(hourlyRate(value)).toBeNull();
});

test("a session must fit entirely before closing and outside busy windows", () => {
  const date = "2030-10-10";
  const slots = timeOptions(
    {
      date,
      operationalHours: { open: "09:00", close: "13:00" },
      busy: [
        {
          start: slotISO(date, "10:00"),
          end: slotISO(date, "11:00"),
          kind: "booking",
        },
      ],
    },
    1,
    0,
  );
  expect(slots.filter((s) => s.available).map((s) => s.time)).toEqual([
    "09:00",
    "11:00",
    "11:30",
    "12:00",
  ]);
  expect(slots.find((s) => s.time === "09:30")?.available).toBe(false);
  expect(slots.find((s) => s.time === "12:30")?.available).toBe(false);
  expect(timeOptions({ date, operationalHours: null, busy: [] }, 1, 0)).toEqual(
    [],
  );
  expect(slotISO(date, "09:00")).toBe("2030-10-10T03:30:00.000Z");
});

test("sign-in return destinations stay inside studio pages", () => {
  for (const value of [
    "https://evil.example",
    "//evil.example",
    "/studios/../../login",
    "/studios/\\evil.example",
    "/dashboard/admin",
  ])
    expect(studioReturnPath(value)).toBeNull();
  expect(studioReturnPath("/studios/Room?date=2030-10-10&time=09%3A00")).toBe(
    "/studios/Room?date=2030-10-10&time=09%3A00",
  );
});

test("AM/PM labels preserve noon and midnight, and custom durations fit full sessions", () => {
  expect(timeLabel("00:00")).toBe("12:00 AM");
  expect(timeLabel("12:00")).toBe("12:00 PM");
  expect(timeLabel("13:30")).toBe("1:30 PM");
  for (const length of [0.5, 1.5, 3, 3.5, 8, 24])
    expect(validDuration(length)).toBe(true);
  for (const length of [0, -1, 0.25, 1.1, 24.5, NaN, Infinity])
    expect(validDuration(length)).toBe(false);
  const slots = timeOptions(
    {
      date: "2030-10-10",
      operationalHours: { open: "09:00", close: "13:00" },
      busy: [
        {
          start: slotISO("2030-10-10", "11:00"),
          end: slotISO("2030-10-10", "12:00"),
          kind: "booking",
        },
      ],
    },
    1.5,
    0,
  );
  expect(slots.filter((s) => s.available).map((s) => s.time)).toEqual([
    "09:00",
    "09:30",
  ]);
});
