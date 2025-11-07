"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Article } from "@/types/journal";
import { logAnalytics } from "@/lib/analytics";

type MetaBarProps = {
  article: Article;
};

const DEPTH_LEVELS = [25, 50, 75, 100];

export function MetaBar({ article }: MetaBarProps) {
  const [progress, setProgress] = useState(0);
  const reported = useRef<Set<number>>(new Set());
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    logAnalytics(`ArticleImpression:${article.slug}`);
    logAnalytics(`ArticleReadStart:${article.slug}`);
  }, [article.slug]);

  useEffect(() => {
    if (reduceMotion) return;
    const handleScroll = () => {
      const target = document.getElementById("article-content");
      if (!target) return;
      const top = target.getBoundingClientRect().top;
      const height = target.offsetHeight;
      const viewport = window.innerHeight;
      const distance = Math.min(Math.max(-top, 0), height);
      const pct = Math.min(100, Math.round((distance / (height - viewport / 2)) * 100));
      setProgress(pct);
      DEPTH_LEVELS.forEach((level) => {
        if (pct >= level && !reported.current.has(level)) {
          reported.current.add(level);
          logAnalytics(`ArticleReadDepth:${level}`);
        }
      });
    };
    const listener = () => handleScroll();
    window.addEventListener("scroll", listener);
    handleScroll();
    return () => window.removeEventListener("scroll", listener);
  }, [reduceMotion]);

  return (
    <aside
      aria-label="Article meta"
      className="sticky top-6 space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-ink"
    >
      {!reduceMotion ? (
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">Progress</p>
          <div className="mt-2 h-2 w-full rounded-full bg-border">
            <div
              className="h-full rounded-full bg-perazzi-red transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
      <p className="font-semibold">Share</p>
      <button
        type="button"
        className="text-perazzi-red focus-ring"
        onClick={() => {
          navigator.clipboard?.writeText(window.location.href);
          logAnalytics(`CategoryTabClick:share-${article.slug}`);
        }}
      >
        Copy link
      </button>
    </aside>
  );
}
