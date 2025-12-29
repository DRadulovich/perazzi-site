"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ComponentRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-xl border border-border/70 bg-card/95 px-3 py-2 type-caption text-ink shadow-soft ring-1 ring-border/70 backdrop-blur-xl outline-none transition duration-150 data-[state=closed]:opacity-0 data-[state=open]:opacity-100",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";
