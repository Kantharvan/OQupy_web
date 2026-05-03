"use client";

import { t } from "@/styles/tokens";

export default function OnboardingPage() {
  return (
    <main className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4`}>
      <div className={`w-full max-w-sm ${t.cardBox} p-8 text-center`}>
        <h1 className={`text-2xl font-bold ${t.textPrimary} mb-2`}>Welcome to OQupy</h1>
        <p className={`${t.textSecondary} text-sm`}>
          Let&apos;s get you set up. Onboarding coming soon.
        </p>
      </div>
    </main>
  );
}
