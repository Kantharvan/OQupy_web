"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/styles/tokens";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/api/users";
import { type User } from "@/lib/api/auth";

type Role = NonNullable<User["role"]>;

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
  { value: "student", label: "Student", description: "Discover and book studio spaces near you", icon: "🎓" },
  { value: "instructor", label: "Instructor", description: "Teach classes and manage your schedule", icon: "🎤" },
  { value: "studio_owner", label: "Studio Owner", description: "List your studio and manage bookings", icon: "🏢" },
  { value: "admin", label: "Admin", description: "Full platform access and management", icon: "⚙️" },
];

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(user?.name ?? "");
  const [selected, setSelected] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNextStep(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(2);
  }

  async function handleContinue() {
    if (!selected || !user || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const updated = await updateUserProfile(user.id, { name: name.trim(), role: selected });
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

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-brand text-white" : "bg-bg-input text-text-muted"}`}>1</div>
        <div className={`w-8 h-0.5 ${step === 2 ? "bg-brand" : "bg-border-input"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? "bg-brand text-white" : "bg-bg-input text-text-muted"}`}>2</div>
      </div>

      <div className={`w-full max-w-md ${t.cardBox} p-8`}>

        {/* Step 1 — Name */}
        {step === 1 && (
          <>
            <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-2`}>
              What should we call you?
            </h2>
            <p className={`${t.textSecondary} text-sm text-center mb-8`}>
              This is how you&apos;ll appear to others on OQupy.
            </p>
            <form onSubmit={handleNextStep} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={`w-full h-12 ${t.inputField} px-4`}
              />
              <button
                type="submit"
                disabled={!name.trim()}
                className={`w-full h-12 ${t.btnPrimary}`}
              >
                Continue
              </button>
            </form>
          </>
        )}

        {/* Step 2 — Role */}
        {step === 2 && (
          <>
            <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-2`}>
              How will you use OQupy{name ? `, ${name.split(" ")[0]}` : ""}?
            </h2>
            <p className={`${t.textSecondary} text-sm text-center mb-6`}>
              Pick the role that fits you best.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {ROLES.map((role) => {
                const isActive = selected === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelected(role.value)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-colors text-left ${
                      isActive ? "border-brand bg-bg-input" : `${t.borderInput} ${t.input} hover:border-text-muted`
                    }`}
                  >
                    <span className="text-2xl shrink-0">{role.icon}</span>
                    <div>
                      <p className={`font-semibold text-sm ${t.textPrimary}`}>{role.label}</p>
                      <p className={`text-xs mt-0.5 ${t.textMuted}`}>{role.description}</p>
                    </div>
                    {isActive && <span className={`ml-auto shrink-0 ${t.brandText} text-lg`}>✓</span>}
                  </button>
                );
              })}
            </div>

            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`h-12 px-5 rounded-xl border ${t.borderInput} ${t.textSecondary} text-sm font-medium hover:border-text-muted transition-colors`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selected || isSubmitting}
                className={`flex-1 h-12 ${t.btnPrimary}`}
              >
                {isSubmitting ? "Setting up your account…" : "Get started"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
