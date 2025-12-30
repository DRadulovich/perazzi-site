import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  display: "type-display",
  xl: "type-section",
  lg: "type-title-lg",
  md: "type-title-md",
  sm: "type-title-sm",
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
