"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ConversationView } from "@/components/chat/ConversationView";
import { usePerazziAssistant } from "@/hooks/usePerazziAssistant";
import type { PlatformSlug } from "@/hooks/usePerazziAssistant";
import { GuardrailNotice } from "@/components/concierge/GuardrailNotice";
import { SanityDetailsDrawer } from "@/components/concierge/SanityDetailsDrawer";
import { BuildSheetDrawer } from "@/components/concierge/BuildSheetDrawer";
import { derivePanels, type AssistantMeta } from "@/lib/perazzi-derivation";
import { buildDealerBriefRequest } from "@/lib/dealer-brief";
import {
  getFieldOrder,
  getNextField,
  getValidOptions,
  summarizeSelections,
  type BuildState,
  validateSelection,
  gunOrderConfig,
} from "@/lib/gun-config";
import { mergeOptionResults } from "@/lib/build-info-cache";
import type { ChatMessage, PerazziAssistantRequest } from "@/types/perazzi-assistant";
import Image from "next/image";
import { getSanityImageUrl } from "@/lib/sanityImage";
import clsx from "clsx";

const FIELD_DESCRIPTIONS: Record<string, string> = {
  FRAME_SIZE: "Choose the frame size that defines core architecture and which gauges/platforms are possible.",
  PLATFORM: "Pick the platform family (MX, HT, TM, DC) that matches your shooting style and recoil/handling feel.",
  DISCIPLINE: "Select your discipline (sporting, trap, skeet, game, pigeon) to steer model/config choices.",
  MODEL: "Choose the specific Perazzi model that fits your frame size, platform, and discipline needs.",
  TRIGGER_TYPE: "Decide between removable or fixed trigger groups based on serviceability and model compatibility.",
  GRADE: "Select the wood/finish grade that maps to your model and engraving possibilities.",
  ENGRAVING: "Pick an engraving pattern appropriate for your grade, or browse the engraving library.",
  ACTION_FINISH: "Choose the action finish (e.g., blued, nickel, coin) for look and protection.",
  GAUGE: "Set the gauge compatible with your frame size; it governs shells and barrel specs.",
  LENGTH: "Select barrel length to tune swing and balance for your discipline.",
  WEIGHT: "Choose barrel weight profile to adjust liveliness versus stability.",
  CHOKE_TYPE: "Pick the choke system (screw-in/bottom-only/fixed) to define constriction management.",
  B1_CHOKE: "Select the bottom-barrel choke value allowed by your choke system.",
  B2_CHOKE: "Select the top-barrel choke value for fixed systems.",
  CHAMBER_LENGTH: "Set chamber length to match your ammunition for proper fit and pressure.",
  BORE_DIAMETER: "Choose bore diameter compatible with your gauge; it affects patterning and feel.",
  MONOBLOC: "Select monobloc style (if applicable) influencing barrel construction and service.",
  SIDERIBS_LENGTH: "Decide side rib length (full/half/without) to influence weight and cooling.",
  SIDERIBS_VENTILATION: "Pick side rib ventilation (ventilated/solid) when ribs are present.",
  BEAD_FRONT: "Select a front bead style for visibility and compatibility with color/style options.",
  BEAD_FRONT_COLOR: "Choose bead color (when applicable) for visibility and contrast.",
  BEAD_FRONT_STYLE: "Select bead material/style (e.g., brass, mid-bead) when applicable.",
  BEAD_MID: "Decide whether to include a mid bead for additional sight alignment.",
  RIB_TYPE: "Choose rib type tied to your model to set the base for rib height/taper options.",
  RIB_HEIGHT: "Select rib height (flat, ramp, step) when a fixed rib is chosen to tune sight picture.",
  RIB_STYLE: "Choose rib style (e.g., concave/flat) for sight picture feel.",
  RIB_TRAMLINE: "Decide if you want rib tramlines (sight lines) for alignment.",
  RIB_TRAMLINE_SIZE: "If tramlines are chosen, pick their size for sighting preference.",
  RIB_TAPER_12: "Choose rib taper dimensions suited to 12-frame size for sight plane and weight balance.",
  TRIGGER_GROUP_SPRINGS: "Select trigger spring type (coil/flat) where allowed to affect pull feel.",
  TRIGGER_GROUP_SELECTIVE: "Choose whether the trigger group is selective when supported by the model.",
  TRIGGER_GROUP_SAFETY: "Decide on safety configuration for the trigger group when supported.",
  WOOD_UPGRADE: "Pick wood grade/upgrade suited to your model and desired aesthetic.",
  FOREND_SHAPE: "Choose forend shape (beavertail, English sporting, etc.) matching your handling preference.",
  FOREND_CHECKER: "Select checkering style/coverage for grip and aesthetics.",
  STOCK_PROFILE: "Choose stock profile aligned with your discipline and mount for fit and shooting style.",
};

