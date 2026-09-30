import { test, expect, type Browser } from "@playwright/test";
import { readFileSync } from "node:fs";
const fixture = JSON.parse(
  readFileSync(process.env.OQUPY_INTEGRATION_FIXTURE!, "utf8"),
) as {
  users: { id: string; refresh: string; role: string; purpose: string }[];
  studio: { id: string; name: string };
  date: string;
};
const api = "http://127.0.0.1:4401/api/v1";
async function account(browser: Browser, purpose: string) {
  const user = fixture.users.find((u) => u.purpose === purpose);
  if (!user)
    throw new Error(`Missing ${purpose} fixture; update companion backend`);
  const context = await browser.newContext({
    baseURL: "http://127.0.0.1:3101",
    viewport: { width: 390, height: 844 },
    timezoneId: "America/New_York",
  });
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return u.hostname === "127.0.0.1" && ["3101", "4401"].includes(u.port)
      ? route.continue()
      : route.abort();
  });
  await context.addInitScript((refresh) => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem("oqupy_refresh", refresh);
      sessionStorage.setItem("seeded", "1");
    }
  }, user.refresh);
  return { context, page: await context.newPage(), user };
}
test("instructor requests a public class, owner approves, student enrollment persists and duplicate enrollment is rejected", async ({
  browser,
  request,
}) => {
  const instructor = await account(browser, "instructor"),
    owner = await account(browser, "studio_owner"),
    student = await account(browser, "student");
  try {
    await instructor.page.goto(
      `/studios/${encodeURIComponent(fixture.studio.name)}?date=${fixture.date}&duration=1&time=16%3A00`,
    );
    await instructor.page
      .getByLabel("Class or event name")
      .fill("Integration public class");
    await instructor.page
      .getByLabel("Open for student enrollment after approval")
      .check();
    const submitted = instructor.page.waitForResponse(
      (r) => r.url() === `${api}/bookings` && r.request().method() === "POST",
    );
    await instructor.page
      .getByRole("button", { name: "Request booking →", exact: true })
      .click();
    const response = await submitted;
    expect(response.status()).toBe(201);
    const booking = await response.json();
    expect(booking).toMatchObject({
      status: "AwaitingApproval",
      isPublic: true,
      bookingType: "instructor_event",
      paymentAmount: 600,
    });
    const before = await request.get(
      `${api}/bookings/public/studio/${fixture.studio.id}`,
    );
    expect(
      (await before.json()).data.some(
        (b: { id: string }) => b.id === booking.id,
      ),
    ).toBe(false);
    await owner.page.goto("/dashboard/bookings");
    const card = owner.page
      .locator(".session-card")
      .filter({ hasText: "Integration public class" });
    await card.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(card).toContainText("Confirmed");
    await student.page.goto(
      `/studios/${encodeURIComponent(fixture.studio.name)}`,
    );
    await expect(
      student.page.getByText("Integration public class", { exact: true }),
    ).toBeVisible();
    const enrolled = student.page.waitForResponse(
      (r) =>
        r.url() === `${api}/enrollments` && r.request().method() === "POST",
    );
    await student.page
      .getByRole("button", { name: "Enroll", exact: true })
      .click();
    expect((await enrolled).status()).toBe(201);
    await expect(
      student.page.getByRole("button", { name: "Enrolled ✓" }),
    ).toBeDisabled();
    const session = await request.post(`${api}/auth/refresh`, {
      data: { refreshToken: student.user.refresh },
    });
    const headers = {
      Authorization: `Bearer ${(await session.json()).accessToken}`,
    };
    const saved = await request.get(
      `${api}/enrollments/student/${student.user.id}`,
      { headers },
    );
    expect(saved.status()).toBe(200);
    expect((await saved.json()).data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bookingId: booking.id }),
      ]),
    );
    expect(
      (
        await request.post(`${api}/enrollments`, {
          headers,
          data: { bookingId: booking.id },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await Promise.all([
      instructor.context.close(),
      owner.context.close(),
      student.context.close(),
    ]);
  }
});
test("owner creates a private pending listing, admin publishes it, hours and blockout changes persist into public availability", async ({
  browser,
  request,
}) => {
  const owner = await account(browser, "new-owner"),
    admin = await account(browser, "admin");
  const name = `Review studio ${owner.user.id}`;
  try {
    await owner.page.goto("/dashboard/studios");
    await owner.page.getByRole("button", { name: "Add a studio ↗" }).click();
    await owner.page.getByLabel("Studio name", { exact: true }).fill(name);
    await owner.page
      .getByLabel("Location", { exact: true })
      .fill("Isolated test city");
    await owner.page
      .getByLabel("Price per hour (₹)", { exact: true })
      .fill("700");
    await owner.page
      .getByRole("button", { name: "Dance", exact: true })
      .click();
    const created = owner.page.waitForResponse(
      (r) => r.url() === `${api}/studios` && r.request().method() === "POST",
    );
    await owner.page
      .getByRole("button", { name: "Create Studio", exact: true })
      .click();
    const response = await created;
    expect(response.status()).toBe(201);
    const studio = await response.json();
    expect(studio).toMatchObject({
      approvalStatus: "pending",
      published: false,
    });
    const hidden = await request.get(
      `${api}/studios?search=${encodeURIComponent(name)}`,
    );
    expect((await hidden.json()).data).toEqual([]);
    await admin.page.goto("/dashboard/admin");
    const review = admin.page.locator(".review-card").filter({ hasText: name });
    await review.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(review).toHaveCount(0);
    const visible = await request.get(
      `${api}/studios?search=${encodeURIComponent(name)}`,
    );
    expect((await visible.json()).data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: studio.id, published: true }),
      ]),
    );
    await owner.page.reload();
    await owner.page
      .getByRole("button", { name: "Edit studio", exact: true })
      .click();
    await owner.page.getByLabel("Opening time hour").selectOption("9");
    await owner.page.getByLabel("Closing time hour").selectOption("8");
    await owner.page.getByLabel("Closing time AM or PM").selectOption("PM");
    await owner.page
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await expect(
      owner.page.getByRole("button", { name: "Edit studio", exact: true }),
    ).toBeVisible();
    await owner.page.reload();
    await owner.page
      .getByRole("button", { name: "Edit studio", exact: true })
      .click();
    await expect(owner.page.getByLabel("Opening time hour")).toHaveValue("9");
    await expect(owner.page.getByLabel("Closing time hour")).toHaveValue("8");
    await owner.page.goto("/dashboard/blockouts");
    await owner.page
      .getByRole("button", { name: "Add unavailable time" })
      .click();
    await owner.page
      .getByLabel("Reason", { exact: true })
      .fill("Integration break");
    await owner.page.getByLabel("Blockout date").fill(fixture.date);
    await owner.page
      .getByRole("button", { name: "Timed", exact: true })
      .click();
    await owner.page.getByLabel("Start time hour").selectOption("2");
    await owner.page.getByLabel("Start time AM or PM").selectOption("PM");
    await owner.page.getByLabel("Duration (hours)").fill("1.5");
    await owner.page
      .getByRole("button", { name: "Save Blockout", exact: true })
      .click();
    await expect(
      owner.page.getByText("Integration break", { exact: true }),
    ).toBeVisible();
    const availability = await request.get(
      `${api}/studios/${studio.id}/availability?date=${fixture.date}`,
    );
    expect(await availability.json()).toMatchObject({
      operationalHours: { open: "09:00", close: "20:00" },
      busy: expect.arrayContaining([
        expect.objectContaining({
          kind: "blockout",
          start: new Date(`${fixture.date}T14:00:00+05:30`).toISOString(),
        }),
      ]),
    });
  } finally {
    await owner.context.close();
    await admin.context.close();
  }
});
