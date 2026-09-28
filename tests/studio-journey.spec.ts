import { test, expect, type Page } from "@playwright/test";

const studio = {
  id: "studio-1",
  name: "Practice Room",
  location: "Bengaluru",
  price: "₹600/hr",
  type: ["Dance"],
  description: "A bright space for your next rehearsal.",
  images: [],
  amenities: ["Mirrors", "Air conditioning"],
  instructors: [{ id: "i", name: "", email: "" }],
  cancellationPolicy: 24,
};
const user = {
  id: "user-1",
  name: "Test student",
  phone: "9999900000",
  email: null,
  role: "student",
};
const date = "2030-10-10";
const studioURL = `/studios/${encodeURIComponent(studio.name)}`;

async function mockAPI(
  page: Page,
  options: {
    authenticated?: boolean;
    conflict?: boolean;
    newUser?: boolean;
  } = {},
) {
  const bookings: Record<string, unknown>[] = [];
  const otpRequests: unknown[] = [];
  const unexpected: string[] = [];
  if (options.authenticated)
    await page.addInitScript(() =>
      localStorage.setItem("oqupy_refresh", "test-refresh"),
    );
  await page.route("https://**/*", (route) => route.abort());
  await page.route("http://127.0.0.1:4400/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    let body: unknown;
    if (path === "/studios")
      body = {
        data: url.searchParams.get("search") === "missing" ? [] : [studio],
        total: url.searchParams.get("search") === "missing" ? 0 : 1,
        page: 1,
        limit: 12,
      };
    else if (path === `/studios/by-name/${encodeURIComponent(studio.name)}`)
      body = studio;
    else if (path.endsWith("/availability"))
      body = {
        date: url.searchParams.get("date"),
        operationalHours: { open: "09:00", close: "13:00" },
        busy: [],
      };
    else if (path === "/auth/me") body = user;
    else if (path === "/auth/send-otp") {
      otpRequests.push(route.request().postDataJSON());
      body = { message: "OTP sent" };
    } else if (path === "/auth/verify-otp")
      body = {
        user: options.newUser ? { ...user, role: null } : user,
        isNewUser: !!options.newUser,
        accessToken: "test-access",
        refreshToken: "test-refresh",
      };
    else if (path === "/users/user-1")
      body = { ...user, ...route.request().postDataJSON() };
    else if (path.startsWith("/bookings/studio/"))
      body = { data: [], total: 0 };
    else if (path === "/bookings" && route.request().method() === "POST") {
      bookings.push(route.request().postDataJSON());
      if (options.conflict)
        return route.fulfill({
          status: 409,
          json: { message: "Booking conflict" },
        });
      body = { id: "booking-1", status: "AwaitingApproval" };
    } else {
      unexpected.push(path);
      return route.fulfill({
        status: 500,
        json: { message: `Unexpected test request: ${path}` },
      });
    }
    return route.fulfill({ json: body });
  });
  return { bookings, otpRequests, unexpected };
}

async function chooseSlot(page: Page) {
  await page.getByLabel("Date", { exact: true }).fill(date);
  await page.getByRole("button", { name: "09:00", exact: true }).click();
}

test("browse, search, recover from empty results and keep filters on back navigation", async ({
  page,
}) => {
  const api = await mockAPI(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Find your space. Make it yours." }),
  ).toBeVisible();
  await expect(page.getByText("₹600.00/hr", { exact: true })).toBeVisible();
  await page.getByLabel("What are you looking for?").fill("missing");
  await page.getByRole("button", { name: "Find a studio" }).click();
  await expect(
    page.getByRole("heading", { name: "No spaces match just yet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("heading", { name: studio.name })).toBeVisible();
  await page.getByLabel("Where?", { exact: true }).fill("Bengaluru");
  await page.getByRole("button", { name: "Find a studio" }).click();
  await expect(page).toHaveURL(/location=Bengaluru/);
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: studio.name }) })
    .click();
  await expect(page).toHaveURL(/studios\/Practice%20Room/);
  await page.goBack();
  await expect(page.getByLabel("Where?", { exact: true })).toHaveValue(
    "Bengaluru",
  );
  expect(api.unexpected).toEqual([]);
});

