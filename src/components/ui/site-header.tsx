"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function SiteHeader() {
  const { user } = useAuth();
  return (
    <header className="site-header">
      <Link href="/studios" aria-label="Oqupy home" className="wordmark">
        OQ<span>U</span>PY<span className="brand-dot">.</span>
      </Link>
      <nav
        aria-label="Main navigation"
        className="flex items-center gap-5 text-sm"
      >
        <Link href="/studios" className="header-explore">
          Explore studios
        </Link>
        <Link
          href={user ? "/dashboard" : "/login"}
          className="button-secondary"
        >
          {user ? "My workspace" : "Sign in"}
          <span aria-hidden="true"> ↗</span>
        </Link>
      </nav>
    </header>
  );
}
