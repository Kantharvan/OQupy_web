import { test, expect, type Page } from "@playwright/test";
const studio = {
  id: "studio-1",
  name: "Practice Room",
  location: "Bengaluru",
  price: "₹600/hr",
  type: ["Dance"],
  description: "Room to move.",
  images: [],
  amenities: ["Mirrors"],
  instructors: [],
  operationalHours: Object.fromEntries(
    [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ].map((day) => [day, { open: "08:00", close: "22:00" }]),
  ),
  approvalStatus: "approved",
  published: true,
  cancellationPolicy: 24,
  createdAt: "2030-01-01T00:00:00Z",
};
const booking = {
  id: "booking-1",
  studioId: studio.id,
  studioName: studio.name,
  bookedBy: "student-1",
  bookingType: "student_practice",
  eventName: "Evening rehearsal",
  dateTime: "2030-10-10T12:30:00.000Z",
  durationHours: 1.5,
  status: "AwaitingApproval",
  isPublic: false,
  paymentAmount: 900,
  paymentStatus: "Pending",
  createdAt: "2030-01-01T00:00:00Z",
};
async function setup(page: Page, role: string) {
  const user = {
    id: "user-1",
    name: "Alex Morgan",
    role,
    email: "alex@example.test",
    phone: "9999900000",
  };
  const requests: {
    path: string;
    method: string;
    body: Record<string, unknown>;
  }[] = [];
  const unexpected: string[] = [];
  const reads: string[] = [];
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("fixture-seeded")) {
      localStorage.setItem("oqupy_refresh", "test-refresh");
      sessionStorage.setItem("fixture-seeded", "1");
    }
  });
  await page.route("https://**/*", (route) => route.abort());
  await page.route("http://127.0.0.1:4400/api/v1/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname.replace("/api/v1", "");
    let body: unknown;
    if (request.method() === "GET") reads.push(path);
    if (request.method() !== "GET")
      requests.push({
        path,
        method: request.method(),
        body: request.postData() ? request.postDataJSON() : {},
      });
    if (path === "/auth/me") body = user;
    else if (path === "/auth/logout") body = { success: true };
    else if (path === "/users/user-1")
      body = { ...user, ...request.postDataJSON() };
    else if (path === "/studios/owner/user-1" || path === "/studios")
      body = { data: [studio], total: 1 };
    else if (path === "/studios/by-name/Practice%20Room")
      body =
        request.method() === "PUT"
          ? { ...studio, ...request.postDataJSON() }
          : studio;
    else if (path.startsWith("/studios/") && request.method() === "PATCH")
      body = { ...studio, ...request.postDataJSON() };
    else if (
      path === "/bookings/user/user-1" ||
      path === "/bookings/studio/studio-1"
    )
      body = { data: [booking], total: 1 };
    else if (path === "/bookings/booking-1/confirm")
      body = { ...booking, status: "Confirmed" };
    else if (path === "/bookings/booking-1/cancel")
      body = { ...booking, status: "Cancelled" };
    else if (path === "/blockouts/studio/studio-1")
      body = { data: [], total: 0 };
    else if (path === "/blockouts")
      body = { id: "blockout-1", ...request.postDataJSON() };
    else if (path === "/blockouts/blockout-1") body = { success: true };
    else if (path === "/admin/studios/pending")
      body = {
        data: [{ ...studio, approvalStatus: "pending", owner: user }],
        total: 1,
      };
    else if (path === "/admin/studios/studio-1/approval")
      body = { ...studio, ...request.postDataJSON() };
    else if (path === "/admin/users")
      body = {
        data: [
          { ...user, id: "member-1", name: "Jamie Lee", role: "student" },
          { ...user, id: "owner-1", name: "Sam Owner", role: "studio_owner", email: "sam@example.test" },
          { ...user, id: "new-1", name: "New Member", role: null },
          user,
        ],
        total: 4,
      };
    else if (path === "/admin/users/member-1/role")
      body = {
        ...user,
        id: "member-1",
        name: "Jamie Lee",
        ...request.postDataJSON(),
      };
    else {
      unexpected.push(path);
      return route.fulfill({
        status: 500,
        json: { message: `Unexpected test request ${path}` },
      });
    }
    return route.fulfill({ json: body });
  });
  return { requests, unexpected, reads };
}
async function withinViewport(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("student workspace navigation stays consistent, profile persists, and logout clears the session", async ({
  page,
}, info) => {
  const api = await setup(page, "student");
  await page.goto("/dashboard");
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await expect(
    page.getByRole("heading", { name: "Welcome back, Alex." }),
  ).toBeVisible();
  await expect(nav.getByRole("link", { name: "My studios" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Admin" })).toHaveCount(0);
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("overview.png"),
    fullPage: true,
  });
  await nav.getByRole("link", { name: "Bookings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evening rehearsal" }),
  ).toBeVisible();
  await expect(page.getByText(/6:00 pm.*1 hour 30 min/i)).toBeVisible();
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("bookings.png"),
    fullPage: true,
  });
  await nav.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page.getByLabel("Display name")).toHaveValue("Alex Morgan");
  await page.getByLabel("Display name").fill("Alex Dancer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Your profile has been updated.")).toBeVisible();
  expect(api.requests.find((r) => r.path === "/users/user-1")?.body).toEqual({
    name: "Alex Dancer",
  });
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("profile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/studios$/);
  expect(
    await page.evaluate(() => localStorage.getItem("oqupy_refresh")),
  ).toBeNull();
  expect(api.requests.some((r) => r.path === "/auth/logout")).toBe(true);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  expect(api.unexpected).toEqual([]);
});

