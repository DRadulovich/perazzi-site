"use client";

import {
  stagger,
  useAnimate,
  useReducedMotion,
  type Easing,
  type MotionProps,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

export type ExpandablePhase = "collapsed" | "expanding" | "expanded" | "collapsing";
export type ExpandableAction = "open" | "close" | "toggle";
export type ExpandableTriggerKind = "header" | "cta" | "custom";
export type EaseToken = Easing;

export type ExpandableInteractionPolicy = {
  hoverTease: boolean;
  allowHeaderClick: boolean;
  allowCtaClick: boolean;
};

export const DEFAULT_INTERACTION_POLICY: ExpandableInteractionPolicy = {
  hoverTease: true,
  allowHeaderClick: true,
  allowCtaClick: true,
};

export type ExpandableMotionSpec = {
  timeScale: {
    expand: number;
    collapse: number;
  };
  ease: {
    container: EaseToken;
    surface: EaseToken;
    reveal: EaseToken;
    exit: EaseToken;
  };
  timing: {
    expand: {
      preZoom: number;
      scrim: number;
      headerCollapsedExit: number;
      glassIn: number;
      headerExpandedIn: number;
      mainIn: number;
      metaIn: number;
      bodyIn: number;
      listIn: number;
      ctaIn: number;
      bgSettle: number;
    };
    collapse: {
      preZoom: number;
      scrim: number;
      headerCollapsedIn: number;
      glassOut: number;
      headerExpandedOut: number;
      mainOut: number;
      metaOut: number;
      bodyOut: number;
      listOut: number;
      ctaOut: number;
      bgReset: number;
    };
    layout: {
      expand: number;
      collapse: number;
    };
  };
  stagger: {
    expand: {
      items: number;
      lines: number;
      chars: number;
      maxTotal: number;
    };
    collapse: {
      items: number;
      maxTotal: number;
    };
  };
  distance: {
    bgY: number;
    bgPreZoomY: number;
    headerY: number;
    contentY: number;
    scrimY: number;
    itemY: number;
    ctaY: number;
    glassY: number;
  };
  scale: {
    bgCollapsed: number;
    bgPreZoom: number;
    bgExpanded: number;
    glassFrom: number;
  };
  opacity: {
    scrimCollapsed: number;
    scrimExpanded: number;
  };
  text: {
    enableCharReveal: boolean;
    maxCharsForCharReveal: number;
  };
  hover: {
    enabled: boolean;
    bgScale: number;
    scrimOpacity: number;
    ctaNudgeY: number;
  };
  a11y: {
    focusOnExpand: "close" | "none";
    focusOnCollapse: "trigger" | "none";
  };
  scroll: {
    preserveAnchor: boolean;
  };
};

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<U>
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

export type SectionOverride = DeepPartial<ExpandableMotionSpec>;

export const ES_SELECTORS = {
  bg: '[data-es="bg"]',
  scrimTop: '[data-es="scrim-top"]',
  scrimBottom: '[data-es="scrim-bottom"]',
  headerCollapsed: '[data-es="header-collapsed"]',
  glass: '[data-es="glass"]',
  main: '[data-es="main"]',
  headerExpanded: '[data-es="header-expanded"]',
  body: '[data-es="body"]',
  cta: '[data-es="cta"]',
  close: '[data-es="close"]',
  meta: '[data-es="meta"]',
  list: '[data-es="list"]',
  item: '[data-es="item"]',
  char: '[data-es="char"]',
} as const;

export const DEFAULT_ESMS_SPEC: ExpandableMotionSpec = {
  timeScale: {
    expand: 1.2,
    collapse: 0.65,
  },
  ease: {
    container: [0.16, 1, 0.3, 1],
    surface: [0.2, 0.8, 0.2, 1],
    reveal: [0.16, 1, 0.3, 1],
    exit: [0.2, 0.9, 0.2, 1],
  },
  timing: {
    expand: {
      preZoom: 0.55,
      scrim: 0.75,
      headerCollapsedExit: 0.5,
      glassIn: 0.85,
      headerExpandedIn: 0.8,
      mainIn: 0.9,
      metaIn: 0.65,
      bodyIn: 0.8,
      listIn: 0.9,
      ctaIn: 0.6,
      bgSettle: 1,
    },
    collapse: {
      preZoom: 0.32,
      scrim: 0.45,
      headerCollapsedIn: 0.4,
      glassOut: 0.35,
      headerExpandedOut: 0.35,
      mainOut: 0.35,
      metaOut: 0.3,
      bodyOut: 0.35,
      listOut: 0.4,
      ctaOut: 0.3,
      bgReset: 0.55,
    },
    layout: {
      expand: 1.05,
      collapse: 0.6,
    },
  },
  stagger: {
    expand: {
      items: 0.1,
      lines: 0.06,
      chars: 0.035,
      maxTotal: 0.7,
    },
    collapse: {
      items: 0.05,
      maxTotal: 0.4,
    },
  },
  distance: {
    bgY: 0,
    bgPreZoomY: 12,
    headerY: 12,
    contentY: 16,
    scrimY: 22,
    itemY: 8,
    ctaY: 10,
    glassY: 10,
  },
  scale: {
    bgCollapsed: 1.05,
    bgPreZoom: 1.08,
    bgExpanded: 1.02,
    glassFrom: 0.98,
  },
  opacity: {
    scrimCollapsed: 0.72,
    scrimExpanded: 0.32,
  },
  text: {
    enableCharReveal: true,
    maxCharsForCharReveal: 18,
  },
  hover: {
    enabled: true,
    bgScale: 1.02,
    scrimOpacity: 0.6,
    ctaNudgeY: -4,
  },
  a11y: {
    focusOnExpand: "close",
    focusOnCollapse: "trigger",
  },
  scroll: {
    preserveAnchor: true,
  },
};

export const DEFAULT_SPEC = DEFAULT_ESMS_SPEC;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export function mergeSpec<T extends Record<string, unknown>>(
  base: T,
  ...overrides: Array<DeepPartial<T> | undefined>
): T {
  const merge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    const output: Record<string, unknown> = { ...target };
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined) return;
      const outputValue = output[key];
      if (isPlainObject(value) && isPlainObject(outputValue)) {
        output[key] = merge(outputValue, value);
      } else {
        output[key] = value;
      }
    });
    return output;
  };

  return overrides.reduce((acc, override) => {
    if (!override) return acc;
    return merge(acc as Record<string, unknown>, override as Record<string, unknown>) as T;
  }, { ...base });
}

