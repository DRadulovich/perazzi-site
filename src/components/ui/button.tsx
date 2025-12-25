import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-perazzi-red text-white shadow-[0_14px_40px_rgba(219,16,34,0.22)] ring-1 ring-black/10 hover:bg-perazzi-red/90 active:bg-perazzi-red/95",
  secondary:
    "border border-border/70 bg-card/70 text-ink shadow-sm backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 active:bg-card",
  ghost:
    "border border-transparent bg-transparent text-current hover:bg-ink/5 active:bg-ink/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  // Compact button: micro/secondary actions
  sm: "text-[11px] sm:text-xs px-sm py-2 rounded-xl",
  // Default button: primary actions on mobile, secondary on larger screens
  md: "text-[11px] sm:text-xs px-lg py-sm rounded-xl",
  // Large button: prominent CTAs
  lg: "text-sm sm:text-base px-xl py-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      className,
      variant = "primary",
      size = "md",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={type as ComponentPropsWithoutRef<"button">["type"]}
        className={cn(
          "focus-ring relative inline-flex min-h-10 items-center justify-center gap-xs font-medium uppercase tracking-[0.2em] transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
