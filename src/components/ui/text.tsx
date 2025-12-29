import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const sizeClasses = {
  lg: "type-body-lg",
  md: "type-body",
  sm: "type-body-sm",
  xs: "type-label",
  label: "type-label",
  "label-tight": "type-label-tight",
  caption: "type-caption",
  button: "type-button",
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
      leading,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "p";
    const leadingClass = leading ? leadingClasses[leading] : undefined;
    return (
      <Comp
        ref={ref as never}
        className={cn(
          "text-pretty",
          sizeClasses[size],
          leadingClass,
          muted && "text-ink-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
