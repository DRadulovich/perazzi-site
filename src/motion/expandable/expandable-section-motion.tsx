"use client";

import {
  type AnimationPlaybackControlsWithThen,
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

const getScopeRoot = <T extends Element>(scope: RefObject<T>): T | null => scope.current;

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
    expand: 0.75,
    collapse: 0.6,
  },
  ease: {
    container: [0.16, 1, 0.3, 1],
    surface: [0.2, 0.8, 0.2, 1],
    reveal: [0.16, 1, 0.3, 1],
    exit: [0.2, 0.9, 0.2, 1],
  },
  timing: {
    expand: {
      preZoom: 0.35,
      scrim: 0.45,
      headerCollapsedExit: 0.35,
      glassIn: 0.45,
      headerExpandedIn: 0.45,
      mainIn: 0.55,
      metaIn: 0.35,
      bodyIn: 0.45,
      listIn: 0.55,
      ctaIn: 0.35,
      bgSettle: 0.6,
    },
    collapse: {
      preZoom: 0.25,
      scrim: 0.35,
      headerCollapsedIn: 0.3,
      glassOut: 0.3,
      headerExpandedOut: 0.3,
      mainOut: 0.3,
      metaOut: 0.25,
      bodyOut: 0.3,
      listOut: 0.35,
      ctaOut: 0.25,
      bgReset: 0.4,
    },
    layout: {
      expand: 0.5,
      collapse: 0.4,
    },
  },
  stagger: {
    expand: {
      items: 0.08,
      lines: 0.05,
      chars: 0.03,
      maxTotal: 0.45,
    },
    collapse: {
      items: 0.04,
      maxTotal: 0.3,
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
  if (action === "open") {
    return phase === "collapsed" || phase === "collapsing" ? "expanding" : null;
  }
  if (action === "close") {
    return phase === "expanded" || phase === "expanding" ? "collapsing" : null;
  }
  if (phase === "collapsed" || phase === "collapsing") return "expanding";
  if (phase === "expanded" || phase === "expanding") return "collapsing";
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
  const animationRef = useRef<AnimationPlaybackControlsWithThen | null>(null);
  const runIdRef = useRef(0);
  const expandPrepRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    visibleRef.current = contentVisible;
  }, [contentVisible]);

  const bodyId = useMemo(() => `${sectionId}-body`, [sectionId]);

  const startRun = useCallback(() => {
    runIdRef.current += 1;
    return runIdRef.current;
  }, []);

  const isRunActive = useCallback((runId: number) => runIdRef.current === runId, []);

  const stopCurrentAnimation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const getElements = useCallback(
    (selector: string): Element[] => {
      const root = getScopeRoot(scope);
      if (!root) return [];
      return Array.from(root.querySelectorAll(selector));
    },
    [scope],
  );

  const setImmediate = useCallback(
    (selector: string, keyframes: Record<string, unknown>) => {
      const elements = getElements(selector);
      if (!elements.length) return;
      const opacity = keyframes.opacity;
      const y = typeof keyframes.y === "number" ? keyframes.y : undefined;
      const scale = typeof keyframes.scale === "number" ? keyframes.scale : undefined;

      elements.forEach((element) => {
        const style = (element as HTMLElement).style;
        if (opacity !== undefined) {
          style.opacity = String(opacity);
        }
        if (y !== undefined || scale !== undefined) {
          const translate = `translate3d(0, ${y ?? 0}px, 0)`;
          const scalePart = scale === undefined ? "" : ` scale(${scale})`;
          style.transform = `${translate}${scalePart}`;
        }
      });
    },
    [getElements],
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
    const root = getScopeRoot(scope);
    if (!root) return;
    anchorRef.current = root.getBoundingClientRect().top;
  }, [resolvedSpec.scroll.preserveAnchor, scope]);

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
      const controls = animate(sequence);
      animationRef.current = controls;
      try {
        await controls;
      } finally {
        if (animationRef.current === controls) {
          animationRef.current = null;
        }
      }
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
      if (!elements.length) return false;
      sequence.push([elements, keyframes, options]);
      return true;
    },
    [getElements],
  );

  const runExpand = useCallback(async () => {
    const next = getNextPhase(phaseRef.current, "open");
    if (!next) return;
    onOpenStart?.();
    if (busyRef.current) {
      stopCurrentAnimation();
    }
    const runId = startRun();
    busyRef.current = true;
    setPhase(next);

    const expandScale = resolvedSpec.timeScale.expand;
    if (reducedMotion) {
      if (!visibleRef.current) {
        captureAnchor();
        setContentVisible(true);
        await nextFrame();
        if (!isRunActive(runId)) return;
      }
      if (!isRunActive(runId)) return;
      setPhase("expanded");
      busyRef.current = false;
      if (resolvedSpec.a11y.focusOnExpand === "close") {
        closeRef.current?.focus();
      }
      return;
    }

    const bg = getElements(ES_SELECTORS.bg);
    if (bg.length) {
      const controls = animate(bg, {
        scale: resolvedSpec.scale.bgPreZoom,
        y: resolvedSpec.distance.bgPreZoomY,
      }, {
        duration: resolvedSpec.timing.expand.preZoom * expandScale,
        ease: resolvedSpec.ease.container,
      });
      animationRef.current = controls;
      try {
        await controls;
      } finally {
        if (animationRef.current === controls) {
          animationRef.current = null;
        }
      }
      if (!isRunActive(runId)) return;
    }

    if (!visibleRef.current) {
      captureAnchor();
      setContentVisible(true);
      await nextFrame();
      applyPhaseStyles("collapsed");
      await nextFrame();
      if (!isRunActive(runId)) return;
    }

    const sequence: Array<[Element[], Record<string, unknown>, Record<string, unknown>]> = [];
    const layoutDuration = resolvedSpec.timing.layout.expand * expandScale;
    let time = layoutDuration * 0.2;
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

    const hasScrimTop = pushSequence(sequence, ES_SELECTORS.scrimTop, {
      opacity: resolvedSpec.opacity.scrimExpanded,
      y: resolvedSpec.distance.scrimY,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: time });
    const hasScrimBottom = pushSequence(sequence, ES_SELECTORS.scrimBottom, {
      opacity: resolvedSpec.opacity.scrimExpanded,
      y: -resolvedSpec.distance.scrimY,
    }, { duration: scrimDuration, ease: resolvedSpec.ease.container, at: time });
    const hasHeaderCollapsed = pushSequence(sequence, ES_SELECTORS.headerCollapsed, {
      opacity: 0,
      y: -resolvedSpec.distance.headerY,
    }, { duration: headerExitDuration, ease: resolvedSpec.ease.exit, at: time });
    time += Math.max(
      hasScrimTop || hasScrimBottom ? scrimDuration : 0,
      hasHeaderCollapsed ? headerExitDuration : 0,
    );

    const hasGlass = pushSequence(sequence, ES_SELECTORS.glass, {
      opacity: 1,
      scale: 1,
      y: 0,
    }, { duration: glassDuration, ease: resolvedSpec.ease.surface, at: time });
    if (hasGlass) {
      time += glassDuration;
    }

    const hasHeaderExpanded = pushSequence(sequence, ES_SELECTORS.headerExpanded, {
      opacity: 1,
      y: 0,
    }, { duration: headerDuration, ease: resolvedSpec.ease.reveal, at: time });

    const useCharReveal = shouldUseCharReveal();
    let hasCharReveal = false;
    if (useCharReveal) {
      const chars = getElements(ES_SELECTORS.char);
      const capped = capStagger(
        resolvedSpec.stagger.expand.chars,
        chars.length,
        resolvedSpec.stagger.expand.maxTotal,
      );
      if (chars.length) {
        hasCharReveal = true;
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
    if (hasHeaderExpanded || hasCharReveal) {
      time += headerDuration;
    }

    const hasMain = pushSequence(sequence, ES_SELECTORS.main, {
      opacity: 1,
      y: 0,
    }, { duration: mainDuration, ease: resolvedSpec.ease.reveal, at: time });
    if (hasMain) {
      time += mainDuration;
    }

    const hasMeta = pushSequence(sequence, ES_SELECTORS.meta, {
      opacity: 1,
      y: 0,
    }, { duration: metaDuration, ease: resolvedSpec.ease.reveal, at: time });
    if (hasMeta) {
      time += metaDuration;
    }

    const hasBody = pushSequence(sequence, ES_SELECTORS.body, {
      opacity: 1,
      y: 0,
    }, { duration: bodyDuration, ease: resolvedSpec.ease.reveal, at: time });
    if (hasBody) {
      time += bodyDuration;
    }

    const items = getElements(ES_SELECTORS.item);
    let hasItems = false;
    if (items.length) {
      hasItems = true;
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
    if (hasItems) {
      time += listDuration;
    }

    const hasCta = pushSequence(sequence, ES_SELECTORS.cta, {
      opacity: 1,
      y: 0,
    }, { duration: ctaDuration, ease: resolvedSpec.ease.reveal, at: time });
    if (hasCta) {
      time += ctaDuration;
    }

    pushSequence(sequence, ES_SELECTORS.bg, {
      scale: resolvedSpec.scale.bgExpanded,
      y: resolvedSpec.distance.bgY,
    }, { duration: bgSettleDuration, ease: resolvedSpec.ease.container, at: time });

    await animateSequence(sequence);
    if (!isRunActive(runId)) return;
    setPhase("expanded");
    busyRef.current = false;
    if (resolvedSpec.a11y.focusOnExpand === "close") {
      closeRef.current?.focus();
    }
  }, [
    animate,
    animateSequence,
    applyPhaseStyles,
    captureAnchor,
    getElements,
    isRunActive,
    onOpenStart,
    pushSequence,
    reducedMotion,
    resolvedSpec,
    shouldUseCharReveal,
    startRun,
    stopCurrentAnimation,
  ]);

  const runCollapse = useCallback(async () => {
    const next = getNextPhase(phaseRef.current, "close");
    if (!next) return;
    onCloseStart?.();
    if (busyRef.current) {
      stopCurrentAnimation();
    }
    const runId = startRun();
    busyRef.current = true;
    setPhase(next);

    const collapseScale = resolvedSpec.timeScale.collapse;
    if (reducedMotion) {
      captureAnchor();
      setContentVisible(false);
      await nextFrame();
      if (!isRunActive(runId)) return;
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
      const controls = animate(bg, {
        scale: resolvedSpec.scale.bgPreZoom,
        y: resolvedSpec.distance.bgPreZoomY,
      }, {
        duration: resolvedSpec.timing.collapse.preZoom * collapseScale,
        ease: resolvedSpec.ease.container,
      });
      animationRef.current = controls;
      try {
        await controls;
      } finally {
        if (animationRef.current === controls) {
          animationRef.current = null;
        }
      }
      if (!isRunActive(runId)) return;
    }

    const hasCta = pushSequence(sequence, ES_SELECTORS.cta, {
      opacity: 0,
      y: resolvedSpec.distance.ctaY,
    }, { duration: ctaDuration, ease: resolvedSpec.ease.exit, at: time });
    if (hasCta) {
      time += ctaDuration;
    }

    const items = getElements(ES_SELECTORS.item);
    let hasItems = false;
    if (items.length) {
      hasItems = true;
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
    if (hasItems) {
      time += listDuration;
    }

    const hasBody = pushSequence(sequence, ES_SELECTORS.body, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: bodyDuration, ease: resolvedSpec.ease.exit, at: time });
    if (hasBody) {
      time += bodyDuration;
    }

    const hasMeta = pushSequence(sequence, ES_SELECTORS.meta, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: metaDuration, ease: resolvedSpec.ease.exit, at: time });
    if (hasMeta) {
      time += metaDuration;
    }

    const hasMain = pushSequence(sequence, ES_SELECTORS.main, {
      opacity: 0,
      y: resolvedSpec.distance.contentY,
    }, { duration: mainDuration, ease: resolvedSpec.ease.exit, at: time });
    if (hasMain) {
      time += mainDuration;
    }

    const hasHeaderExpanded = pushSequence(sequence, ES_SELECTORS.headerExpanded, {
      opacity: 0,
      y: -resolvedSpec.distance.headerY,
    }, { duration: headerDuration, ease: resolvedSpec.ease.exit, at: time });

    const useCharReveal = shouldUseCharReveal();
    let hasCharReveal = false;
    if (useCharReveal) {
      const chars = getElements(ES_SELECTORS.char);
      const capped = capStagger(
        resolvedSpec.stagger.expand.chars,
        chars.length,
        resolvedSpec.stagger.expand.maxTotal,
      );
      if (chars.length) {
        hasCharReveal = true;
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
    if (hasHeaderExpanded || hasCharReveal) {
      time += headerDuration;
    }

    const hasGlass = pushSequence(sequence, ES_SELECTORS.glass, {
      opacity: 0,
      scale: resolvedSpec.scale.glassFrom,
      y: resolvedSpec.distance.glassY,
    }, { duration: glassDuration, ease: resolvedSpec.ease.surface, at: time });
    if (hasGlass) {
      time += glassDuration;
    }

    pushSequence(sequence, ES_SELECTORS.bg, {
      scale: resolvedSpec.scale.bgCollapsed,
      y: resolvedSpec.distance.bgY,
    }, { duration: bgResetDuration, ease: resolvedSpec.ease.container, at: time });

    await animateSequence(sequence);
    if (!isRunActive(runId)) return;

    captureAnchor();
    setContentVisible(false);
    await nextFrame();
    if (!isRunActive(runId)) return;

    if (layoutDuration > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, layoutDuration * 1000);
      });
      if (!isRunActive(runId)) return;
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
    if (!isRunActive(runId)) return;

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
    isRunActive,
    onCloseStart,
    pushSequence,
    reducedMotion,
    resolvedSpec,
    shouldUseCharReveal,
    startRun,
    stopCurrentAnimation,
  ]);

  const open = useCallback(() => {
    void runExpand();
  }, [runExpand]);

  const close = useCallback(() => {
    void runCollapse();
  }, [runCollapse]);

  const toggle = useCallback(() => {
    const current = phaseRef.current;
    if (current === "collapsed" || current === "collapsing") {
      open();
    } else if (current === "expanded" || current === "expanding") {
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
    if (phase !== "expanded" && phase !== "expanding") return;
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