const FIELD_LABELS: Record<string, string> = {
  FRAME_SIZE: "Frame Scale Selection",
  PLATFORM: "Platform Selection",
  DISCIPLINE: "Discipline Preference",
  MODEL: "Model Selection",
  TRIGGER_TYPE: "Trigger Type",
  GRADE: "Grade Selection",
  ENGRAVING: "Engraving Selection",
  ACTION_FINISH: "Action Finish",
  GAUGE: "Barrel Gauge",
  LENGTH: "Barrel Length",
  WEIGHT: "Barrel Weight",
  CHOKE_TYPE: "Choke Type Selection",
  B1_CHOKE: "Bottom Barrel Constriction",
  B2_CHOKE: "Top Barrel Constriction",
  CHAMBER_LENGTH: "Chamber Length",
  BORE_DIAMETER: "Bore Diameter",
  MONOBLOC: "Monobloc Weight Preference",
  SIDERIBS_LENGTH: "Siderib Length",
  SIDERIBS_VENTILATION: "Siderib Ventilation",
  BEAD_FRONT: "Front Bead Selection",
  BEAD_FRONT_COLOR: "Front Bead Color",
  BEAD_FRONT_STYLE: "Front Bead Style",
  BEAD_MID: "Mid-Bead Preference",
  RIB_TYPE: "Rib Type Selection",
  RIB_HEIGHT: "Rib Height Selection",
  RIB_STYLE: "Rib Style Selection",
  RIB_TRAMLINE: "Tramline Preference",
  RIB_TRAMLINE_SIZE: "Tramline Size",
  RIB_TAPER_12: "Rib Taper Selection",
  RIB_TAPER_20: "Rib Taper Selection",
  RIB_TAPER_28_410: "Rib Taper Selection",
  RIB_TAPER_SXS: "Rib Taper Selection",
  TRIGGER_GROUP_SPRINGS: "Trigger Spring Choice",
  TRIGGER_GROUP_SELECTIVE: "Trigger Group Selectability",
  TRIGGER_GROUP_SAFETY: "Auto Safetey Preference",
  WOOD_UPGRADE: "Wood Grade Selection",
  FOREND_SHAPE: "Forend Shape",
  FOREND_CHECKER: "Forend Checkering",
  STOCK_PROFILE: "Stock Profile Geometry",
};

const getFieldLabel = (id: string) => FIELD_LABELS[id] ?? id;

const MODES = [
  { label: "New to Perazzi", value: "prospect" as const },
  { label: "Existing owner", value: "owner" as const },
  { label: "Navigation / visit", value: "navigation" as const },
];

const PLATFORM_LABELS: Record<PlatformSlug, string> = {
  mx: "MX",
  ht: "High Tech",
  tm: "TM",
  dc: "DC",
  sho: "SHO",
};