test("guest sees availability and retains date, time and price through OTP login and booking", async ({
  page,
}) => {
  const api = await mockAPI(page);
  await page.goto(studioURL);
  await chooseSlot(page);
  await expect(page.getByText("Meet the instructors")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "12:30 — Closes before session ends" }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Sign in to request booking" }).click();
  await page.getByLabel("Phone number").fill("9999900000");
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  for (let i = 1; i <= 6; i++)
    await page.getByLabel(`Code digit ${i}`).fill("1");
  await page.getByRole("button", { name: "Verify OTP", exact: true }).click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(date);
  await expect(
    page.getByRole("button", { name: "09:00", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("What’s your session for?").fill("Rehearsal");
  await page
    .getByRole("button", { name: "Request booking", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "You’re one step closer." }),
  ).toBeVisible();
  expect(api.bookings).toEqual([
    expect.objectContaining({
      studioId: studio.id,
      eventName: "Rehearsal",
      paymentAmount: 600,
      dateTime: "2030-10-10T03:30:00.000Z",
      durationHours: 1,
    }),
  ]);
  expect(api.otpRequests).toHaveLength(1);
  expect(api.unexpected).toEqual([]);
});

test("new users return to their booking after completing their profile", async ({
  page,
}) => {
  await mockAPI(page, { newUser: true });
  await page.goto(`${studioURL}?date=${date}&time=09%3A00&duration=2`);
  await page.getByRole("link", { name: "Sign in to request booking" }).click();
  await page.getByLabel("Phone number").fill("9999900000");
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  for (let i = 1; i <= 6; i++)
    await page.getByLabel(`Code digit ${i}`).fill("1");
  await page.getByRole("button", { name: "Verify OTP", exact: true }).click();
  await page.getByLabel("Display name").fill("New dancer");
  await page.getByRole("button", { name: "Get started" }).click();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(date);
  await expect(
    page.getByRole("button", { name: "2 hours", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("conflicting booking refreshes availability and requires a new selection", async ({
  page,
}) => {
  const api = await mockAPI(page, { authenticated: true, conflict: true });
  await page.goto(studioURL);
  await chooseSlot(page);
  await page.getByLabel("What’s your session for?").fill("Rehearsal");
  await page.getByRole("button", { name: "Request booking" }).click();
  await expect(
    page.getByRole("complementary", { name: "Booking" }).getByRole("alert"),
  ).toContainText("That time was just taken");
  await expect(
    page.getByRole("button", { name: "Request booking" }),
  ).toBeDisabled();
  expect(api.bookings).toHaveLength(1);
});

test("failed availability never leaves an old date bookable, and retry recovers", async ({
  page,
}) => {
  const api = await mockAPI(page, { authenticated: true });
  await page.goto(studioURL);
  await chooseSlot(page);
  await page.getByLabel("What’s your session for?").fill("Practice");
  await page.route(
    "**/studios/studio-1/availability?date=2030-10-11",
    (route) => route.fulfill({ status: 503, json: { message: "Unavailable" } }),
  );
  await page.getByLabel("Date", { exact: true }).fill("2030-10-11");
  await expect(
    page.getByRole("complementary", { name: "Booking" }).getByRole("alert"),
  ).toContainText("We couldn’t check availability");
  await expect(
    page.getByRole("button", { name: "Request booking" }),
  ).toBeDisabled();
  await page.unroute("**/studios/studio-1/availability?date=2030-10-11");
  await page.getByRole("button", { name: "Retry availability" }).click();
  await expect(
    page.getByRole("button", { name: "09:00", exact: true }),
  ).toBeEnabled();
  expect(api.bookings).toHaveLength(0);
});

test("narrow layouts keep all content within the viewport", async ({
  page,
}, testInfo) => {
  await mockAPI(page);
  for (const url of [
    "/studios",
    studioURL,
    "/login",
    "/verify-otp?phone=9999900000",
  ]) {
    await page.goto(url);
    await expect(page.locator("main")).toBeVisible();
    if (url === "/studios" || url === studioURL) {
      await expect(
        page.getByRole("heading", { name: studio.name, exact: true }),
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(
          url === "/studios" ? "browse.png" : "detail.png",
        ),
        fullPage: true,
      });
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("resend OTP sends another request, and an invalid code stays on verification", async ({
  page,
}) => {
  const api = await mockAPI(page);
  await page.clock.install();
  await page.goto("/login");
  await page.getByLabel("Phone number").fill("9999900000");
  await page.getByRole("button", { name: "Send OTP", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify OTP" })).toBeVisible();
  await page.clock.fastForward(31000);
  await page.getByRole("button", { name: "Resend OTP", exact: true }).click();
  await expect.poll(() => api.otpRequests.length).toBe(2);
  await expect(
    page.getByRole("button", { name: /Resend OTP \(\d+s\)/ }),
  ).toBeDisabled();
  await page.route("**/auth/verify-otp", (route) =>
    route.fulfill({ status: 401, json: { message: "Invalid OTP" } }),
  );
  for (let i = 1; i <= 6; i++)
    await page.getByLabel(`Code digit ${i}`).fill("1");
  await page.getByRole("button", { name: "Verify OTP", exact: true }).click();
  await expect(page.getByText("Invalid OTP", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/verify-otp/);
});

test("late availability responses cannot overwrite the newly selected date", async ({
  page,
}) => {
  await mockAPI(page);
  let release: () => void = () => {};
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let firstRequested = false;
  await page.route(
    "**/studios/studio-1/availability?date=2030-10-10",
    async (route) => {
      firstRequested = true;
      await delayed;
      await route.fulfill({
        json: {
          date,
          operationalHours: { open: "09:00", close: "10:00" },
          busy: [],
        },
      });
    },
  );
  await page.goto(studioURL);
  await page.getByLabel("Date", { exact: true }).fill(date);
  await expect.poll(() => firstRequested).toBe(true);
  await page.getByLabel("Date", { exact: true }).fill("2030-10-11");
  await expect(
    page.getByRole("button", { name: "11:00", exact: true }),
  ).toBeEnabled();
  const oldResponse = page.waitForResponse((response) =>
    response.url().endsWith(`availability?date=${date}`),
  );
  release();
  await oldResponse;
  await expect(
    page.getByRole("button", { name: "11:00", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(
    "2030-10-11",
  );
});
