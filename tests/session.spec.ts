import { test, expect } from "@playwright/test";

for (const outcome of ["recovered", "refresh rejected", "retry rejected"] as const) {
  test(`persisted session: ${outcome}`, async ({ page }) => {
    let refreshes = 0;
    const authorizations: (string | undefined)[] = [];
    const unexpected: string[] = [];
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("oqupy_refresh", "saved-refresh");
        sessionStorage.setItem("seeded", "yes");
      }
    });
    await page.route("https://**/*", (route) => route.abort());
    await page.route("http://127.0.0.1:4400/api/v1/**", async (route) => {
      const req = route.request();
      const path = new URL(req.url()).pathname;
      if (path === "/api/v1/auth/refresh") {
        refreshes++;
        expect(req.postDataJSON()).toEqual({ refreshToken: "saved-refresh" });
        return route.fulfill(outcome === "refresh rejected"
          ? { status: 401, json: { message: "Expired refresh token" } }
          : { json: { accessToken: "renewed-access" } });
      }
      if (path === "/api/v1/auth/me") {
        const auth = req.headers().authorization;
        authorizations.push(auth);
        if (auth !== "Bearer renewed-access" || outcome === "retry rejected") {
          return route.fulfill({ status: 401, json: { message: "Expired access token" } });
        }
        return route.fulfill({ json: { id: "session-user", name: "Session User", role: "student", email: "session@example.test", phone: null } });
      }
      unexpected.push(path);
      return route.fulfill({ status: 500, json: { message: "Unexpected request" } });
    });
    await page.goto("/dashboard/profile");
    if (outcome === "recovered") {
      await expect(page.getByLabel("Display name")).toHaveValue("Session User");
      expect(authorizations).toEqual([undefined, "Bearer renewed-access"]);
      expect(await page.evaluate(() => localStorage.getItem("oqupy_refresh"))).toBe("saved-refresh");
    } else {
      await expect(page).toHaveURL(/\/login$/);
      expect(authorizations).toHaveLength(outcome === "refresh rejected" ? 1 : 2);
      expect(await page.evaluate(() => localStorage.getItem("oqupy_refresh"))).toBeNull();
    }
    expect(refreshes).toBe(1);
    expect(unexpected).toEqual([]);
  });
}
