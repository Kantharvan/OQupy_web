"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/styles/tokens";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api/users";

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateUserProfile(user.id, { name: name.trim(), role: "student" });
      setUser(updated);
      router.push("/studios");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4 py-12`}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className={`text-5xl font-black tracking-widest ${t.brandText} uppercase`}>OQupy</h1>
        <p className={`mt-2 ${t.textSecondary} text-base`}>The floor is yours.</p>
      </div>

      <div className={`w-full max-w-md ${t.cardBox} p-8`}>
        <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-2`}>
          What should we call you?
        </h2>
        <p className={`${t.textSecondary} text-sm text-center mb-8`}>
          This is how you&apos;ll appear to others on OQupy.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className={`w-full h-12 ${t.inputField} px-4`}
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className={`w-full h-12 ${t.btnPrimary}`}
          >
            {isSubmitting ? "Setting up your account…" : "Get started"}
          </button>
        </form>
      </div>
    </main>
  );
}
