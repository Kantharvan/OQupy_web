import type { ReactNode } from "react";
import { SiteHeader } from "@/components/ui/site-header";
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="auth-layout">
        <section className="auth-story">
          <p className="eyebrow">THE FLOOR IS YOURS</p>
          <h1>
            A little space.
            <br />
            <span>A lot of possibility.</span>
          </h1>
          <p>Make room for practice, people and your next big idea.</p>
          <div className="auth-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>
        <section className="auth-panel" aria-label={title}>
          <p className="eyebrow">WELCOME TO OQUPY</p>
          <h2>{title}</h2>
          <p className="page-description">{description}</p>
          {children}
        </section>
      </main>
    </>
  );
}
