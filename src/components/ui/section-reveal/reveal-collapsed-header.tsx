"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type SyntheticEvent,
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

  const activateTease = (event: SyntheticEvent<HTMLButtonElement>) => {
    const section = event.currentTarget.closest("section");
    if (!section) return;

    section.dataset.teaseActive = "true";
    if (section.dataset.teaseBound === "true") return;

    const clearTease = (leaveEvent?: Event) => {
      if (leaveEvent?.type === "focusout") {
        const nextTarget = (leaveEvent as FocusEvent).relatedTarget;
        if (nextTarget && section.contains(nextTarget as Node)) return;
      }
      delete section.dataset.teaseActive;
    };

    section.addEventListener("mouseleave", clearTease);
    section.addEventListener("focusout", clearTease);
    section.dataset.teaseBound = "true";
  };

  const handleExpand = (event: MouseEvent<HTMLButtonElement>) => {
    const section = event.currentTarget.closest("section");
    if (section) {
      delete section.dataset.teaseActive;
      section.dataset.revealExpanding = "true";
    }
    onExpand();
  };

  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <SectionRevealSmoke anchorRef={buttonRef} />
      <button
        type="button"
        className="group relative z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-4 py-3 text-center transition-transform duration-300 focus-ring"
        onClick={handleExpand}
        onPointerEnter={activateTease}
        onFocus={activateTease}
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-labelledby={headingId}
        data-tease-trigger
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
            className="section-reveal-collapsed-text section-reveal-cta relative isolate inline-flex items-center justify-center overflow-hidden rounded-sm border border-white/40 bg-white/10 px-4 py-2 text-white/90 shadow-soft backdrop-blur-sm transition-colors duration-200 group-hover:border-white/60 group-hover:bg-white/15 group-hover:text-white group-focus-visible:border-white/60 group-focus-visible:bg-white/15 group-focus-visible:text-white"
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
