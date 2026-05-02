"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOTPPage() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const masked = phone.length >= 4 ? `+91 ••••••${phone.slice(-4)}` : "+91";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    setOtp((prev) => {
      const next = [...prev];
      digits.forEach((d, i) => { next[i] = d; });
      return next;
    });
    const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }, []);

  function handleResend() {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    inputRefs.current[0]?.focus();
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) return;
    // TODO: call verifyOTP(phone, code) → redirect
    console.log("verify", phone, code);
  }

  const filled = otp.join("").length === OTP_LENGTH;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      {/* Logo + subtitle */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-widest text-[#f97316] uppercase">
          OQupy
        </h1>
        <p className="mt-3 text-white text-base font-medium">
          Enter the code sent to your phone
        </p>
        <p className="mt-1 text-[#a1a1aa] text-sm">{masked}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#27272a] rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white text-center mb-6">
          Verify OTP
        </h2>

        <form onSubmit={handleVerify} className="flex flex-col gap-5">
          {/* 6-box OTP input */}
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
                className="w-11 h-13 bg-[#1a1a1a] border border-[#3f3f46] rounded-xl text-white text-xl font-bold text-center outline-none focus:border-[#f97316] transition-colors"
              />
            ))}
          </div>

          <p className="text-[#71717a] text-sm text-center">
            Enter the 6-digit code we sent you.
          </p>

          {/* Verify button */}
          <button
            type="submit"
            disabled={!filled}
            className="w-full h-13 bg-[#c2410c] hover:bg-[#9a3412] active:bg-[#7c2d12] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            Verify OTP
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          <p className="text-[#a1a1aa] text-sm">Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={!canResend}
            className="mt-1 text-sm font-medium text-[#71717a] disabled:cursor-not-allowed enabled:text-[#f97316] enabled:hover:text-[#fb923c] transition-colors"
          >
            {canResend ? "Resend OTP" : `Resend OTP (${countdown}s)`}
          </button>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/login"
        className="mt-6 flex items-center gap-1 text-[#f97316] hover:text-[#fb923c] text-sm font-medium transition-colors"
      >
        ← Back to Login
      </Link>
    </main>
  );
}