export function capStagger(step: number, count: number, maxTotal: number) {
  if (count <= 1) return 0;
  const total = step * (count - 1);
  if (total <= maxTotal) return step;
  return maxTotal / (count - 1);
}

export function getNextPhase(
  phase: ExpandablePhase,
  action: ExpandableAction,
): ExpandablePhase | null {
  if (action === "open") return phase === "collapsed" ? "expanding" : null;
  if (action === "close") return phase === "expanded" ? "collapsing" : null;
  if (phase === "collapsed") return "expanding";
  if (phase === "expanded") return "collapsing";
  return null;
}

const reducedMotionSpec = (spec: ExpandableMotionSpec): ExpandableMotionSpec => {
  const nearInstant = 0.01;
  return mergeSpec(spec, {
    timing: {
      expand: {
        preZoom: nearInstant,
        scrim: nearInstant,
        headerCollapsedExit: nearInstant,
        glassIn: nearInstant,
        headerExpandedIn: nearInstant,
        mainIn: nearInstant,
        metaIn: nearInstant,
        bodyIn: nearInstant,
        listIn: nearInstant,
        ctaIn: nearInstant,
        bgSettle: nearInstant,
      },
      collapse: {
        preZoom: nearInstant,
        scrim: nearInstant,
        headerCollapsedIn: nearInstant,
        glassOut: nearInstant,
        headerExpandedOut: nearInstant,
        mainOut: nearInstant,
        metaOut: nearInstant,
        bodyOut: nearInstant,
        listOut: nearInstant,
        ctaOut: nearInstant,
        bgReset: nearInstant,
      },
      layout: {
        expand: nearInstant,
        collapse: nearInstant,
      },
    },
    distance: {
      bgY: 0,
      bgPreZoomY: 0,
      headerY: 0,
      contentY: 0,
      scrimY: 0,
      itemY: 0,
      ctaY: 0,
      glassY: 0,
    },
    scale: {
      bgCollapsed: 1,
      bgPreZoom: 1,
      bgExpanded: 1,
      glassFrom: 1,
    },
    hover: {
      enabled: false,
      bgScale: 1,
      scrimOpacity: spec.opacity.scrimExpanded,
      ctaNudgeY: 0,
    },
    text: {
      enableCharReveal: false,
    },
  });
};

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const getGraphemes = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (segment) => segment.segment);
  }
  return Array.from(text);
};

