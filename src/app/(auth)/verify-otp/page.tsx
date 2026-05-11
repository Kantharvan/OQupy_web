"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { t } from "@/styles/tokens";
import { verifyOTP } from "@/lib/api/auth";
import { useAuth } from "@/context/AuthContext";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const IS_DEV = process.env.NODE_ENV === "development";

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const phone = searchParams.get("phone") ?? "";
  const masked = phone.length >= 4 ? `+91 ••••••${phone.slice(-4)}` : "+91";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Dev only: auto-fetch OTP from Redis via local API route
  useEffect(() => {
    if (!IS_DEV || !phone) return;
    const fetchDevOtp = async () => {
      try {
        const res = await fetch(`/api/dev/otp?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (data.otp) setDevOtp(data.otp);
      } catch {
        // silently ignore in dev
      }
    };
    // Poll briefly after page loads to catch the OTP
    fetchDevOtp();
    const interval = setInterval(fetchDevOtp, 3000);
    return () => clearInterval(interval);
  }, [phone]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => { const next = [...prev]; next[index] = digit; return next; });
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    setOtp((prev) => { const next = [...prev]; digits.forEach((d, i) => { next[i] = d; }); return next; });
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  }, []);

  function handleResend() {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    setError(null);
    setDevOtp(null);
    inputRefs.current[0]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { user, isNewUser } = await verifyOTP(phone, code);
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
      setError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
      setIsSubmitting(false);
    }
  }

  const filled = otp.join("").length === OTP_LENGTH;

  return (
    <main className={`min-h-screen ${t.page} flex flex-col items-center justify-center px-4`}>
      {/* Dev OTP toast */}
      {IS_DEV && devOtp && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-400 text-black text-sm font-mono font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">DEV</span>
          <span>OTP: {devOtp}</span>
          <button
            onClick={() => {
              const digits = devOtp.split("");
              setOtp((prev) => {
                const next = [...prev];
                digits.forEach((d, i) => { next[i] = d; });
                return next;
              });
              inputRefs.current[OTP_LENGTH - 1]?.focus();
            }}
            className="ml-1 underline text-xs opacity-80 hover:opacity-100"
          >
            autofill
          </button>
          <button onClick={() => setDevOtp(null)} className="ml-1 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="mb-8 text-center">
        <h1 className={`text-5xl font-black tracking-widest ${t.brandText} uppercase`}>OQupy</h1>
        <p className={`mt-3 ${t.textPrimary} text-base font-medium`}>Enter the code sent to your phone</p>
        <p className={`mt-1 ${t.textSecondary} text-sm`}>{masked}</p>
      </div>

      <div className={`w-full max-w-sm ${t.cardBox} p-8`}>
        <h2 className={`text-xl font-semibold ${t.textPrimary} text-center mb-6`}>Verify OTP</h2>

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          <div className="flex gap-2 justify-between" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-13 ${t.input} border ${t.borderInput} rounded-xl text-white text-xl font-bold text-center outline-none focus:border-brand transition-colors`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <p className={`${t.textMuted} text-sm text-center`}>Enter the 6-digit code we sent you.</p>

          <button
            type="submit"
            disabled={!filled || isSubmitting}
            className={`w-full h-13 ${t.btnPrimary}`}
          >
            {isSubmitting ? "Verifying…" : "Verify OTP"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className={`${t.textSecondary} text-sm`}>Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`mt-1 text-sm font-medium transition-colors ${
              canResend ? `${t.brandText} hover:text-[#fb923c]` : `${t.textMuted} cursor-not-allowed`
            }`}
          >
            {canResend ? "Resend OTP" : `Resend OTP (${countdown}s)`}
          </button>
        </div>
      </div>

      <Link href="/login" className={`mt-6 flex items-center gap-1 ${t.link} text-sm font-medium`}>
        ← Back to Login
      </Link>
    </main>
  );
}
