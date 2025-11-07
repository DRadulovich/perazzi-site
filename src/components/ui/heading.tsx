import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  display: "text-4xl sm:text-5xl font-semibold font-serif tracking-tight",
  xl: "text-3xl sm:text-4xl font-semibold",
  lg: "text-2xl sm:text-3xl font-semibold",
  md: "text-xl font-semibold",
  sm: "text-lg font-medium",
} as const;

type HeadingSize = keyof typeof sizeClasses;

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
    const Comp = asChild
      ? Slot
      : (`h${level}` as keyof JSX.IntrinsicElements);
    return (
      <Comp
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
