"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEvent,
} from "react";
import { Heading } from "../heading";
import { Text } from "../text";
import { SectionRevealSmoke } from "./section-reveal-smoke";

type RevealCollapsedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading?: string;
  controlsId?: string;
  expanded: boolean;
  onExpand: () => void;
  readMoreLabel?: string;
}>;

export function RevealCollapsedHeader({
  headingId,
  heading,
  subheading,
  controlsId,
  expanded,
  onExpand,
  readMoreLabel = "Click to Expand",
}: RevealCollapsedHeaderProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const section = buttonRef.current?.closest("section");
    if (section) {
      delete section.dataset.revealExpanding;
    }
  }, []);

  useEffect(() => {
    const section = buttonRef.current?.closest("section");
    if (!section || section.dataset.revealInvite === "true") return;

    const triggerInvite = () => {
      section.dataset.revealInvite = "true";
    };

    if (typeof IntersectionObserver === "undefined") {
      triggerInvite();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          triggerInvite();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    const section = event.currentTarget.closest("section");
    if (section) {
      section.dataset.revealExpanding = "true";
    }
    onExpand();
  };

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <SectionRevealSmoke anchorRef={buttonRef} />
      <button
        type="button"
        className="relative z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-4 py-3 text-center transition-transform duration-300 focus-ring"
        onClick={handleExpand}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-labelledby={headingId}
        data-reveal-collapsed
        ref={buttonRef}
      >
        <div className="relative inline-flex text-white">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className="type-section-collapsed section-reveal-collapsed-text"
          >
            {heading}
          </Heading>
        </div>
        {subheading ? (
          <div className="relative text-white">
            <Text
              size="lg"
              className="type-section-subtitle type-section-subtitle-collapsed section-reveal-collapsed-text"
            >
              {subheading}
            </Text>
          </div>
        ) : null}
        <div className="mt-3">
          <Text
            asChild
            size="button"
            className="section-reveal-collapsed-text section-reveal-cta relative isolate inline-flex items-center justify-center overflow-hidden rounded-sm border border-white/40 bg-white/10 px-4 py-2 text-white/90 shadow-soft backdrop-blur-sm transition-colors duration-200"
          >
            <span>
              <span className="section-reveal-cta-label">{readMoreLabel}</span>
              <span
                className="section-reveal-cta-glint glint-sweep pointer-events-none absolute inset-0"
                aria-hidden="true"
              />
            </span>
          </Text>
        </div>
        <span className="sr-only">Expand {heading}</span>
      </button>
    </div>
  );
}
