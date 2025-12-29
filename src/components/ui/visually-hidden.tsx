import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const VisuallyHidden = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref as never}
      className={cn(
        "visually-hidden",
        className,
      )}
      {...props}
    />
  );
});

VisuallyHidden.displayName = "VisuallyHidden";
