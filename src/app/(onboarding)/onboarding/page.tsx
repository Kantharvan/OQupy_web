"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { studioReturnPath } from "@/lib/booking/return-path";
import { AuthShell } from "@/components/auth/auth-shell";
import { t } from "@/styles/tokens";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api/users";

function OnboardingContent() {
  const next = studioReturnPath(useSearchParams().get("next"));
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
      const updated = await updateUserProfile(user.id, {
        name: name.trim(),
        role: "student",
      });
      setUser(updated);
      router.push(next || "/studios");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="What should we call you?"
      description="Make yourself at home. Set up your profile to start booking."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          aria-label="Display name"
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
    </AuthShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
