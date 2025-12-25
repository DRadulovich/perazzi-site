import Image from "next/image";
import type { FactoryAsset } from "@/types/content";

type TeaserBlockProps = Readonly<{
  copy: string;
  href: string;
  title?: string;
  engravingTile: FactoryAsset;
  woodTile: FactoryAsset;
}>;

export function TeaserBlock({
  copy,
  href,
  title = "Engraving grades",
  engravingTile,
  woodTile,
}: TeaserBlockProps) {
  const engravingRatio = engravingTile.aspectRatio ?? 4 / 3;
  const woodRatio = woodTile.aspectRatio ?? 4 / 3;

  return (
    <section
      data-analytics-id="ShotgunsGradesCTA"
      className="rounded-2xl border border-white/15 bg-[linear-gradient(135deg,#070707,#101010)]/95 px-4 py-6 text-white shadow-elevated ring-1 ring-white/10 backdrop-blur-sm sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-white/80">
            {copy}
          </p>
          <div className="flex flex-wrap gap-4">
            <figure className="w-40 rounded-2xl border border-white/30 bg-white/5 p-3">
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: engravingRatio }}
              >
                <Image
                  src={engravingTile.url}
                  alt={engravingTile.alt}
                  fill
                  sizes="160px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-2 text-[11px] sm:text-xs text-white/70">
                Engraving atelier
              </figcaption>
            </figure>
            <figure className="w-40 rounded-2xl border border-white/30 bg-white/5 p-3">
              <div
                className="relative overflow-hidden rounded-lg"
                style={{ aspectRatio: woodRatio }}
              >
                <Image
                  src={woodTile.url}
                  alt={woodTile.alt}
                  fill
                  sizes="160px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-2 text-[11px] sm:text-xs text-white/70">
                Wood provenance
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="md:flex md:justify-end">
          <a
            href={href}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/40 px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white focus-ring"
          >
            <span>View grades</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
