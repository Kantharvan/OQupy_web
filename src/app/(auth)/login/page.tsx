"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { studioReturnPath } from "@/lib/booking/return-path";
import { GoogleLogin } from "@react-oauth/google";
import { t } from "@/styles/tokens";
import { sendOTP, googleAuth } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const next = studioReturnPath(useSearchParams().get("next"));
  const [phone, setPhone] = useState("");
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();
  const { setUser } = useAuth();
  const isReady = phone.length === 10;
  // Google Sign-In is origin-restricted; Vercel preview URLs aren't whitelisted in Google Cloud Console.
  const showGoogle =
    !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview";

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!isReady || isSending) return;
    setIsSending(true);
    setOtpError(null);
    try {
      await sendOTP(phone);
      router.push(
        `/verify-otp?phone=${encodeURIComponent(phone)}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
      );
    } catch (err) {
      setOtpError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again.",
      );
      setIsSending(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: {
    credential?: string;
  }) {
    if (!credentialResponse.credential) {
      setGoogleError("Google sign-in failed. Please try again.");
      return;
    }
    setGoogleError(null);
    try {
      const { user, isNewUser } = await googleAuth(
        credentialResponse.credential,
      );
      setUser(user);
      if (isNewUser || !user.role) {
        router.push(
          `/onboarding${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        );
      } else if (next && user.role !== "studio_owner") {
        router.push(next);
      } else if (user.role === "student") {
        router.push("/studios");
      } else if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setGoogleError(
        err instanceof Error ? err.message : "Google sign-in failed.",
      );
    }
  }

  return (
    <main
      className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4`}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1
          className={`text-5xl font-black tracking-widest ${t.brandText} uppercase`}
        >
          OQupy
        </h1>
        <p className={`mt-2 ${t.textSecondary} text-base`}>
          The floor is yours.
        </p>
      </div>

      {/* Card */}
      <div className={`w-full max-w-sm ${t.cardBox} p-8`}>
        <h2
          className={`text-xl font-semibold ${t.textPrimary} text-center mb-6`}
        >
          A space is waiting for you
        </h2>

        <p className="text-center text-sm text-stone-400 mb-6">
          {next
            ? "Sign in to continue your booking. Your selected time will be checked again."
            : "Sign in to book spaces and manage your sessions."}
        </p>
        {/* Phone OTP form */}
        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-2 ${t.input} border ${t.borderInput} rounded-xl px-4 h-12 focus-within:border-brand transition-colors`}
          >
            <span className={`${t.textSecondary} text-sm font-medium shrink-0`}>
              +91
            </span>
            <div className="w-px h-5 bg-border-input" />
            <input
              aria-label="Phone number"
              autoComplete="tel-national"
              inputMode="numeric"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={`min-w-0 flex-1 bg-transparent ${t.textPrimary} placeholder:text-text-muted text-sm outline-none`}
            />
          </div>
          {otpError && (
            <p className="text-red-400 text-sm text-center">{otpError}</p>
          )}
          <button
            type="submit"
            disabled={!isReady || isSending}
            className={`w-full h-12 ${t.btnPrimary}`}
          >
            {isSending ? "Sending…" : "Send OTP"}
          </button>
        </form>

        {/* Divider + Google — hidden on Vercel preview (unregistered origin) */}
        {showGoogle && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className={t.dividerLine} />
              <span className={`${t.textMuted} text-xs`}>OR</span>
              <div className={t.dividerLine} />
            </div>
            {googleError && (
              <p className="text-red-400 text-sm text-center mb-3">
                {googleError}
              </p>
            )}
            <div className="flex justify-center min-w-0">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setGoogleError("Google sign-in was cancelled or failed.")
                }
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="continue_with"
                width="240"
              />
            </div>
          </>
        )}
      </div>
      <Link href={next || "/studios"} className="back-link mt-6">
        ← {next ? "Back to your studio" : "Explore studios first"}
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