export function ConciergePageShell() {
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const [latestMeta, setLatestMeta] = useState<AssistantMeta | null>(null);
  const [latestGuardrail, setLatestGuardrail] = useState<string | undefined>(undefined);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const [dealerBrief, setDealerBrief] = useState<string | null>(null);
  const [dealerBriefPending, setDealerBriefPending] = useState(false);
  const [dealerBriefError, setDealerBriefError] = useState<string | null>(null);
  const [buildState, setBuildState] = useState<BuildState>({});
  const [buildError, setBuildError] = useState<string | null>(null);
  const [editBuildMode, setEditBuildMode] = useState(false);
  const [engravingQuery, setEngravingQuery] = useState("");
  const [engravingResults, setEngravingResults] = useState<
    Array<{ _id: string; engravingId: string; engravingSide: string; gradeName: string; image?: any; imageAlt?: string }>
  >([]);
  const [engravingLoading, setEngravingLoading] = useState(false);
  const [engravingError, setEngravingError] = useState<string | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<{ fieldId: string; value: string } | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoCards, setInfoCards] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      imageUrl?: string | null;
      fullImageUrl?: string | null;
      platform?: string | null;
      grade?: string | null;
      gauges?: string[];
      triggerTypes?: string[];
      recommendedPlatforms?: string[];
      popularModels?: string[];
    }>
  >([]);
  const [infoByOption, setInfoByOption] = useState<Record<string, Array<{
    id: string;
    title: string;
    description?: string;
    imageUrl?: string | null;
    fullImageUrl?: string | null;
    platform?: string | null;
    grade?: string | null;
    gauges?: string[];
    triggerTypes?: string[];
    recommendedPlatforms?: string[];
    popularModels?: string[];
    optionValue?: string;
  }>>>({});
  const [infoError, setInfoError] = useState<string | null>(null);
  const [selectedInfoCard, setSelectedInfoCard] = useState<{
    id: string;
    title: string;
    description?: string;
    imageUrl?: string | null;
    fullImageUrl?: string | null;
    platform?: string | null;
    grade?: string | null;
    gauges?: string[];
    triggerTypes?: string[];
    recommendedPlatforms?: string[];
    popularModels?: string[];
  } | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [buildSheetDrawerOpen, setBuildSheetDrawerOpen] = useState(false);
  const [selectedInfoByField, setSelectedInfoByField] = useState<Record<string, any[]>>({});

  const {
    messages,
    pending,
    isTyping,
    error,
    context,
    updateContext,
    sendMessage,
  } = usePerazziAssistant({
    storageKey: "perazzi-assistant-concierge",
    initialContext: { pageUrl: "/concierge", mode: "prospect" },
    onResponseMeta: (meta) => {
      setLatestMeta({
        intents: meta.intents ?? [],
        topics: meta.topics ?? [],
        citations: meta.citations ?? [],
        templates: meta.templates ?? [],
      });
      setLatestGuardrail(meta.guardrail?.status);
    },
  });

  useEffect(() => {
    if (locale) {
      updateContext({ locale });
    }
  }, [locale, updateContext]);

  const activeMode = useMemo(
    () => MODES.find((mode) => mode.value === context.mode)?.value ?? "prospect",
    [context.mode],
  );

  const derivedPanels = useMemo(() => {
    const normalizedMessages = messages.map(({ role, content }) => ({ role, content })) as ChatMessage[];
    return derivePanels(normalizedMessages, latestMeta);
  }, [messages, latestMeta]);

  const nextField = useMemo(() => getNextField(buildState), [buildState]);
  const nextFieldOptions = useMemo(
    () => (nextField ? getValidOptions(nextField.id, buildState) : []),
    [nextField, buildState],
  );
  const fieldOrder = useMemo(() => getFieldOrder(), []);

  useEffect(() => {
    if (nextField?.id !== "ENGRAVING") {
      setEngravingResults([]);
      setEngravingError(null);
    }
    setHighlightedOption(null);
    setInfoCards([]);
    setInfoByOption({});
    setInfoError(null);
  }, [nextField]);

  const nextFieldAfterCurrent = useMemo(() => {
    if (!nextField) return undefined;
    const currentIndex = fieldOrder.indexOf(nextField.id);
    const hypotheticalState = { ...buildState, [nextField.id]: "__PENDING__" };
    for (let i = currentIndex + 1; i < fieldOrder.length; i += 1) {
      const candidateId = fieldOrder[i];
      const candidateField = gunOrderConfig.fields.find((f) => f.id === candidateId);
      if (!candidateField) continue;
      const depsMet = candidateField.dependsOn.every(
        (dep) => hypotheticalState[dep] !== undefined,
      );
      if (!hypotheticalState[candidateId] && depsMet) {
        return candidateField;
      }
    }
    return undefined;
  }, [nextField, fieldOrder, buildState]);

  const displayOptions = useMemo(() => {
    if (nextField?.id === "ENGRAVING") {
      return engravingResults.map((engraving) => ({
        value: `${engraving.engravingId} (${engraving.engravingSide})`,
        label: `${engraving.engravingId} · ${engraving.engravingSide}`,
      }));
    }
    return nextFieldOptions.map((opt) => ({ value: opt.value, label: opt.value }));
  }, [nextField, engravingResults, nextFieldOptions]);

  const handleSend = async () => {
    const question = draft.trim();
    if (!question || pending) return;
    const selections = summarizeSelections(buildState);
    const decoratedQuestion = selections
      ? `${question}\n\nCurrent build selections: ${selections}. If relevant, guide the next step in the build flow.`
      : question;
    await sendMessage({
      question: decoratedQuestion,
      context: {
        ...context,
        pageUrl: "/concierge",
        locale,
        mode: activeMode,
      },
    });
    setDraft("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleModeChange = (mode: (typeof MODES)[number]["value"]) => {
    updateContext({ mode });
  };

  const handlePlatformSelect = async (slug: PlatformSlug) => {
    updateContext({ platformSlug: slug });
    await sendMessage({
      question: `I’m particularly interested in the ${PLATFORM_LABELS[slug]} platform. Explain how it fits someone like me and what the next steps would be.`,
      context: {
        ...context,
        platformSlug: slug,
        pageUrl: "/concierge",
        mode: activeMode,
        locale,
      },
    });
  };

  const handleFieldSelection = (fieldId: string, value: string) => {
    const field = gunOrderConfig.fields.find((f) => f.id === fieldId);
    const hasStructuredOptions = field && field.options.length > 0;
    if (hasStructuredOptions) {
      const validation = validateSelection(fieldId, value, buildState);
      if (!validation.valid) {
        setBuildError(validation.reason ?? "That choice is not compatible with current selections.");
        return;
      }
    }
    setBuildError(null);
    const matchedInfo = infoByOption[value] ?? infoCards.filter((card) => card.optionValue === value);
    if (matchedInfo && matchedInfo.length) {
      setSelectedInfoByField((prev) => ({ ...prev, [fieldId]: matchedInfo }));
    }
    setBuildState((prev) => ({ ...prev, [fieldId]: value }));
    setEditBuildMode(false);
  };
  const handleSelectHighlighted = () => {
    if (!nextField || !highlightedOption || highlightedOption.fieldId !== nextField.id) return;
    handleFieldSelection(nextField.id, highlightedOption.value);
    setHighlightedOption(null);
  };

  const resetBuild = () => {
    setBuildError(null);
    setBuildState({});
    setSelectedInfoByField({});
  };

  const fetchEngravings = useCallback(
    async (query: string, byGrade = false) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setEngravingResults([]);
        setEngravingError(null);
        return;
      }
      setEngravingLoading(true);
      setEngravingError(null);
      try {
        const param = byGrade ? `grade=${encodeURIComponent(trimmed)}` : `id=${encodeURIComponent(trimmed)}`;
        const res = await fetch(`/api/engravings?${param}`);
        if (!res.ok) {
          setEngravingError("Unable to fetch engravings. Please try again.");
          setEngravingResults([]);
          return;
        }
        const data = await res.json();
        setEngravingResults(data.engraving?.length ? data.engraving : data.engravings ?? []);
      } catch (error) {
        console.error(error);
        setEngravingError("Unable to fetch engravings. Please try again.");
        setEngravingResults([]);
      } finally {
        setEngravingLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (nextField?.id === "ENGRAVING" && buildState.GRADE) {
      fetchEngravings(buildState.GRADE, true);
    }
  }, [nextField, buildState.GRADE, fetchEngravings]);

  // When in engraving step, surface engraving results into infoCards/infoByOption for drawer
  useEffect(() => {
    if (nextField?.id === "ENGRAVING") {
      if (engravingResults.length) {
        const items = engravingResults.map((engraving) => ({
          id: engraving._id,
          title: `${engraving.engravingId} · ${engraving.engravingSide}`,
          description: engraving.gradeName ? `Grade: ${engraving.gradeName}` : "",
          imageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 400, quality: 80 }) : null,
          fullImageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 1600, quality: 90 }) : null,
          grade: engraving.gradeName ?? null,
          optionValue: `${engraving.engravingId} (${engraving.engravingSide})`,
        }));
        const map: Record<string, any[]> = {};
        items.forEach((item) => {
          if (item.optionValue) {
            map[item.optionValue] = [item];
          }
        });
        setInfoByOption(map);
        setInfoCards(items);
      } else {
        setInfoByOption({});
        setInfoCards([]);
      }
    }
  }, [nextField, engravingResults]);

  // Prefetch build info for all options in the current step
  useEffect(() => {
    if (!nextField || nextField.id === "ENGRAVING") {
      setInfoCards([]);
      setInfoByOption({});
      setInfoError(null);
      return;
    }
    const options = nextFieldOptions.map((opt) => opt.value);
    if (!options.length) {
      setInfoCards([]);
      setInfoByOption({});
      setInfoError(null);
      return;
    }
    const controller = new AbortController();
    setInfoLoading(true);
    setInfoError(null);
    const run = async () => {
      try {
        const results = await Promise.all(
          options.map(async (opt) => {
            const modelParam =
              nextField.id === "GRADE" && buildState.MODEL
                ? `&model=${encodeURIComponent(buildState.MODEL)}`
                : "";
            const res = await fetch(
              `/api/build-info?field=${encodeURIComponent(nextField.id)}&value=${encodeURIComponent(opt)}${modelParam}`,
              { signal: controller.signal },
            );
            if (!res.ok) {
              throw new Error("fetch_failed");
            }
            const data = await res.json();
            const items = (data.items ?? []).map((item: any) => ({ ...item, optionValue: opt }));
            return { option: opt, items };
          }),
        );
        const { map, flat } = mergeOptionResults(results);
        setInfoByOption(map);
        setInfoCards(flat);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setInfoByOption({});
        setInfoCards([]);
        setInfoError("Unable to load details for this step.");
      } finally {
        if (!controller.signal.aborted) {
          setInfoLoading(false);
        }
      }
    };
    void run();
    return () => controller.abort();
  }, [nextField, nextFieldOptions, buildState.MODEL]);

  const handleExplainCurrent = async () => {
    if (!nextField) return;
    const optionLabels = displayOptions.map((opt) => opt.value).join(", ");
    const question = `Could you help me understand the "${nextField.id}" options and explain the differences between ${optionLabels}, and why I would choose each one?`;
    await sendMessage({
      question,
      context: {
        ...context,
        pageUrl: "/concierge",
        mode: activeMode,
        locale,
      },
    });
  };

  const handleRevisitField = (fieldId: string) => {
    const targetIndex = fieldOrder.indexOf(fieldId);
    if (targetIndex === -1) return;
    const nextState: BuildState = {};
    fieldOrder.forEach((fid, idx) => {
      if (idx < targetIndex && buildState[fid]) {
        nextState[fid] = buildState[fid];
      }
    });
    setBuildError(null);
    setBuildState(nextState);
    setEditBuildMode(false);
  };

  const handleBuildReview = async () => {
    const selections = summarizeSelections(buildState);
    if (!selections) return;
    const question = `I just finished my build sheet: ${selections}. Could you review it and tell me what you think? Also, based on the Perazzi athletes you know of, who among them shoot a bespoke build similar to what I just built?`;
    await sendMessage({
      question,
      context: {
        ...context,
        pageUrl: "/concierge",
        mode: activeMode,
        locale,
      },
    });
  };

  const fetchInfoForSelection = useCallback(
    async (fieldId: string, value: string) => {
      if (!value) return [];
      const gradeModel = buildState.MODEL;
      if (fieldId === "ENGRAVING") {
        const idPart = value.split(" ")[0];
        try {
          const res = await fetch(`/api/engravings?id=${encodeURIComponent(idPart)}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.engravings ?? []).map((engraving: any) => ({
            id: engraving._id,
            title: `${engraving.engravingId} · ${engraving.engravingSide}`,
            description: engraving.gradeName ? `Grade: ${engraving.gradeName}` : "",
            imageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 400, quality: 80 }) : null,
            fullImageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 1600, quality: 90 }) : null,
            grade: engraving.gradeName ?? null,
            optionValue: `${engraving.engravingId} (${engraving.engravingSide})`,
          }));
        } catch {
          return [];
        }
      }
      try {
        const modelParam =
          fieldId === "GRADE" && gradeModel ? `&model=${encodeURIComponent(gradeModel)}` : "";
        const res = await fetch(
          `/api/build-info?field=${encodeURIComponent(fieldId)}&value=${encodeURIComponent(value)}${modelParam}`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items ?? []).map((item: any) => ({ ...item, optionValue: value }));
      } catch {
        return [];
      }
    },
    [buildState.MODEL],
  );

  useEffect(() => {
    if (!buildSheetDrawerOpen) return;
    const missing = fieldOrder
      .filter((fid) => buildState[fid])
      .filter((fid) => !selectedInfoByField[fid]);
    if (!missing.length) return;
    const controller = new AbortController();
    const run = async () => {
      const updates: Record<string, any[]> = {};
      for (const fid of missing) {
        const val = buildState[fid];
        const cached = infoByOption[val];
        if (cached && cached.length) {
          updates[fid] = cached;
          continue;
        }
        const fetched = await fetchInfoForSelection(fid, val);
        if (controller.signal.aborted) return;
        if (fetched.length) {
          updates[fid] = fetched;
        }
      }
      if (Object.keys(updates).length) {
        setSelectedInfoByField((prev) => ({ ...prev, ...updates }));
      }
    };
    void run();
    return () => controller.abort();
  }, [buildSheetDrawerOpen, fieldOrder, buildState, infoByOption, selectedInfoByField, fetchInfoForSelection]);

  const handleNextStep = async (intent: string) => {
    const intentCopy: Record<string, string> = {
      contact_dealer: "Help me find an authorized dealer and outline what information to bring.",
      service_plan: "Outline a concise service and care plan for my situation.",
      learn_platforms: "Give me a concise comparison of Perazzi platforms and where to start.",
      learn_bespoke_process: "Explain the bespoke build process and what decisions I should prepare.",
    };
    const question = intentCopy[intent] ?? "Guide me on the next step based on our conversation.";
    await sendMessage({
      question,
      context: {
        ...context,
        pageUrl: "/concierge",
        mode: activeMode,
        locale,
      },
    });
  };

  const toggleCitation = (chunkId: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  };

  const handleDealerBrief = async () => {
    setDealerBriefPending(true);
    setDealerBriefError(null);
    try {
      const summaryPrompt =
        "Summarize this conversation as a brief for an authorized Perazzi dealer. Include shooter’s disciplines, experience level, preferences, discussed platforms, and suggested next steps in a short, dealer-friendly format. Use clear section labels.";
      const sanitizedMessages = messages.map(({ role, content }) => ({ role, content })) as PerazziAssistantRequest["messages"];
      const response = await fetch("/api/perazzi-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...sanitizedMessages, { role: "user" as const, content: summaryPrompt }],
          context: { ...context, pageUrl: "/concierge", locale, mode: activeMode },
          summaryIntent: "dealer_brief",
        }),
      });
      if (!response.ok) {
        setDealerBriefError("Unable to generate dealer brief. Please try again.");
        return;
      }
      const data = await response.json();
      setDealerBrief(data.answer);
    } catch (err) {
      console.error(err);
      setDealerBriefError("Unable to generate dealer brief. Please try again.");
    } finally {
      setDealerBriefPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-muted">Perazzi Concierge</p>
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-ink">Designing a Perazzi, Together</h1>
          <div className="space-y-3 text-sm text-ink-muted">
            <p>
              This space is the closest you can come to sitting across from a Perazzi master, without leaving home. The Build Navigator
              walks you step by step through every element of a bespoke shotgun—platform, fit, balance, aesthetics—while the Perazzi
              Concierge listens, answers, and explains as if you were in the atelier itself.
            </p>
            <p>
              A Perazzi is not a catalogue choice; it is a composition. There are more possibilities here than most guns will ever offer,
              and that is the point. You are not expected to finish in a few minutes. You are invited to move slowly—explore each stage,
              open the cards, press “explain these options,” ask questions, change your mind, return tomorrow and see it with fresh eyes.
            </p>
            <p>
              As you progress, the system remembers where you are and responds to what you say, helping you translate your history, style,
              and ambitions into real decisions. By the time you reach the end, you won’t just have selected options from a list—you’ll
              have shaped an instrument with a clear purpose and a familiar soul: a Perazzi that already feels like it belongs to you.
            </p>
            <p>
              If you feel unsure where to begin, that’s exactly the right place to start. Ask a simple question, open a single stage, or
              let the Navigator suggest the next step—there is no “wrong” way to move through this process. You can speak to the assistant
              as you would to a trusted fitter: share your habits, doubts, even the way you hope the gun will make you feel on the stand.
              Take a few minutes or a few evenings; step away and return when you’re ready. When you’re curious, begin—and let the
              conversation slowly reveal the Perazzi that feels like it was waiting for you.
            </p>
            <p>(NOTE: This immersive experience is best done on a computer, and not a mobile device.)</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Conversation */}
        <section className="flex min-h-[70vh] max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-subtle bg-card p-4 shadow-sm sm:p-6 lg:order-2">
          <div className="flex items-center justify-between gap-3 border-b border-subtle pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Conversation</p>
              <p className="text-sm text-ink-muted">Context carries across each message.</p>
            </div>
            {pending || isTyping ? (
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-subtle border-t-transparent" />
                  <span className="inline-flex h-2 w-2 rounded-full bg-ink" />
                </span>
                <span>Collecting references…</span>
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {latestGuardrail && latestGuardrail !== "ok" ? (
              <div className="mb-3">
                <GuardrailNotice status={latestGuardrail} />
              </div>
            ) : null}
            <ConversationView messages={messages} pending={pending} isTyping={isTyping} />
          </div>
          <div className="mt-4 space-y-2 border-t border-subtle pt-4">
            {error ? <p className="text-sm text-red-600">Something went wrong reaching the concierge. Please try again.</p> : null}
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
              Ask the workshop
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about platforms, fitting, service, or heritage…"
                className="min-h-[96px] flex-1 rounded-2xl border border-subtle bg-card px-3 py-2 text-sm text-ink shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                disabled={pending}
              />
              <button
                type="button"
                onClick={handleSend}
                className="shrink-0 rounded-2xl bg-brand px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
                disabled={pending || !draft.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </section>

        {/* Build Navigator */}
        <aside className="space-y-4 rounded-3xl border border-subtle bg-card p-4 shadow-sm sm:p-6 lg:order-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Build navigator</p>
              <button
                type="button"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink"
                onClick={resetBuild}
              >
                Reset
              </button>
            </div>
            {buildError ? <p className="text-xs text-red-600">{buildError}</p> : null}

            <div className="space-y-2 rounded-2xl border border-subtle px-3 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Current Build Category</p>
              <p className="text-sm text-ink">
                {nextField ? nextField.section || "Unknown" : "Complete"}
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-subtle px-3 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Current step</p>
              {nextField ? (
                <>
                  <p className="text-sm font-semibold text-ink">{getFieldLabel(nextField.id)}</p>
                  {FIELD_DESCRIPTIONS[nextField.id] ? (
                    <p className="text-sm text-ink-muted">{FIELD_DESCRIPTIONS[nextField.id]}</p>
                  ) : null}
                  {displayOptions.length ? (
                    <>
                      <div className="grid gap-2">
                        {displayOptions.map((opt) => {
                          const isHighlighted =
                            highlightedOption?.fieldId === nextField.id && highlightedOption.value === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setHighlightedOption({ fieldId: nextField.id, value: opt.value });
                              }}
                              className={clsx(
                                "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                                isHighlighted
                                  ? "border-ink bg-subtle/50 text-ink"
                                  : "border-subtle text-ink-muted hover:border-ink hover:text-ink",
                              )}
                            >
                              {opt.label ?? opt.value}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectHighlighted}
                        className="mt-2 w-full rounded-full bg-brand px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                        disabled={!highlightedOption || highlightedOption.fieldId !== nextField.id}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => setDetailsDrawerOpen(true)}
                        className="mt-2 w-full rounded-full border border-subtle bg-card px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
                      >
                        {infoLoading ? "Loading details…" : "View More Details"}
                      </button>
                      <button
                        type="button"
                        onClick={handleExplainCurrent}
                        className="mt-2 w-full rounded-full border border-subtle bg-card px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
                      >
                        Explain these options
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {nextField.id === "ENGRAVING" ? (
                        <>
                          {!buildState.GRADE ? (
                            <p className="text-sm text-ink-muted">
                              Choose a grade first and we’ll load engravings for that grade here.
                            </p>
                          ) : (
                            <>
                              {engravingLoading ? (
                                <p className="text-sm text-ink-muted">Loading engravings…</p>
                              ) : engravingError ? (
                                <p className="text-xs text-red-600">{engravingError}</p>
                              ) : (
                                <p className="text-sm text-ink-muted">
                                  No engravings found for grade {buildState.GRADE}.
                                </p>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-ink-muted">
                          No valid options available based on current selections.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-muted">All steps completed.</p>
              )}
            </div>

              <div className="space-y-3 rounded-2xl border border-subtle px-3 py-3">
                <button
                  type="button"
                  onClick={() => setBuildSheetDrawerOpen(true)}
                  className="w-full rounded-full border border-perazzi-red bg-perazzi-red px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-ink hover:text-card"
                >
                  View Build Sheet
                </button>
                <div className="space-y-2 rounded-2xl border border-subtle px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">Next step</p>
                  {nextFieldAfterCurrent ? (
                    <>
                      <p className="text-sm font-semibold text-ink">{getFieldLabel(nextFieldAfterCurrent.id)}</p>
                      {FIELD_DESCRIPTIONS[nextFieldAfterCurrent.id] ? (
                        <p className="text-sm text-ink-muted">
                          {FIELD_DESCRIPTIONS[nextFieldAfterCurrent.id]}
                        </p>
                      ) : null}
                    </>
                  ) : nextField ? (
                    <p className="text-sm text-ink-muted">Depends on your current selection.</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-ink-muted">All steps satisfied.</p>
                      <button
                        type="button"
                        onClick={handleBuildReview}
                        className="w-full rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                        disabled={!Object.keys(buildState).length}
                      >
                        Send build for review
                      </button>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </aside>


      </div>
      {selectedInfoCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedInfoCard(null)}
              className="absolute right-4 top-4 rounded-full border border-subtle bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:border-ink hover:text-ink"
            >
              Close
            </button>
            <div className="flex-1 space-y-4 overflow-y-auto p-6 pr-5">
              {selectedInfoCard.imageUrl ? (
                <Image
                  src={selectedInfoCard.fullImageUrl ?? selectedInfoCard.imageUrl ?? ""}
                  alt={selectedInfoCard.title}
                  width={1600}
                  height={1000}
                  className="w-full rounded-2xl object-cover"
                />
              ) : null}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-ink">{selectedInfoCard.title}</h3>
                {selectedInfoCard.description ? (
                  <p className="text-sm text-ink-muted whitespace-pre-line">{selectedInfoCard.description}</p>
                ) : null}
                <div className="grid gap-2 text-sm text-ink">
                  {selectedInfoCard.platform ? (
                    <p><span className="font-semibold">Platform:</span> {selectedInfoCard.platform}</p>
                  ) : null}
                  {selectedInfoCard.grade ? (
                    <p><span className="font-semibold">Grade:</span> {selectedInfoCard.grade}</p>
                  ) : null}
                  {selectedInfoCard.gauges?.length ? (
                    <p><span className="font-semibold">Gauges:</span> {selectedInfoCard.gauges.join(", ")}</p>
                  ) : null}
                  {selectedInfoCard.triggerTypes?.length ? (
                    <p><span className="font-semibold">Trigger types:</span> {selectedInfoCard.triggerTypes.join(", ")}</p>
                  ) : null}
                  {selectedInfoCard.recommendedPlatforms?.length ? (
                    <p><span className="font-semibold">Recommended platforms:</span> {selectedInfoCard.recommendedPlatforms.join(", ")}</p>
                  ) : null}
                  {selectedInfoCard.popularModels?.length ? (
                    <p><span className="font-semibold">Popular models:</span> {selectedInfoCard.popularModels.join(", ")}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <SanityDetailsDrawer
        open={detailsDrawerOpen}
        cards={infoCards}
        selectedCard={selectedInfoCard}
        loading={infoLoading}
        error={infoError}
        onSelect={(card) => setSelectedInfoCard(card)}
        onClose={() => setDetailsDrawerOpen(false)}
      />
      <BuildSheetDrawer
        open={buildSheetDrawerOpen}
        entries={fieldOrder
          .filter((fid) => buildState[fid])
          .map((fid) => {
            const val = buildState[fid];
            const info = selectedInfoByField[fid] ?? infoByOption[val] ?? [];
            const first = info[0];
            return {
              id: fid,
              label: getFieldLabel(fid),
              value: val,
              details: first
                ? {
                    description: first.description,
                    platform: first.platform ?? null,
                    grade: first.grade ?? null,
                    gauges: first.gauges ?? [],
                    triggerTypes: first.triggerTypes ?? [],
                    recommendedPlatforms: first.recommendedPlatforms ?? [],
                    popularModels: first.popularModels ?? [],
                    imageUrl: first.imageUrl ?? null,
                    fullImageUrl: first.fullImageUrl ?? null,
                  }
                : undefined,
            };
          })}
        onClose={() => setBuildSheetDrawerOpen(false)}
        onRevisit={(fid) => handleRevisitField(fid)}
      />
    </div>
  );
}
