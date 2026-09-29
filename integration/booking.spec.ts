import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(
  readFileSync(process.env.OQUPY_INTEGRATION_FIXTURE!, "utf8"),
) as {
  users: { id: string; refresh: string; role: string }[];
  studio: { id: string; name: string };
  date: string;
  database: string;
  redis: string;
};
for (const endpoint of [fixture.database, fixture.redis]) {
  if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(endpoint).hostname))
    throw new Error("Integration fixture must use loopback services");
}
const api = "http://127.0.0.1:4401/api/v1";

test("mobile booking reaches PostgreSQL, owner approval reaches the customer, and cancellation frees the slot", async ({
  browser,
  request,
}) => {
  expect((await request.get(`${api}/health`)).ok()).toBe(true);
  const student = fixture.users.find((u) => u.role === "student")!;
  const owner = fixture.users.find((u) => u.role === "studio_owner")!;
  const customerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 390, height: 844 },
    timezoneId: "America/New_York",
  });
  const ownerContext = await browser.newContext({
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 390, height: 844 },
    timezoneId: "Asia/Kolkata",
  });
  // Real Redis refresh sessions bootstrap the accounts. Google/SMS are outside this test.
  for (const [context, user] of [
    [customerContext, student],
    [ownerContext, owner],
  ] as const) {
    await context.addInitScript((refresh) => {
      if (!sessionStorage.getItem("integration-seeded")) {
        localStorage.setItem("oqupy_refresh", refresh);
        sessionStorage.setItem("integration-seeded", "1");
      }
    }, user.refresh);
    // Fail closed if the build accidentally targets production or loads external providers.
    await context.route("**/*", (route) => {
      const url = new URL(route.request().url());
      return url.hostname === "127.0.0.1" && ["3101", "4401"].includes(url.port)
        ? route.continue()
        : route.abort();
    });
  }
  try {
    const customer = await customerContext.newPage();
    const publicClasses = customer.waitForResponse((r) =>
      r.url().startsWith(`${api}/bookings/public/studio/${fixture.studio.id}?`),
    );
    await customer.goto(
      `/studios/${encodeURIComponent(fixture.studio.name)}?date=${fixture.date}&duration=1.5&time=10%3A00`,
    );
    expect((await publicClasses).status()).toBe(200);
    await expect(
      customer.getByRole("heading", { name: fixture.studio.name }),
    ).toBeVisible();
    await expect(
      customer.getByRole("spinbutton", { name: /Session length/ }),
    ).toHaveValue("1.5");
    await expect(
      customer.getByText("Classes could not be loaded.", { exact: false }),
    ).toHaveCount(0);
    await customer
      .getByLabel("What’s your session for?")
      .fill("Real backend rehearsal");
    const submitted = customer.waitForResponse(
      (r) => r.url() === `${api}/bookings` && r.request().method() === "POST",
    );
    await customer
      .getByRole("button", { name: "Request booking →", exact: true })
      .click();
    const response = await submitted;
    expect(response.status()).toBe(201);
    const booking = await response.json();
    expect(booking).toMatchObject({
      durationHours: 1.5,
      paymentAmount: 900,
      paymentStatus: "Pending",
      status: "AwaitingApproval",
      dateTime: new Date(`${fixture.date}T10:00:00+05:30`).toISOString(),
    });
    await customer.getByRole("link", { name: "View my bookings →" }).click();
    await expect(
      customer
        .locator(".session-card")
        .filter({ hasText: "Real backend rehearsal" }),
    ).toContainText("Awaiting approval");

    const manager = await ownerContext.newPage();
    await manager.goto("/dashboard/bookings");
    const ownerCard = manager
      .locator(".session-card")
      .filter({ hasText: "Real backend rehearsal" });
    await ownerCard
      .getByRole("button", { name: "Approve", exact: true })
      .click();
    await expect(ownerCard).toContainText("Confirmed");
    await customer.reload();
    const customerCard = customer
      .locator(".session-card")
      .filter({ hasText: "Real backend rehearsal" });
    await expect(customerCard).toContainText("Confirmed");
    const busy = await request.get(
      `${api}/studios/${fixture.studio.id}/availability?date=${fixture.date}`,
    );
    expect((await busy.json()).busy).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "booking", start: booking.dateTime }),
      ]),
    );
    // Cancellation exists in the API; the current customer dashboard has no cancel button.
    const session = await request.post(`${api}/auth/refresh`, {
      data: { refreshToken: student.refresh },
    });
    expect(session.ok()).toBe(true);
    const access = (await session.json()).accessToken;
    const cancelled = await request.patch(
      `${api}/bookings/${booking.id}/cancel`,
      { headers: { Authorization: `Bearer ${access}` } },
    );
    expect(cancelled.ok()).toBe(true);
    await customer.reload();
    await expect(customerCard).toContainText("Cancelled");
    const freed = await request.get(
      `${api}/studios/${fixture.studio.id}/availability?date=${fixture.date}`,
    );
    expect((await freed.json()).busy).toEqual([]);
    for (const page of [customer, manager])
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
  } finally {
    await customerContext.close();
    await ownerContext.close();
  }
});
