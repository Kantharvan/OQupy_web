import { defineConfig, devices } from "@playwright/test";

if (!process.env.OQUPY_INTEGRATION_FIXTURE) {
  throw new Error(
    "Set OQUPY_INTEGRATION_FIXTURE to the isolated backend fixture file; see integration/README.md",
  );
}
export default defineConfig({
  testDir: "./integration",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-real-api",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        timezoneId: "America/New_York",
      },
    },
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/studios",
    reuseExistingServer: false,
  },
});
