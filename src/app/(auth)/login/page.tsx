"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { t } from "@/styles/tokens";
import { googleAuth } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [googleError, setGoogleError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useAuth();
  const isReady = phone.length === 10;

  function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!isReady) return;
    router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  }

  async function handleGoogleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setGoogleError("Google sign-in failed. Please try again.");
      return;
    }
    setGoogleError(null);
    try {
      const { user, isNewUser } = await googleAuth(credentialResponse.credential);
      setUser(user);
      if (isNewUser || !user.role) {
        router.push("/onboarding");
      } else if (user.role === "student") {
        router.push("/studios");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <main className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4`}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className={`text-5xl font-black tracking-widest ${t.brandText} uppercase`}>
          OQupy
        </h1>
        <p className={`mt-2 ${t.textSecondary} text-base`}>The floor is yours.</p>
      </div>

      {/* Card */}
      <div className={`w-full max-w-sm ${t.cardBox} p-8`}>
        <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-6`}>
          Sign in to continue
        </h2>

        {/* Phone OTP form */}
        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
          <div className={`flex items-center gap-2 ${t.input} border ${t.borderInput} rounded-xl px-4 h-12 focus-within:border-brand transition-colors`}>
            <span className={`${t.textSecondary} text-sm font-medium shrink-0`}>+91</span>
            <div className="w-px h-5 bg-border-input" />
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`flex-1 bg-transparent ${t.textPrimary} placeholder:text-text-muted text-sm outline-none`}
            />
          </div>
          <button
            type="submit"
            disabled={!isReady}
            className={`w-full h-12 ${t.btnPrimary}`}
          >
            Send OTP
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className={t.dividerLine} />
          <span className={`${t.textMuted} text-xs`}>OR</span>
          <div className={t.dividerLine} />
        </div>

        {/* Google */}
        {googleError && (
          <p className="text-red-400 text-sm text-center mb-3">{googleError}</p>
        )}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setGoogleError("Google sign-in was cancelled or failed.")}
            theme="filled_black"
            shape="rectangular"
            size="large"
            text="continue_with"
            width="360"
          />
        </div>
      </div>
    </main>
  );
}
