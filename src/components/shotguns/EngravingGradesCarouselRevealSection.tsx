"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import { cn } from "@/lib/utils";
import { choreoDistance, dreamyPace } from "@/lib/choreo";
import {
  ChoreoGroup,
  Container,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  Text,
  useRevealHeight,
} from "@/components/ui";
import type { GradeSeries } from "@/types/catalog";

import type {
  EngravingCategory,
  EngravingCarouselBackground,
} from "./EngravingGradesCarouselData";
import { EngravingGradesCarouselBody } from "./EngravingGradesCarouselBody";

type EngravingRevealSectionProps = {
  readonly categories: EngravingCategory[];
  readonly selectedGrade: GradeSeries | null;
  readonly heading: string;
  readonly subheading: string;
  readonly background: EngravingCarouselBackground;
  readonly ctaLabel: string;
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly resolvedOpenCategory: string | null;
  readonly activeGradeId: string | null;
  readonly setActiveGradeId: Dispatch<SetStateAction<string | null>>;
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

export function EngravingGradesCarouselRevealSection({
  categories,
  selectedGrade,
  heading,
  subheading,
  background,
  ctaLabel,
  openCategory,
  setOpenCategory,
  resolvedOpenCategory,
  activeGradeId,
  setActiveGradeId,
  enableTitleReveal,
  onCollapsedChange,
}: EngravingRevealSectionProps) {
  const [carouselExpanded, setCarouselExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);

  const revealCarousel = !enableTitleReveal || carouselExpanded;
  const revealPhotoFocus = revealCarousel;
  const carouselMinHeight = enableTitleReveal ? "min-h-[50vh]" : null;
  const {
    ref: carouselShellRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealCarousel,
    deps: [openCategory, activeGradeId],
  });

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setCarouselExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setCarouselExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <RevealAnimatedBody sequence>
      <RevealItem index={0}>
        <RevealExpandedHeader
          headingId="engraving-grades-heading"
          heading={heading}
          headerThemeReady={headerThemeReady}
          enableTitleReveal={enableTitleReveal}
          onCollapse={handleCollapse}
        >
          <div className="relative">
            <Text
              className={cn(
                "max-w-4xl type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
              leading="normal"
            >
              {subheading}
            </Text>
          </div>
        </RevealExpandedHeader>
      </RevealItem>
      <RevealGroup delayMs={140}>
        <EngravingGradesCarouselBody
          categories={categories}
          resolvedOpenCategory={resolvedOpenCategory}
          activeGradeId={activeGradeId}
          setOpenCategory={setOpenCategory}
          setActiveGradeId={setActiveGradeId}
          selectedGrade={selectedGrade}
          ctaLabel={ctaLabel}
        />
      </RevealGroup>
    </RevealAnimatedBody>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealCarousel}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealCarousel}
        overlay="canvas-80"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={carouselShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={carouselMinHeight ?? undefined}
        >
          {revealCarousel ? (
            expandedContent
          ) : (
            <>
              <ChoreoGroup
                effect="fade-lift"
                distance={choreoDistance.base}
                durationMs={dreamyPace.textMs}
                easing={dreamyPace.easing}
                staggerMs={dreamyPace.staggerMs}
                itemClassName="absolute inset-0"
              >
                <RevealCollapsedHeader
                  headingId="engraving-grades-heading"
                  heading={heading}
                  subheading={subheading}
                  controlsId="engraving-grades-body"
                  expanded={revealCarousel}
                  onExpand={handleExpand}
                />
              </ChoreoGroup>
              <div ref={measureRef} className="section-reveal-measure" aria-hidden>
                {expandedContent}
              </div>
            </>
          )}
        </SectionShell>
      </Container>
    </>
  );
}
