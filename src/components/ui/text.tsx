import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  lg: "text-lg",
  md: "text-base",
  sm: "text-sm",
  xs: "text-xs tracking-wide uppercase",
} as const;

const leadingClasses = {
  normal: "leading-7",
  relaxed: "leading-8",
  tight: "leading-5",
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
