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
    "bg-perazzi-red text-white shadow-[0_10px_30px_rgba(156,31,43,0.35)] hover:bg-perazzi-red/90 focus-visible:bg-perazzi-red/90",
  secondary:
    "bg-card text-ink border border-border hover:border-ink/40 focus-visible:border-ink",
  ghost:
    "bg-transparent text-current hover:bg-white/20 focus-visible:bg-white/30 border border-transparent",
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
          "focus-ring relative inline-flex min-h-10 items-center justify-center gap-xs font-medium uppercase tracking-[0.2em] transition-colors duration-150",
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