export function SplitChars({
  text,
  as: Tag = "span",
  className,
  charClassName,
  enabled = true,
}: Readonly<{
  text: string;
  as?: ElementType;
  className?: string;
  charClassName?: string;
  enabled?: boolean;
}>) {
  if (!enabled) return <Tag className={className}>{text}</Tag>;

  const segments = getGraphemes(text);
  return (
    <Tag className={className} aria-label={text}>
      {segments.map((segment, index) => (
        <span
          key={`${segment}-${index}`}
          data-es="char"
          aria-hidden="true"
          className={charClassName}
        >
          {segment}
        </span>
      ))}
    </Tag>
  );
}

type TriggerOptions = ButtonHTMLAttributes<HTMLButtonElement> & {
  action?: "open" | "toggle";
  withHover?: boolean;
  kind?: ExpandableTriggerKind;
};

type CloseOptions = ButtonHTMLAttributes<HTMLButtonElement>;

export type UseExpandableSectionMotionOptions = {
  sectionId: string;
  spec: ExpandableMotionSpec;
  defaultExpanded?: boolean;
  onOpenStart?: () => void;
  onCloseStart?: () => void;
  interactionPolicy?: ExpandableInteractionPolicy;
};

export type ExpandableSectionMotionApi = {
  scope: RefObject<HTMLElement>;
  phase: ExpandablePhase;
  isExpanded: boolean;
  isCollapsed: boolean;
  contentVisible: boolean;
  reducedMotion: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  getTriggerProps: (options?: TriggerOptions) => TriggerOptions;
  getCloseProps: (options?: CloseOptions) => CloseOptions;
  layoutProps: MotionProps;
  bodyId: string;
  closeRef: RefObject<HTMLElement | null>;
};

