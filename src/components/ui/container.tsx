import { forwardRef, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-4xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ asChild, className, size = "lg", ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        className={cn(
          "mx-auto w-full px-md sm:px-lg",
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Container.displayName = "Container";
