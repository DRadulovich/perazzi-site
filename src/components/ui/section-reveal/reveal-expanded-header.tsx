"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Heading } from "../heading";
import { Text } from "../text";

type RevealExpandedHeaderProps = Readonly<{
  headingId: string;
  heading: string;
  subheading?: string;
  headerThemeReady: boolean;
  enableTitleReveal: boolean;
  onCollapse: () => void;
  collapseLabel?: string;
  children?: ReactNode;
}>;

export function RevealExpandedHeader({
  headingId,
  heading,
  subheading,
  headerThemeReady,
  enableTitleReveal,
  onCollapse,
  collapseLabel = "Collapse",
  children,
}: RevealExpandedHeaderProps) {
  return (
    <div className="relative z-10 space-y-4 md:flex md:items-center md:justify-between md:gap-8">
      <div className="space-y-3">
        <div className="relative">
          <Heading
            id={headingId}
            level={2}
            size="xl"
            className={headerThemeReady ? "text-ink" : "text-white"}
          >
            {heading}
          </Heading>
        </div>
        {subheading ? (
          <div className="relative">
            <Text
              size="lg"
              className={cn(
                "type-section-subtitle",
                headerThemeReady ? "text-ink-muted" : "text-white",
              )}
            >
              {subheading}
            </Text>
          </div>
        ) : null}
        {children}
      </div>
      {enableTitleReveal ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center justify-center type-button text-ink-muted hover:text-ink focus-ring md:mt-0"
          onClick={onCollapse}
        >
          {collapseLabel}
        </button>
      ) : null}
    </div>
  );
}
