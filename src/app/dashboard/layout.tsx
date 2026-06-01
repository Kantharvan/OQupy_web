"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/styles/tokens";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/studios", label: "My Studios", exact: false },
  { href: "/dashboard/bookings", label: "Bookings", exact: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();

  function handleLogout() {
    setUser(null);
    router.push("/login");
  }

  return (
    <div className={`min-h-screen ${t.page} flex flex-col`}>
      {/* Top navbar */}
      <header className={`shrink-0 border-b border-border bg-bg-card px-6 flex items-center gap-6 h-14`}>
        <span className={`text-lg font-black tracking-widest ${t.brandText} uppercase mr-2`}>OQupy</span>

        <nav className="flex items-center gap-1 flex-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? `bg-bg-input ${t.textPrimary}`
                    : `${t.textSecondary} hover:bg-bg-input hover:text-white`
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs ${t.textMuted} hidden sm:block`}>{user?.name ?? user?.email}</span>
          <button
            type="button"
            onClick={handleLogout}
            className={`text-xs ${t.textSecondary} hover:text-white transition-colors`}
          >
            Sign out →
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