export function useExpandableSectionMotion({
  sectionId,
  spec,
  defaultExpanded = false,
  onOpenStart,
  onCloseStart,
  interactionPolicy,
}: UseExpandableSectionMotionOptions): ExpandableSectionMotionApi {
  const [phase, setPhase] = useState<ExpandablePhase>(
    defaultExpanded ? "expanded" : "collapsed",
  );
  const [contentVisible, setContentVisible] = useState(defaultExpanded);
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();
  const resolvedSpec = useMemo(
    () => (reducedMotion ? reducedMotionSpec(spec) : spec),
    [spec, reducedMotion],
  );
  const resolvedInteraction = useMemo(
    () => ({ ...DEFAULT_INTERACTION_POLICY, ...interactionPolicy }),
    [interactionPolicy],
  );

  const phaseRef = useRef(phase);
  const visibleRef = useRef(contentVisible);
  const closeRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const anchorRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const expandPrepRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    visibleRef.current = contentVisible;
  }, [contentVisible]);

  const bodyId = useMemo(() => `${sectionId}-body`, [sectionId]);

  const scopeElement = scope.current as HTMLElement | null;

  const getElements = useCallback(
    (selector: string): Element[] => {
      if (!scopeElement) return [];
      return Array.from(scopeElement.querySelectorAll(selector));
    },
    [scopeElement],
  );

  const setImmediate = useCallback(
    (selector: string, keyframes: Record<string, unknown>) => {
      const elements = getElements(selector);
      if (!elements.length) return;
      animate(elements, keyframes, { duration: 0 });
    },
    [animate, getElements],
  );

  const shouldUseCharReveal = useCallback(() => {
    if (!resolvedSpec.text.enableCharReveal) return false;
    const chars = getElements(ES_SELECTORS.char);
    return chars.length > 0 && chars.length <= resolvedSpec.text.maxCharsForCharReveal;
  }, [getElements, resolvedSpec.text.enableCharReveal, resolvedSpec.text.maxCharsForCharReveal]);

  const applyPhaseStyles = useCallback(
    (next: ExpandablePhase) => {
      if (next === "collapsed") {
        setImmediate(ES_SELECTORS.bg, {
          scale: resolvedSpec.scale.bgCollapsed,
          y: resolvedSpec.distance.bgY,
        });
        setImmediate(ES_SELECTORS.scrimTop, {
          opacity: resolvedSpec.opacity.scrimCollapsed,
          y: 0,
        });
        setImmediate(ES_SELECTORS.scrimBottom, {
          opacity: resolvedSpec.opacity.scrimCollapsed,
          y: 0,
        });
        setImmediate(ES_SELECTORS.headerCollapsed, { opacity: 1, y: 0 });
        setImmediate(ES_SELECTORS.glass, {
          opacity: 0,
          scale: resolvedSpec.scale.glassFrom,
          y: resolvedSpec.distance.glassY,
        });
        setImmediate(ES_SELECTORS.headerExpanded, {
          opacity: 0,
          y: resolvedSpec.distance.headerY,
        });
        setImmediate(ES_SELECTORS.char, {
          opacity: 0,
          y: resolvedSpec.distance.headerY,
        });
        setImmediate(ES_SELECTORS.main, {
          opacity: 0,
          y: resolvedSpec.distance.contentY,
        });
        setImmediate(ES_SELECTORS.meta, {
          opacity: 0,
          y: resolvedSpec.distance.contentY,
        });
        setImmediate(ES_SELECTORS.body, {
          opacity: 0,
          y: resolvedSpec.distance.contentY,
        });
        setImmediate(ES_SELECTORS.cta, {
          opacity: 0,
          y: resolvedSpec.distance.ctaY,
        });
        setImmediate(ES_SELECTORS.item, {
          opacity: 0,
          y: resolvedSpec.distance.itemY,
        });
        return;
      }

      if (next === "expanded") {
        setImmediate(ES_SELECTORS.bg, {
          scale: resolvedSpec.scale.bgExpanded,
          y: resolvedSpec.distance.bgY,
        });
        setImmediate(ES_SELECTORS.scrimTop, {
          opacity: resolvedSpec.opacity.scrimExpanded,
          y: resolvedSpec.distance.scrimY,
        });
        setImmediate(ES_SELECTORS.scrimBottom, {
          opacity: resolvedSpec.opacity.scrimExpanded,
          y: -resolvedSpec.distance.scrimY,
        });
        setImmediate(ES_SELECTORS.headerCollapsed, {
          opacity: 0,
          y: -resolvedSpec.distance.headerY,
        });
        setImmediate(ES_SELECTORS.glass, {
          opacity: 1,
          scale: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.headerExpanded, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.char, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.main, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.meta, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.body, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.cta, {
          opacity: 1,
          y: 0,
        });
        setImmediate(ES_SELECTORS.item, {
          opacity: 1,
          y: 0,
        });
      }
    },
    [resolvedSpec, setImmediate],
  );

  useLayoutEffect(() => {
    if (!scope.current) return;
    if (phase === "collapsed" || phase === "expanded") {
      expandPrepRef.current = false;
      applyPhaseStyles(phase);
      return;
    }
    if (reducedMotion) return;
    if (phase === "expanding" && contentVisible && !expandPrepRef.current) {
      expandPrepRef.current = true;
      applyPhaseStyles("collapsed");
    }
  }, [applyPhaseStyles, contentVisible, phase, reducedMotion, scope]);

  const captureAnchor = useCallback(() => {
    if (!resolvedSpec.scroll.preserveAnchor) return;
    if (!scopeElement) return;
    anchorRef.current = scopeElement.getBoundingClientRect().top;
  }, [resolvedSpec.scroll.preserveAnchor, scopeElement]);

  useLayoutEffect(() => {
    if (anchorRef.current === null) return;
    if (!scope.current) return;
    const before = anchorRef.current;
    anchorRef.current = null;
    const after = scope.current.getBoundingClientRect().top;
    const delta = after - before;
    if (Math.abs(delta) > 0.5 && typeof globalThis.scrollBy === "function") {
      globalThis.scrollBy(0, delta);
    }
  }, [contentVisible, scope]);

  const animateSequence = useCallback(
    async (sequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]>) => {
      if (!sequence.length) return;
      await animate(sequence);
    },
    [animate],
  );

  const pushSequence = useCallback(
    (
      sequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]>,
      selector: string,
      keyframes: Record<string, unknown>,
      options: Record<string, unknown>,
    ) => {
      const elements = getElements(selector);
      if (!elements.length) return;
      sequence.push([elements, keyframes, options]);
    },
    [getElements],
  );

  const runExpand = useCallback(async () => {
    if (busyRef.current) return;
    const next = getNextPhase(phaseRef.current, "open");
    if (!next) return;
    onOpenStart?.();
    busyRef.current = true;
    setPhase(next);

    const expandScale = resolvedSpec.timeScale.expand;
    if (reducedMotion) {
      if (!visibleRef.current) {
        captureAnchor();
        setContentVisible(true);
        await nextFrame();
      }
      setPhase("expanded");
      busyRef.current = false;
      if (resolvedSpec.a11y.focusOnExpand === "close") {
        closeRef.current?.focus();
      }
      return;
    }

    const bg = getElements(ES_SELECTORS.bg);
    if (bg.length) {
      await animate(bg, {
        scale: resolvedSpec.scale.bgPreZoom,
        y: resolvedSpec.distance.bgPreZoomY,
      }, {
        duration: resolvedSpec.timing.expand.preZoom * expandScale,
        ease: resolvedSpec.ease.container,
      });
    }

    if (!visibleRef.current) {
      captureAnchor();
      setContentVisible(true);
      await nextFrame();
    }

    const sequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]> = [];
    const layoutDuration = resolvedSpec.timing.layout.expand * expandScale;
    let time = layoutDuration;
    const scrimDuration = resolvedSpec.timing.expand.scrim * expandScale;
    const headerExitDuration = resolvedSpec.timing.expand.headerCollapsedExit * expandScale;
    const glassDuration = resolvedSpec.timing.expand.glassIn * expandScale;
    const headerDuration = resolvedSpec.timing.expand.headerExpandedIn * expandScale;
    const mainDuration = resolvedSpec.timing.expand.mainIn * expandScale;
    const metaDuration = resolvedSpec.timing.expand.metaIn * expandScale;
    const bodyDuration = resolvedSpec.timing.expand.bodyIn * expandScale;
    const listDuration = resolvedSpec.timing.expand.listIn * expandScale;
    const ctaDuration = resolvedSpec.timing.expand.ctaIn * expandScale;
    const bgSettleDuration = resolvedSpec.timing.expand.bgSettle * expandScale;

    pushSequence(sequence, ES_SELECTORS.scrimTop, {
      opacity: resolvedSpec.opacity.scrimExpanded,
      y: resolvedSpec.distance.scrimY,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: time });
    pushSequence(sequence, ES_SELECTORS.scrimBottom, {
      opacity: resolvedSpec.opacity.scrimExpanded,
      y: -resolvedSpec.distance.scrimY,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: time });
    pushSequence(sequence, ES_SELECTORS.headerCollapsed, {
      opacity: 0,
      y: -resolvedSpec.distance.headerY,
    }, { duration: headerExitDuration, ease: resolvedSpec.ease.exit, at: time });
    time += Math.max(scrimDuration, headerExitDuration);

    pushSequence(sequence, ES_SELECTORS.glass, {
      opacity: 1,
      scale: 1,
      y: 0,
    }, { duration: glassDuration, ease: resolvedSpec.ease.surface, at: time });
    time += glassDuration;

    pushSequence(sequence, ES_SELECTORS.headerExpanded, {
      opacity: 1,
      y: 0,
    }, { duration: headerDuration, ease: resolvedSpec.ease.reveal, at: time });

    const useCharReveal = shouldUseCharReveal();
    if (useCharReveal) {
      const chars = getElements(ES_SELECTORS.char);
      const capped = capStagger(
        resolvedSpec.stagger.expand.chars,
        chars.length,
        resolvedSpec.stagger.expand.maxTotal,
      );
      if (chars.length) {
        sequence.push([
          chars,
          { opacity: 1, y: 0 },
          {
            duration: headerDuration,
            ease: resolvedSpec.ease.reveal,
            delay: stagger(capped),
            at: time,
          },
        ]);
      }
    }
    time += headerDuration;

    pushSequence(sequence, ES_SELECTORS.main, {
      opacity: 1,
      y: 0,
    }, { duration: mainDuration, ease: resolvedSpec.ease.reveal, at: time });
    time += mainDuration;

    pushSequence(sequence, ES_SELECTORS.meta, {
      opacity: 1,
      y: 0,
    }, { duration: metaDuration, ease: resolvedSpec.ease.reveal, at: time });
    time += metaDuration;

    pushSequence(sequence, ES_SELECTORS.body, {
      opacity: 1,
      y: 0,
    }, { duration: bodyDuration, ease: resolvedSpec.ease.reveal, at: time });
    time += bodyDuration;

    const items = getElements(ES_SELECTORS.item);
    if (items.length) {
      const capped = capStagger(
        resolvedSpec.stagger.expand.items,
        items.length,
        resolvedSpec.stagger.expand.maxTotal,
      );
      sequence.push([
        items,
        { opacity: 1, y: 0 },
        {
          duration: listDuration,
          ease: resolvedSpec.ease.reveal,
          delay: stagger(capped),
          at: time,
        },
      ]);
    }
    time += listDuration;

    pushSequence(sequence, ES_SELECTORS.cta, {
      opacity: 1,
      y: 0,
    }, { duration: ctaDuration, ease: resolvedSpec.ease.reveal, at: time });
    time += ctaDuration;

    pushSequence(sequence, ES_SELECTORS.bg, {
      scale: resolvedSpec.scale.bgExpanded,
      y: resolvedSpec.distance.bgY,
    }, { duration: bgSettleDuration, ease: resolvedSpec.ease.container, at: time });

    await animateSequence(sequence);
    setPhase("expanded");
    busyRef.current = false;
    if (resolvedSpec.a11y.focusOnExpand === "close") {
      closeRef.current?.focus();
    }
  }, [
    animate,
    animateSequence,
    captureAnchor,
    getElements,
    onOpenStart,
    pushSequence,
    reducedMotion,
    resolvedSpec,
    shouldUseCharReveal,
  ]);

  const runCollapse = useCallback(async () => {
    if (busyRef.current) return;
    const next = getNextPhase(phaseRef.current, "close");
    if (!next) return;
    onCloseStart?.();
    busyRef.current = true;
    setPhase(next);

    const collapseScale = resolvedSpec.timeScale.collapse;
    if (reducedMotion) {
      captureAnchor();
      setContentVisible(false);
      await nextFrame();
      setPhase("collapsed");
      busyRef.current = false;
      if (resolvedSpec.a11y.focusOnCollapse === "trigger") {
        lastTriggerRef.current?.focus();
      }
      return;
    }

    const sequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]> = [];
    let time = 0;
    const ctaDuration = resolvedSpec.timing.collapse.ctaOut * collapseScale;
    const listDuration = resolvedSpec.timing.collapse.listOut * collapseScale;
    const bodyDuration = resolvedSpec.timing.collapse.bodyOut * collapseScale;
    const metaDuration = resolvedSpec.timing.collapse.metaOut * collapseScale;
    const mainDuration = resolvedSpec.timing.collapse.mainOut * collapseScale;
    const headerDuration = resolvedSpec.timing.collapse.headerExpandedOut * collapseScale;
    const glassDuration = resolvedSpec.timing.collapse.glassOut * collapseScale;
    const scrimDuration = resolvedSpec.timing.collapse.scrim * collapseScale;
    const headerInDuration = resolvedSpec.timing.collapse.headerCollapsedIn * collapseScale;
    const bgResetDuration = resolvedSpec.timing.collapse.bgReset * collapseScale;
    const layoutDuration = resolvedSpec.timing.layout.collapse * collapseScale;

    const bg = getElements(ES_SELECTORS.bg);
    if (bg.length) {
      await animate(bg, {
        scale: resolvedSpec.scale.bgPreZoom,
        y: resolvedSpec.distance.bgPreZoomY,
      }, {
        duration: resolvedSpec.timing.collapse.preZoom * collapseScale,
        ease: resolvedSpec.ease.container,
      });
    }

    pushSequence(sequence, ES_SELECTORS.cta, {
      opacity: 0,
      y: resolvedSpec.distance.ctaY,
    }, { duration: ctaDuration, ease: resolvedSpec.ease.exit, at: time });
    time += ctaDuration;

    const items = getElements(ES_SELECTORS.item);
    if (items.length) {
      const capped = capStagger(
        resolvedSpec.stagger.collapse.items,
        items.length,
        resolvedSpec.stagger.collapse.maxTotal,
      );
      sequence.push([
        items,
        { opacity: 0, y: resolvedSpec.distance.itemY },
        {
          duration: listDuration,
          ease: resolvedSpec.ease.exit,
          delay: stagger(capped, { from: "last" }),
          at: time,
        },
      ]);
    }
    time += listDuration;

    pushSequence(sequence, ES_SELECTORS.body, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: bodyDuration, ease: resolvedSpec.ease.exit, at: time });
    time += bodyDuration;

    pushSequence(sequence, ES_SELECTORS.meta, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: metaDuration, ease: resolvedSpec.ease.exit, at: time });
    time += metaDuration;

    pushSequence(sequence, ES_SELECTORS.main, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: mainDuration, ease: resolvedSpec.ease.exit, at: time });
    time += mainDuration;

    pushSequence(sequence, ES_SELECTORS.headerExpanded, {
      opacity: 0,
      y: -resolvedSpec.distance.headerY,
    }, { duration: headerDuration, ease: resolvedSpec.ease.exit, at: time });

    const useCharReveal = shouldUseCharReveal();
    if (useCharReveal) {
      const chars = getElements(ES_SELECTORS.char);
      const capped = capStagger(
        resolvedSpec.stagger.expand.chars,
        chars.length,
        resolvedSpec.stagger.expand.maxTotal,
      );
      if (chars.length) {
        sequence.push([
          chars,
          { opacity: 0, y: -resolvedSpec.distance.headerY },
          {
            duration: headerDuration,
            ease: resolvedSpec.ease.exit,
            delay: stagger(capped, { from: "last" }),
            at: time,
          },
        ]);
      }
    }
    time += headerDuration;

    pushSequence(sequence, ES_SELECTORS.glass, {
      opacity: 0,
      scale: resolvedSpec.scale.glassFrom,
      y: resolvedSpec.distance.glassY,
    }, { duration: glassDuration, ease: resolvedSpec.ease.surface, at: time });
    time += glassDuration;

    pushSequence(sequence, ES_SELECTORS.bg, {
      scale: resolvedSpec.scale.bgCollapsed,
      y: resolvedSpec.distance.bgY,
    }, { duration: bgResetDuration, ease: resolvedSpec.ease.container, at: time });

    await animateSequence(sequence);

    captureAnchor();
    setContentVisible(false);
    await nextFrame();

    if (layoutDuration > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, layoutDuration * 1000);
      });
    }

    const postSequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]> = [];
    pushSequence(postSequence, ES_SELECTORS.scrimTop, {
      opacity: resolvedSpec.opacity.scrimCollapsed,
      y: 0,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: 0 });
    pushSequence(postSequence, ES_SELECTORS.scrimBottom, {
      opacity: resolvedSpec.opacity.scrimCollapsed,
      y: 0,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: 0 });
    pushSequence(postSequence, ES_SELECTORS.headerCollapsed, {
      opacity: 1,
      y: 0,
    }, { duration: headerInDuration, ease: resolvedSpec.ease.reveal, at: 0 });

    await animateSequence(postSequence);

    setPhase("collapsed");
    busyRef.current = false;
    if (resolvedSpec.a11y.focusOnCollapse === "trigger") {
      lastTriggerRef.current?.focus();
    }
  }, [
    animate,
    animateSequence,
    captureAnchor,
    getElements,
    onCloseStart,
    pushSequence,
    reducedMotion,
    resolvedSpec,
    shouldUseCharReveal,
  ]);

  const open = useCallback(() => {
    void runExpand();
  }, [runExpand]);

  const close = useCallback(() => {
    void runCollapse();
  }, [runCollapse]);

  const toggle = useCallback(() => {
    const current = phaseRef.current;
    if (current === "collapsed") {
      open();
    } else if (current === "expanded") {
      close();
    }
  }, [close, open]);

  const handleHoverIn = useCallback(() => {
    if (!resolvedSpec.hover.enabled || reducedMotion) return;
    if (phaseRef.current !== "collapsed") return;
    const bg = getElements(ES_SELECTORS.bg);
    const scrimTop = getElements(ES_SELECTORS.scrimTop);
    const scrimBottom = getElements(ES_SELECTORS.scrimBottom);
    const cta = getElements(ES_SELECTORS.cta);
    if (bg.length) {
      animate(bg, {
        scale: resolvedSpec.hover.bgScale,
      }, { duration: 0.2, ease: resolvedSpec.ease.reveal });
    }
    if (scrimTop.length) {
      animate(scrimTop, {
        opacity: resolvedSpec.hover.scrimOpacity,
      }, { duration: 0.2, ease: resolvedSpec.ease.reveal });
    }
    if (scrimBottom.length) {
      animate(scrimBottom, {
        opacity: resolvedSpec.hover.scrimOpacity,
      }, { duration: 0.2, ease: resolvedSpec.ease.reveal });
    }
    if (cta.length) {
      animate(cta, { y: resolvedSpec.hover.ctaNudgeY }, { duration: 0.2, ease: resolvedSpec.ease.reveal });
    }
  }, [animate, getElements, reducedMotion, resolvedSpec]);

  const handleHoverOut = useCallback(() => {
    if (!resolvedSpec.hover.enabled || reducedMotion) return;
    if (phaseRef.current !== "collapsed") return;
    applyPhaseStyles("collapsed");
  }, [applyPhaseStyles, reducedMotion, resolvedSpec.hover.enabled]);

  const getTriggerProps = useCallback(
    (options: TriggerOptions = {}) => {
      const {
        action = "open",
        onClick,
        onPointerEnter,
        onPointerLeave,
        withHover,
        kind = "cta",
        ...rest
      } = options;
      let allowClick = true;
      if (kind === "header") {
        allowClick = resolvedInteraction.allowHeaderClick;
      } else if (kind === "cta") {
        allowClick = resolvedInteraction.allowCtaClick;
      }
      const hoverEnabled = (withHover ?? true) && resolvedInteraction.hoverTease;
      const ariaDisabled = rest["aria-disabled"] ?? (allowClick ? undefined : true);

      return {
        ...rest,
        "aria-expanded": phaseRef.current === "expanded" || phaseRef.current === "expanding",
        "aria-controls": bodyId,
        "aria-disabled": ariaDisabled,
        onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
          if (allowClick) {
            lastTriggerRef.current = event.currentTarget as HTMLElement;
            if (action === "toggle") toggle();
            else open();
          }
          onClick?.(event);
        },
        onPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>) => {
          if (hoverEnabled) handleHoverIn();
          onPointerEnter?.(event);
        },
        onPointerLeave: (event: ReactPointerEvent<HTMLButtonElement>) => {
          if (hoverEnabled) handleHoverOut();
          onPointerLeave?.(event);
        },
      };
    },
    [bodyId, handleHoverIn, handleHoverOut, open, resolvedInteraction, toggle],
  );

  const getCloseProps = useCallback(
    (options: CloseOptions = {}) => {
      const { onClick, ...rest } = options;
      return {
        ...rest,
        ref: (node: HTMLButtonElement | null) => {
          closeRef.current = node;
        },
        onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
          close();
          onClick?.(event);
        },
      };
    },
    [close],
  );

  const layoutProps = useMemo<MotionProps>(() => {
    const isCollapsing = phase === "collapsing";
    const duration =
      (isCollapsing
        ? resolvedSpec.timing.layout.collapse
        : resolvedSpec.timing.layout.expand) *
      (isCollapsing
        ? resolvedSpec.timeScale.collapse
        : resolvedSpec.timeScale.expand);

    return {
      layout: true,
      transition: {
        layout: {
          duration,
          ease: resolvedSpec.ease.container,
        },
      },
    };
  }, [phase, resolvedSpec]);

  const isExpanded = phase === "expanded" || phase === "expanding";
  const isCollapsed = phase === "collapsed" || phase === "collapsing";

  useEffect(() => {
    if (phase !== "expanded") return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    if (typeof globalThis.addEventListener !== "function") return;
    globalThis.addEventListener("keydown", handleKey);
    return () => {
      if (typeof globalThis.removeEventListener !== "function") return;
      globalThis.removeEventListener("keydown", handleKey);
    };
  }, [close, phase]);

  return {
    scope,
    phase,
    isExpanded,
    isCollapsed,
    contentVisible,
    reducedMotion: Boolean(reducedMotion),
    open,
    close,
    toggle,
    getTriggerProps,
    getCloseProps,
    layoutProps,
    bodyId,
    closeRef,
  };
}
