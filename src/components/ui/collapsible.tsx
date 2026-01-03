"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
} from "react";
import { cn } from "@/lib/utils";

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

type CollapsibleContentProps = ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> & {
  disableAnimation?: boolean;
};

export const CollapsibleContent = forwardRef<
  ComponentRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, disableAnimation, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden",
      !disableAnimation
        && "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className,
    )}
    {...props}
  />
));
CollapsibleContent.displayName = "CollapsibleContent";
