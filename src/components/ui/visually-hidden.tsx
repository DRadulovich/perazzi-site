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
        "border-0 p-0",
        className,
      )}
      style={{
        clip: "rect(0 0 0 0)",
        clipPath: "inset(50%)",
        height: "1px",
        width: "1px",
        margin: "-1px",
        overflow: "hidden",
        position: "absolute",
        whiteSpace: "nowrap",
      }}
      {...props}
    />
  );
});

VisuallyHidden.displayName = "VisuallyHidden";