test("owner edits hours with AM/PM, creates a timed break and handles a failed approval", async ({
  page,
}, info) => {
  const api = await setup(page, "studio_owner");
  await page.goto("/dashboard/studios");
  await expect(
    page.getByRole("heading", { name: "Practice Room" }),
  ).toBeVisible();
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("studios.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit studio", exact: true }).click();
  await page.getByLabel("Opening time hour").selectOption("9");
  await page.getByLabel("Closing time hour").selectOption("8");
  await page.getByLabel("Closing time AM or PM").selectOption("PM");
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("studio-form.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Edit studio", exact: true }),
  ).toBeVisible();
  const edit = api.requests.find(
    (r) => r.path.startsWith("/studios/") && r.method === "PUT",
  );
  expect(edit?.body.operationalHours).toMatchObject({
    monday: { open: "09:00", close: "20:00" },
    sunday: { open: "09:00", close: "20:00" },
  });
  const nav = page.getByRole("navigation", { name: "Workspace navigation" });
  await nav.getByRole("link", { name: "Availability", exact: true }).click();
  await page.getByRole("button", { name: "Add unavailable time" }).click();
  await page.getByLabel("Reason", { exact: true }).fill("Rehearsal break");
  await page.getByLabel("Blockout date").fill("2030-10-10");
  await page.getByRole("button", { name: "Timed", exact: true }).click();
  await page.getByLabel("Start time hour").selectOption("2");
  await page.getByLabel("Start time AM or PM").selectOption("PM");
  await page.getByLabel("Duration (hours)").fill("1.5");
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("availability.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save Blockout", exact: true })
    .click();
  await expect(
    page.getByText("Rehearsal break", { exact: true }),
  ).toBeVisible();
  expect(api.requests.find((r) => r.path === "/blockouts")?.body).toMatchObject(
    { dateTime: "2030-10-10T08:30:00.000Z", durationHours: 1.5, allDay: false },
  );
  await nav.getByRole("link", { name: "Bookings", exact: true }).click();
  await page.route("**/bookings/booking-1/confirm", (route) =>
    route.fulfill({ status: 503, json: { message: "Approval unavailable" } }),
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Approval unavailable");
  await expect(page.locator(".session-card")).toContainText(
    "Awaiting approval",
  );
  await page.unroute("**/bookings/booking-1/confirm");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.locator(".session-card")).toContainText("Confirmed");
  expect(api.unexpected).toEqual([]);
});

test("admin reviews listings and changes a role within the shared workspace", async ({
  page,
}, info) => {
  const api = await setup(page, "admin");
  await page.goto("/dashboard/admin");
  await expect(
    page.getByRole("heading", { name: "Keep the community moving." }),
  ).toBeVisible();
  await expect(page.getByText("Practice Room", { exact: true })).toBeVisible();
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("admin-studios.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByText("No pending studios")).toBeVisible();
  expect(
    api.requests.find((r) => r.path === "/admin/studios/studio-1/approval")
      ?.body,
  ).toEqual({ approvalStatus: "approved" });
  await page.getByRole("button", { name: "Users", exact: true }).click();
  const students = page.getByRole("button", { name: "Students 1", exact: true });
  await expect(students).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByLabel("Role for Jamie Lee")).toBeHidden();
  await students.click();
  await expect(page.getByLabel("Role for Jamie Lee")).toBeVisible();
  await students.click();
  await page.getByRole("button", { name: "No role 1", exact: true }).click();
  await expect(page.getByLabel("Role for New Member")).toHaveValue("");
  await page.getByLabel("Search users").fill("SAM@EXAMPLE");
  await expect(page.getByLabel("Role for Sam Owner")).toBeVisible();
  await expect(page.getByLabel("Role for Jamie Lee")).toHaveCount(0);
  await page.getByLabel("Search users").fill("not-a-user");
  await expect(page.getByText("No users match.", { exact: true })).toBeVisible();
  await page.getByLabel("Search users").fill("  jAmIe  ");
  await page.getByLabel("Role for Jamie Lee").selectOption("instructor");
  await expect(page.locator("#users-instructor").getByLabel("Role for Jamie Lee")).toHaveValue("instructor");
  await expect(page.getByRole("button", { name: "Students 0 of 0", exact: true })).toBeVisible();
  await page.getByLabel("Search users").fill("");
  await expect(page.getByRole("button", { name: "Instructors 1", exact: true })).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Instructors 1", exact: true }).click();
  expect(
    api.requests.find((r) => r.path === "/admin/users/member-1/role")?.body,
  ).toEqual({ role: "instructor" });
  await withinViewport(page);
  await page.screenshot({
    path: info.outputPath("admin-users.png"),
    fullPage: true,
  });
  expect(api.unexpected).toEqual([]);
});

