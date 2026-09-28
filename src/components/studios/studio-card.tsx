import Image from "next/image";
import Link from "next/link";
import type { Studio } from "@/lib/api/studios";
import { priceLabel } from "@/lib/booking/price";

export function StudioImage({
  studio,
  large = false,
}: {
  studio: Studio;
  large?: boolean;
}) {
  return (
    <div className={`studio-image ${large ? "studio-image-large" : ""}`}>
      {studio.images[0] ? (
        <Image
          src={studio.images[0]}
          alt={`${studio.name} interior`}
          fill
          unoptimized
          sizes={
            large
              ? "(max-width: 900px) 100vw, 60vw"
              : "(max-width: 640px) 100vw, 33vw"
          }
          className="object-cover"
        />
      ) : (
        <div className="studio-placeholder">
          <span className="floor-lines" aria-hidden="true" />
          <span className="relative text-xs tracking-[.2em] uppercase">
            {studio.type[0] || "Studio"} space
          </span>
          <span className="relative text-sm text-stone-400">
            Photos coming soon
          </span>
        </div>
      )}
      <span className="studio-category">
        {studio.type.join(" / ") || "Creative space"}
      </span>
    </div>
  );
}

export function StudioCard({ studio }: { studio: Studio }) {
  return (
    <Link
      href={`/studios/${encodeURIComponent(studio.name)}`}
      className="studio-card group"
    >
      <StudioImage studio={studio} />
      <div className="p-5">
        <p className="text-sm text-stone-400 mb-2">{studio.location}</p>
        <h3 className="text-xl font-semibold tracking-tight group-hover:text-orange-300 transition-colors">
          {studio.name}
        </h3>
        <p className="mt-3 text-sm leading-6 text-stone-400 line-clamp-2">
          {studio.description ||
            "A space for your next session. Explore amenities and available times."}
        </p>
        {studio.amenities.length > 0 && (
          <p className="mt-4 text-xs text-stone-300">
            {studio.amenities.slice(0, 3).join(" · ")}
          </p>
        )}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="font-semibold">{priceLabel(studio.price)}</span>
          <span className="text-sm text-orange-300">
            Explore <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
