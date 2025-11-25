"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { MatteChip } from "./CinematicSection";

export type CatalogModelCard = {
  id: string;
  name: string;
  platform?: string;
  use?: string;
  grade?: string;
  gauges?: string[];
  imageUrl?: string | null;
};

type CatalogGridProps = {
  models: CatalogModelCard[];
  emptyState?: ReactNode;
};

type CatalogTileProps = {
  model: CatalogModelCard;
  index: number;
  className?: string;
};

export function CatalogTile({ model, index, className }: CatalogTileProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.article
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 18 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.72, ease: "easeOut", delay: index * 0.05 }}
      whileHover={prefersReducedMotion ? undefined : { translateY: -4, scale: 1.01 }}
      className={clsx(
        "group relative flex min-h-[300px] flex-col overflow-hidden rounded-2xl border border-white/12 bg-white/6 shadow-[0_36px_150px_rgba(0,0,0,0.6)] backdrop-blur-2xl after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1/2 after:bg-[radial-gradient(circle_at_50%_120%,rgba(219,16,2,0.22),transparent_60%)]",
        className,
      )}
    >
      <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 md:h-52">
        <div
          className={clsx(
            "absolute inset-0 bg-cover bg-center transition duration-700",
            model.imageUrl ? "opacity-85 group-hover:opacity-100" : "opacity-30",
          )}
          style={{ backgroundImage: model.imageUrl ? `url(${model.imageUrl})` : undefined }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
      </div>
      <div className="relative z-10 flex flex-1 flex-col justify-between p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {model.platform ? <Pill>{model.platform}</Pill> : null}
            {model.use ? <Pill>{model.use}</Pill> : null}
            {model.grade ? <Pill>{model.grade}</Pill> : null}
          </div>
          <h3 className="text-xl font-semibold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]">{model.name}</h3>
          {model.gauges?.length ? (
            <p className="text-sm text-white/75 drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]">
              Gauges: {model.gauges.slice(0, 3).join(" • ")}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-white/60">
          <span>glass catalogue</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white/80">Hover to inspect</span>
        </div>
      </div>
    </motion.article>
  );
}

export function CatalogGrid({ models, emptyState }: CatalogGridProps) {
  if (!models.length) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((model, index) => (
        <CatalogTile key={model.id} model={model} index={index} />
      ))}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <MatteChip className="bg-black/70 px-3 py-1 text-[10px] tracking-[0.18em]">{children}</MatteChip>;
}
