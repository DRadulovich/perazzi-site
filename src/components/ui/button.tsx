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
    "bg-perazzi-red text-white shadow-soft ring-1 ring-black/10 hover:bg-perazzi-red/90 active:bg-perazzi-red/95",
  secondary:
    "border border-border/70 bg-card/70 text-ink shadow-soft backdrop-blur-sm hover:border-ink/20 hover:bg-card/85 active:bg-card",
  ghost:
    "border border-transparent bg-transparent text-current hover:bg-ink/5 active:bg-ink/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  // Compact button: micro/secondary actions
  sm: "type-button px-sm py-2 rounded-xl",
  // Default button: primary actions on mobile, secondary on larger screens
  md: "type-button px-lg py-sm rounded-xl",
  // Large button: prominent CTAs
  lg: "type-button-lg px-xl py-sm rounded-xl",
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
          "focus-ring relative inline-flex min-h-10 items-center justify-center gap-xs transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60",
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