test("student cannot load owner or admin data through a direct dashboard URL", async ({
  page,
}) => {
  const api = await setup(page, "student");
  for (const path of [
    "/dashboard/admin",
    "/dashboard/studios",
    "/dashboard/blockouts",
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", {
        name: "This page isn’t available for your role",
      }),
    ).toBeVisible();
  }
  expect(api.unexpected).toEqual([]);
  expect(api.requests).toEqual([]);
  expect(api.reads.filter((path) => path !== "/auth/me")).toEqual([]);
});

test("failed admin role change keeps the user in their original section", async ({ page }) => {
  await setup(page, "admin");
  await page.route("**/admin/users/member-1/role", (route) => route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({ message: "Role update unavailable" }),
  }));
  await page.goto("/dashboard/admin");
  await page.getByRole("button", { name: "Users", exact: true }).click();
  await page.getByRole("button", { name: "Students 1", exact: true }).click();
  await page.getByLabel("Role for Jamie Lee").selectOption("instructor");
  await expect(page.getByText("Role update unavailable", { exact: true })).toBeVisible();
  await expect(page.locator("#users-student").getByLabel("Role for Jamie Lee")).toHaveValue("student");
  await expect(page.getByLabel("Role for Jamie Lee")).toBeEnabled();
});

test("owner can see and manage both studios without changing the first", async ({ page }) => {
  const api = await setup(page, "studio_owner");
  let second = { ...studio, id: "studio-2", name: "Yoga Room", location: "Koramangala" };
  const edits: { path: string; body: Record<string, unknown> }[] = [];
  await page.route("**/studios/owner/user-1?*", (route) => route.fulfill({ json: { data: [studio, second], total: 2 } }));
  await page.route("**/bookings/studio/studio-2?*", (route) => route.fulfill({ json: { data: [], total: 0 } }));
  await page.route("**/studios/by-name/Yoga%20Room", (route) => {
    edits.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON() });
    second = { ...second, ...route.request().postDataJSON() };
    return route.fulfill({ json: second });
  });
  let availabilityReads = 0;
  await page.route("**/blockouts/studio/studio-2?*", (route) => {
    availabilityReads++;
    return route.fulfill({ json: { data: [], total: 0 } });
  });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Yoga Room", exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Workspace navigation" }).getByRole("link", { name: "My studios" }).click();
  await expect(page.getByRole("heading", { name: "Practice Room", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yoga Room", exact: true })).toBeVisible();
  const secondPanel = page.locator(".managed-studio").filter({ has: page.getByRole("heading", { name: "Yoga Room", exact: true }) });
  await secondPanel.getByRole("button", { name: "Edit studio", exact: true }).click();
  await page.getByLabel("Location", { exact: true }).fill("Koramangala, Bangalore");
  await page.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(secondPanel.getByText("Koramangala, Bangalore", { exact: true })).toBeVisible();
  expect(edits).toHaveLength(1);
  expect(edits[0].path).toBe("/api/v1/studios/by-name/Yoga%20Room");
  expect(edits[0].body.location).toBe("Koramangala, Bangalore");
  await expect(page.locator(".managed-studio").filter({ hasText: "Practice Room" }).getByText("Bengaluru", { exact: true })).toBeVisible();
  await secondPanel.getByRole("button", { name: "Manage availability", exact: true }).click();
  await expect.poll(() => availabilityReads).toBe(1);
  await expect(secondPanel.getByRole("button", { name: "Add unavailable time" })).toBeVisible();
  await withinViewport(page);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Yoga Room", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Practice Room", exact: true })).toBeVisible();
  expect(api.unexpected).toEqual([]);
});
