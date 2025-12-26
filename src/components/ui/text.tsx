import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  // Large body / emphasis text: slightly larger on bigger screens
  lg: "text-base sm:text-lg",
  // Default body text: mobile-first, scales up at sm+
  md: "text-sm sm:text-base font-light",
  // Secondary body / compact text
  sm: "text-sm sm:text-sm",
  // Microcopy: uppercase, tracked, mobile-first
  xs: "text-[12px] sm:text-sm tracking-[0.35em] uppercase",
} as const;

const leadingClasses = {
  normal: "leading-normal",
  relaxed: "leading-relaxed",
  tight: "leading-snug",
} as const;

type TextSize = keyof typeof sizeClasses;

type TextProps = HTMLAttributes<HTMLParagraphElement> & {
  asChild?: boolean;
  size?: TextSize;
  muted?: boolean;
  leading?: keyof typeof leadingClasses;
};

export const Text = forwardRef<HTMLParagraphElement, TextProps>(
  (
    {
      asChild,
      size = "md",
      muted = false,
      leading = "relaxed",
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "p";
    return (
      <Comp
        ref={ref as never}
        className={cn(
          "text-pretty",
          sizeClasses[size],
          leadingClasses[leading],
          muted && "text-ink-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
