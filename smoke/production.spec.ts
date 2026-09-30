import { test, expect } from "@playwright/test";
import { hourlyRate, money } from "../src/lib/booking/price";
const api = "https://oqupy-prod.up.railway.app/api/v1";
test("live discovery, search, availability, custom duration and sign-in handoff work without making bookings", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  // No sign-ins, OTP sends, reservations or other production mutations in smoke.
  await page.route("**/*", (r) =>
    ["GET", "HEAD", "OPTIONS"].includes(r.request().method())
      ? r.continue()
      : r.abort(),
  );
  const response = await request.get(`${api}/studios?limit=1`);
  expect(response.status()).toBe(200);
  const { data } = await response.json();
  expect(
    data.length,
    "Production needs at least one published studio",
  ).toBeGreaterThan(0);
  const studio = data[0];
  await page.goto("/");
  await expect(page).toHaveURL(/\/studios$/);
  await page.getByLabel("What are you looking for?").fill(studio.name);
  await page
    .getByRole("button", { name: "Find a studio", exact: true })
    .click();
  await page.getByRole("link").filter({ hasText: studio.name }).click();
  await expect(
    page.getByRole("heading", { name: studio.name, exact: true }),
  ).toBeVisible();
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const availability = page.waitForResponse((r) =>
    r.url().includes(`/studios/${studio.id}/availability?date=${date}`),
  );
  await page.getByLabel("Date", { exact: true }).fill(date);
  expect((await availability).status()).toBe(200);
  await page.getByRole("spinbutton", { name: /Session length/ }).fill("1.5");
  await expect(
    page.getByRole("spinbutton", { name: /Session length/ }),
  ).toHaveValue("1.5");
  const slot = page
    .getByRole("button", { name: /AM|PM/ })
    .filter({ visible: true });
  // A closed/fully booked day is a legitimate production state; never fabricate availability.
  await expect(slot.first()).toBeVisible();
  const available = await slot.all();
  let selected = false;
  for (const item of available) {
    if (await item.isEnabled()) {
      await item.click();
      selected = true;
      break;
    }
  }
  expect(
    selected,
    "No 1.5-hour slots on the sampled studio/day; investigate data or scheduling",
  ).toBe(true);
  await expect(page.getByText(/1 hour 30 min ×/)).toBeVisible();
  const rate = hourlyRate(studio.price);
  expect(rate).not.toBeNull();
  await expect(page.locator(".booking-total strong")).toHaveText(
    money(Math.round(rate! * 1.5 * 100) / 100),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Sign in to request booking →" })
    .click();
  await expect(
    page.getByRole("heading", { name: "A space is waiting for you" }),
  ).toBeVisible();
  const back = page.getByRole("link", { name: "← Back to your studio" });
  const href = await back.getAttribute("href");
  expect(href).toContain(`date=${date}`);
  expect(href).toContain("duration=1.5");
  expect(href).toContain("time=");
  await expect(page.getByLabel("Phone number")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send OTP", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("anonymous workspace entry redirects to sign-in", async ({ page }) => {
  for (const path of ["/dashboard", "/dashboard/admin"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByLabel("Phone number")).toBeVisible();
  }
});
