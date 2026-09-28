"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SiteHeader } from "@/components/ui/site-header";
const common = [
  { href: "/dashboard", label: "Overview", icon: "◫" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "▤" },
  { href: "/dashboard/profile", label: "Profile", icon: "◎" },
];
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => {
    if (signingOut) return;
    if (!isLoading && !user) router.replace("/login");
    else if (!isLoading && user && !user.role) router.replace("/onboarding");
  }, [isLoading, user, router, signingOut]);
  const ownerOnly =
    pathname.startsWith("/dashboard/studios") ||
    pathname.startsWith("/dashboard/blockouts");
  const allowed =
    (!ownerOnly || user?.role === "studio_owner") &&
    (!pathname.startsWith("/dashboard/admin") || user?.role === "admin");
  const links = [
    ...common.slice(0, 1),
    ...(user?.role === "studio_owner"
      ? [
          { href: "/dashboard/studios", label: "My studios", icon: "⌂" },
          { href: "/dashboard/blockouts", label: "Availability", icon: "◷" },
        ]
      : []),
    ...common.slice(1),
    ...(user?.role === "admin"
      ? [{ href: "/dashboard/admin", label: "Admin", icon: "⚙" }]
      : []),
  ];
  async function signOut() {
    setSigningOut(true);
    await logout();
    router.replace("/studios");
  }
  return (
    <>
      <SiteHeader />
      {isLoading || !user?.role ? (
        <main className="page-wrap empty-state" role="status">
          Opening your workspace…
        </main>
      ) : (
        <div className="workspace">
          <aside className="workspace-sidebar">
            <div className="workspace-identity">
              <span className="avatar">
                {(user.name || "O").slice(0, 1).toUpperCase()}
              </span>
              <div>
                <strong>{user.name || "Your account"}</strong>
                <p>{user.role.replace("_", " ")}</p>
              </div>
            </div>
            <p className="eyebrow sidebar-caption">YOUR WORKSPACE</p>
            <nav aria-label="Workspace navigation">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    (
                      item.href === "/dashboard"
                        ? pathname === item.href
                        : pathname.startsWith(item.href)
                    )
                      ? "page"
                      : undefined
                  }
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="workspace-help">
              <p>Find your next space.</p>
              <Link href="/studios" className="text-brand">
                Explore studios ↗
              </Link>
            </div>
            <button
              className="signout-button"
              onClick={signOut}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </aside>
          <main className="workspace-main" id="workspace-content">
            {allowed ? (
              children
            ) : (
              <section className="empty-state">
                <h1>This page isn’t available for your role</h1>
                <Link href="/dashboard" className="button-primary">
                  Back to overview
                </Link>
              </section>
            )}
          </main>
        </div>
      )}
    </>
  );
}
