import Link from "next/link";
import { SiteHeader } from "@/components/ui/site-header";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="page-wrap">
        <section className="empty-state mt-12">
          <p className="eyebrow">A LITTLE LOST?</p>
          <h1 className="detail-title">Let’s find your space.</h1>
          <p>
            This page isn’t here. There are still plenty of places to explore.
          </p>
          <Link href="/studios" className="button-primary">
            Explore studios ↗
          </Link>
        </section>
      </main>
    </>
  );
}
