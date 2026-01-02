"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import {
  COLLAPSE_TIME_SCALE,
  CONTAINER_EXPAND_MS,
  CONTENT_REVEAL_MS,
  CTA_REVEAL_MS,
  EXPANDED_HEADER_REVEAL_MS,
  EXPAND_TIME_SCALE,
  GLASS_REVEAL_MS,
  LIST_REVEAL_MS,
  MAIN_VISUAL_REVEAL_MS,
  META_REVEAL_MS,
  PREZOOM_MS,
  SCRIM_CONVERGE_MS,
} from "@/motion/expandableSectionMotion";

export type ExpandableSectionPhase =
  | "collapsed"
  | "prezoom"
  | "expanded"
  | "closingHold";

export type UseExpandableSectionTimelineOptions = {
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (nextExpanded: boolean) => void;
  prezoomMs?: number;
  closingHoldMs?: number;
};

const DEFAULT_PREZOOM_MS = PREZOOM_MS * EXPAND_TIME_SCALE;
const DEFAULT_CLOSING_HOLD_MS =
  Math.max(
    CONTAINER_EXPAND_MS,
    SCRIM_CONVERGE_MS,
    GLASS_REVEAL_MS,
    EXPANDED_HEADER_REVEAL_MS,
    MAIN_VISUAL_REVEAL_MS,
    META_REVEAL_MS,
    CONTENT_REVEAL_MS,
    LIST_REVEAL_MS,
    CTA_REVEAL_MS
  ) * COLLAPSE_TIME_SCALE;

export function useExpandableSectionTimeline(
  options: UseExpandableSectionTimelineOptions = {}
) {
  const {
    defaultExpanded = false,
    expanded: controlledExpanded,
    onExpandedChange,
    prezoomMs = DEFAULT_PREZOOM_MS,
    closingHoldMs = DEFAULT_CLOSING_HOLD_MS,
  } = options;

  const isControlled = controlledExpanded !== undefined;
  const [uncontrolledExpanded, setUncontrolledExpanded] =
    useState(defaultExpanded);
  const expanded = isControlled ? controlledExpanded : uncontrolledExpanded;

  const [phase, setPhase] = useState<ExpandableSectionPhase>(
    expanded ? "expanded" : "collapsed"
  );

  const phaseRef = useRef<ExpandableSectionPhase>(phase);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      globalThis.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearTimer();
  }, [clearTimer]);

  const startOpen = useCallback(() => {
    if (phaseRef.current === "expanded" || phaseRef.current === "prezoom") return;

    clearTimer();
    setPhase("prezoom");

    if (prezoomMs <= 0) {
      setPhase("expanded");
      return;
    }

    timerRef.current = globalThis.setTimeout(() => {
      setPhase("expanded");
      timerRef.current = null;
    }, prezoomMs);
  }, [clearTimer, prezoomMs]);

  const startClose = useCallback(() => {
    if (phaseRef.current === "collapsed" || phaseRef.current === "closingHold") {
      return;
    }

    clearTimer();
    setPhase("closingHold");

    if (closingHoldMs <= 0) {
      setPhase("collapsed");
      return;
    }

    timerRef.current = globalThis.setTimeout(() => {
      setPhase("collapsed");
      timerRef.current = null;
    }, closingHoldMs);
  }, [clearTimer, closingHoldMs]);

  /* eslint-disable react-hooks/set-state-in-effect -- phase transitions track controlled expand/collapse */
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (expanded) {
      startOpen();
    } else {
      startClose();
    }
  }, [expanded, startOpen, startClose]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setExpanded = useCallback(
    (nextExpanded: boolean) => {
      if (!isControlled) {
        setUncontrolledExpanded(nextExpanded);
      }
      onExpandedChange?.(nextExpanded);
    },
    [isControlled, onExpandedChange]
  );

  const open = useCallback(() => {
    if (expanded) return;
    setExpanded(true);
  }, [expanded, setExpanded]);

  const close = useCallback(() => {
    if (!expanded) return;
    setExpanded(false);
  }, [expanded, setExpanded]);

  const toggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded, setExpanded]);

  const onTriggerKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    },
    [open]
  );

  const onEscapeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    },
    [close]
  );

  return {
    expanded,
    phase,
    open,
    close,
    toggle,
    onTriggerKeyDown,
    onEscapeKeyDown,
  };
}
