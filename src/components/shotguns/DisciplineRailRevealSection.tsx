"use client";

import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  Container,
  RevealAnimatedBody,
  RevealCollapsedHeader,
  RevealExpandedHeader,
  RevealGroup,
  RevealItem,
  SectionBackdrop,
  SectionShell,
  useRevealHeight,
} from "@/components/ui";

import type {
  DisciplineCard,
  DisciplineCategory,
  DisciplineRailBackground,
} from "./DisciplineRailData";
import { DisciplineRailBody } from "./DisciplineRailBody";

type DisciplineRailRevealSectionProps = {
  readonly categories: DisciplineCategory[];
  readonly selectedDiscipline: DisciplineCard | null;
  readonly heading: string;
  readonly subheading: string;
  readonly background: DisciplineRailBackground;
  readonly openCategory: string | null;
  readonly setOpenCategory: Dispatch<SetStateAction<string | null>>;
  readonly activeDisciplineId: string | null;
  readonly setActiveDisciplineId: Dispatch<SetStateAction<string | null>>;
  readonly platformName: (id: string) => string;
  readonly handleModelSelect: (id: string) => void;
  readonly modelLoadingId: string | null;
  readonly enableTitleReveal: boolean;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
};

export function DisciplineRailRevealSection({
  categories,
  selectedDiscipline,
  heading,
  subheading,
  background,
  openCategory,
  setOpenCategory,
  activeDisciplineId,
  setActiveDisciplineId,
  platformName,
  handleModelSelect,
  modelLoadingId,
  enableTitleReveal,
  onCollapsedChange,
}: DisciplineRailRevealSectionProps) {
  const [railExpanded, setRailExpanded] = useState(!enableTitleReveal);
  const [headerThemeReady, setHeaderThemeReady] = useState(!enableTitleReveal);
  const revealRail = !enableTitleReveal || railExpanded;
  const revealPhotoFocus = revealRail;
  const railMinHeight =
    enableTitleReveal && !revealRail ? "min-h-[50vh]" : null;
  const {
    ref: railShellRef,
    contentRef,
    measureRef,
    minHeightStyle,
    beginExpand,
    clearPremeasure,
    isPreparing,
  } = useRevealHeight({
    enableObserver: enableTitleReveal && revealRail,
    deps: [openCategory, activeDisciplineId, modelLoadingId],
  });
  const revealRailForMeasure = revealRail || isPreparing;

  const handleExpand = () => {
    if (!enableTitleReveal) return;
    onCollapsedChange?.(false);
    beginExpand(() => {
      setRailExpanded(true);
      setHeaderThemeReady(true);
    });
  };

  const handleCollapse = () => {
    if (!enableTitleReveal) return;
    clearPremeasure();
    setHeaderThemeReady(false);
    setRailExpanded(false);
    onCollapsedChange?.(true);
  };

  const expandedContent = (
    <div ref={contentRef}>
      <RevealAnimatedBody sequence>
        <RevealItem index={0}>
          <RevealExpandedHeader
            headingId="discipline-rail-heading"
            heading={heading}
            subheading={subheading}
            headerThemeReady={headerThemeReady}
            enableTitleReveal={enableTitleReveal}
            onCollapse={handleCollapse}
          />
        </RevealItem>
        <RevealGroup delayMs={140}>
          <DisciplineRailBody
            revealRail={revealRailForMeasure}
            categories={categories}
            openCategory={openCategory}
            setOpenCategory={setOpenCategory}
            activeDisciplineId={activeDisciplineId}
            setActiveDisciplineId={setActiveDisciplineId}
            selectedDiscipline={selectedDiscipline}
            platformName={platformName}
            handleModelSelect={handleModelSelect}
            modelLoadingId={modelLoadingId}
          />
        </RevealGroup>
      </RevealAnimatedBody>
    </div>
  );

  return (
    <>
      <SectionBackdrop
        image={{ url: background.url, alt: background.alt }}
        reveal={revealRail}
        revealOverlay={revealPhotoFocus}
        preparing={isPreparing}
        enableParallax={enableTitleReveal && !revealRail}
        overlay="canvas"
      />

      <Container size="xl" className="relative z-10">
        <SectionShell
          ref={railShellRef}
          style={minHeightStyle}
          reveal={revealPhotoFocus}
          minHeightClass={railMinHeight ?? undefined}
        >
          {revealRail ? (
            expandedContent
          ) : (
            <>
              <RevealCollapsedHeader
                headingId="discipline-rail-heading"
                heading={heading}
                subheading={subheading}
                controlsId="discipline-rail-body"
                expanded={revealRail}
                onExpand={handleExpand}
              />
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
