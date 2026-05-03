"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/styles/tokens";
import { useAuth } from "@/context/AuthContext";
import { updateUserRole } from "@/lib/api/users";
import { type User } from "@/lib/api/auth";

type Role = NonNullable<User["role"]>;

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
  {
    value: "student",
    label: "Student",
    description: "Discover and book studio spaces near you",
    icon: "🎓",
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "Teach classes and manage your schedule",
    icon: "🎤",
  },
  {
    value: "studio_owner",
    label: "Studio Owner",
    description: "List your studio and manage bookings",
    icon: "🏢",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full platform access and management",
    icon: "⚙️",
  },
];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected || !user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateUserRole(user.id, selected);
      setUser(updated);
      if (selected === "student") router.push("/studios");
      else if (selected === "admin") router.push("/admin");
      else router.push("/dashboard");
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

      {/* Card */}
      <div className={`w-full max-w-md ${t.cardBox} p-8`}>
        <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-2`}>
          Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h2>
        <p className={`${t.textSecondary} text-sm text-center mb-8`}>
          How will you be using OQupy?
        </p>

        {/* Role picker */}
        <div className="flex flex-col gap-3 mb-6">
          {ROLES.map((role) => {
            const isActive = selected === role.value;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelected(role.value)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-colors text-left ${
                  isActive
                    ? "border-brand bg-bg-input"
                    : `${t.borderInput} ${t.input} hover:border-text-muted`
                }`}
              >
                <span className="text-2xl shrink-0">{role.icon}</span>
                <div>
                  <p className={`font-semibold text-sm ${t.textPrimary}`}>{role.label}</p>
                  <p className={`text-xs mt-0.5 ${t.textMuted}`}>{role.description}</p>
                </div>
                {isActive && (
                  <span className={`ml-auto shrink-0 ${t.brandText} text-lg`}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          className={`w-full h-12 ${t.btnPrimary}`}
        >
          {isSubmitting ? "Setting up your account…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
