"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Tab = "phone" | "email";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setError("");
    router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);
    try {
      // TODO: replace with real API call once backend is ready
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message ?? "Login failed");
      // store token, redirect by role
      console.log("email login", email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-black tracking-widest text-[#f97316] uppercase">
          OQupy
        </h1>
        <p className="mt-2 text-[#a1a1aa] text-base">The floor is yours.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#141414] border border-[#27272a] rounded-2xl p-8">
        <h2 className="text-xl font-semibold text-white text-center mb-5">
          Sign in to continue
        </h2>

        {/* Tabs */}
        <div className="flex bg-[#1a1a1a] rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab("phone"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "phone"
                ? "bg-[#c2410c] text-white"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Phone / OTP
          </button>
          <button
            onClick={() => { setTab("email"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "email"
                ? "bg-[#c2410c] text-white"
                : "text-[#71717a] hover:text-white"
            }`}
          >
            Email / Password
          </button>
        </div>

        {/* Phone OTP tab */}
        {tab === "phone" && (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#3f3f46] rounded-xl px-4 h-12 focus-within:border-[#f97316] transition-colors">
              <span className="text-[#a1a1aa] text-sm font-medium shrink-0">+91</span>
              <div className="w-px h-5 bg-[#3f3f46]" />
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="flex-1 bg-transparent text-white placeholder-[#71717a] text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-[#c2410c] hover:bg-[#9a3412] active:bg-[#7c2d12] text-white font-semibold rounded-xl transition-colors"
            >
              Send OTP
            </button>
          </form>
        )}

        {/* Email/Password tab */}
        {tab === "email" && (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-[#1a1a1a] border border-[#3f3f46] rounded-xl px-4 text-white placeholder-[#71717a] text-sm outline-none focus:border-[#f97316] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-[#1a1a1a] border border-[#3f3f46] rounded-xl px-4 text-white placeholder-[#71717a] text-sm outline-none focus:border-[#f97316] transition-colors"
            />
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#c2410c] hover:bg-[#9a3412] active:bg-[#7c2d12] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <div className="text-right">
              <Link href="/forgot-password" className="text-[#71717a] hover:text-[#a1a1aa] text-xs transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#27272a]" />
          <span className="text-[#71717a] text-xs">OR</span>
          <div className="flex-1 h-px bg-[#27272a]" />
        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full h-12 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-black font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>

      {/* Register link */}
      <p className="mt-6 text-[#a1a1aa] text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#f97316] hover:text-[#fb923c] font-medium transition-colors">
          Register
        </Link>
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
