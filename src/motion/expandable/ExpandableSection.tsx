"use client";

import {
  useEffect,
  useMemo,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
  type Ref,
} from "react";
import { cn } from "@/lib/utils";
import {
  type DeepPartial,
  mergeSpec,
  useExpandableSectionMotion,
  type ExpandableMotionSpec,
  type ExpandableSectionMotionApi,
} from "./expandable-section-motion";
import { getSectionSpec } from "./expandable-section-registry";
import {
  useExpandableSectionController,
  type ExpandableSectionControllerValue,
} from "./context/ExpandableSectionController";

type ExpandableSectionRenderProps = ExpandableSectionMotionApi & {
  spec: ExpandableMotionSpec;
};

type ExpandableSectionProps<T extends ElementType = "section"> = {
  sectionId: string;
  children: (props: ExpandableSectionRenderProps) => ReactNode;
  as?: T;
  className?: string;
  defaultExpanded?: boolean;
  rootRef?: Ref<HTMLElement>;
  routeSpecOverride?: DeepPartial<ExpandableMotionSpec>;
  specOverride?: DeepPartial<ExpandableMotionSpec>;
  runtimeSpecOverride?: DeepPartial<ExpandableMotionSpec>;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "ref">;

const isRefObject = <T,>(ref: Ref<T> | undefined): ref is { current: T | null } =>
  ref != null && typeof ref === "object" && "current" in ref;

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  if (isRefObject(ref)) {
    ref.current = value;
  }
};

const mergeRefs =
  <T,>(...refs: Array<Ref<T> | undefined>) =>
  (value: T | null) => {
    refs.forEach((ref) => assignRef(ref, value));
  };

const registerWithController = (
  controller: ExpandableSectionControllerValue | null,
  sectionId: string,
  close: () => void,
  isOpen: () => boolean,
) => {
  if (!controller) return () => {};
  controller.register(sectionId, { close, isOpen });
  return () => controller.unregister(sectionId);
};

export function ExpandableSection<T extends ElementType = "section">({
  sectionId,
  children,
  as,
  className,
  defaultExpanded = false,
  rootRef,
  routeSpecOverride,
  specOverride,
  runtimeSpecOverride,
  ...rest
}: ExpandableSectionProps<T>) {
  const controller = useExpandableSectionController();
  const routeOverride = routeSpecOverride ?? controller?.routeSpecOverride;

  const baseSpec = useMemo(
    () => getSectionSpec(sectionId, routeOverride),
    [routeOverride, sectionId],
  );

  const resolvedSpec = useMemo(
    () => mergeSpec(baseSpec, specOverride, runtimeSpecOverride),
    [baseSpec, specOverride, runtimeSpecOverride],
  );

  const motion = useExpandableSectionMotion({
    sectionId,
    spec: resolvedSpec,
    defaultExpanded,
    onOpenStart: () => {
      controller?.requestOpen(sectionId);
    },
    onCloseStart: () => {
      controller?.notifyClose(sectionId);
    },
  });

  useEffect(() => {
    return registerWithController(
      controller,
      sectionId,
      motion.close,
      () => motion.isExpanded,
    );
  }, [controller, motion.close, motion.isExpanded, sectionId]);

  const Comp = as ?? "section";
  const mergedRef = useMemo(
    () => mergeRefs(motion.scope, rootRef),
    [motion.scope, rootRef],
  );

  const renderProps: ExpandableSectionRenderProps = {
    ...motion,
    spec: resolvedSpec,
  };

  return (
    <Comp
      ref={mergedRef}
      className={cn(className)}
      data-es-root
      data-es-phase={motion.phase}
      data-es-section-id={sectionId}
      {...rest}
    >
      {children(renderProps)}
    </Comp>
  );
}
