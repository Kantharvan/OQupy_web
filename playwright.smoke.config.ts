import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./smoke",
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 45000,
  reporter: [
    ["list"],
    ["html", { outputFolder: "smoke-report", open: "never" }],
  ],
  use: {
    baseURL: "https://oqupy-web.vercel.app",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-live",
      use: { ...devices["Desktop Chrome"], timezoneId: "Asia/Kolkata" },
    },
    {
      name: "mobile-live",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        timezoneId: "America/New_York",
      },
    },
  ],
});
