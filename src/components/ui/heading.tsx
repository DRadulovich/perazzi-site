import { forwardRef, type HTMLAttributes, type JSX } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  // Display / hero heading: tuned for mobile, scales up on larger screens
  display: "text-3xl sm:text-4xl lg:text-5xl font-semibold font-serif tracking-tight",
  // XL heading: primary section headings
  xl: "text-2xl sm:text-3xl lg:text-4xl font-semibold",
  // LG heading: strong subheadings
  lg: "text-xl sm:text-2xl font-semibold",
  // MD heading: default heading size
  md: "text-lg sm:text-xl font-semibold",
  // SM heading: compact / inline headings
  sm: "text-base sm:text-lg font-medium",
} as const;

type HeadingSize = keyof typeof sizeClasses;
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  asChild?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: HeadingSize;
  muted?: boolean;
};

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (
    {
      asChild,
      level = 2,
      size = "xl",
      muted = false,
      className,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          ref={ref as never}
          className={cn(
            "text-balance",
            sizeClasses[size],
            muted && "text-ink-muted",
            className,
          )}
          {...props}
        />
      );
    }

    const Tag = `h${level}` as HeadingTag;
    return (
      <Tag
        ref={ref as never}
        className={cn(
          "text-balance",
          sizeClasses[size],
          muted && "text-ink-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Heading.displayName = "Heading";
