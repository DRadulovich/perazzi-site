"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { ConversationView } from "@/components/chat/ConversationView";
import { usePerazziAssistant } from "@/hooks/usePerazziAssistant";
import { GuardrailNotice } from "@/components/concierge/GuardrailNotice";
import type { GuardrailStatus } from "@/components/concierge/GuardrailNotice";
import { SanityDetailsDrawer } from "@/components/concierge/SanityDetailsDrawer";
import { BuildSheetDrawer } from "@/components/concierge/BuildSheetDrawer";
import { Heading, Text } from "@/components/ui";
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
import Image from "next/image";
import { getSanityImageUrl } from "@/lib/sanityImage";
import clsx from "clsx";

type InfoCard = {
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
};

type EngravingResult = {
  _id: string;
  engravingId: string;
  engravingSide: string;
  gradeName?: string | null;
  image?: unknown;
  imageAlt?: string;
};

type SavedBuild = {
  id: string;
  name: string;
  timestamp: number;
  buildState: BuildState;
  selectedInfoByField?: Partial<Record<string, InfoCard[]>>;
};

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
  TRIGGER_GROUP_SAFETY: "Auto Safety Preference",
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

const SAFE_ENGRAVING_QUERY = /^[\w\s\-./()']+$/;

const buildSafeEngravingsUrl = (query: string, byGrade = false) => {
  const cleaned = query.trim();
  // Guard against protocol injection and unexpected characters to avoid SSRF-style input.
  if (!cleaned || cleaned.length > 100 || cleaned.startsWith("//") || /https?:\/\//i.test(cleaned)) {
    return null;
  }
  if (!SAFE_ENGRAVING_QUERY.test(cleaned)) {
    return null;
  }
  const params = new URLSearchParams();
  params.set(byGrade ? "grade" : "id", cleaned);
  return `/api/engravings?${params.toString()}`;
};

export function ConciergePageShell() {
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const [latestGuardrail, setLatestGuardrail] = useState<GuardrailStatus | undefined>(undefined);
  const [buildState, setBuildState] = useState<BuildState>({});
  const [buildError, setBuildError] = useState<string | null>(null);
  const [engravingResults, setEngravingResults] = useState<EngravingResult[]>([]);
  const [engravingLoading, setEngravingLoading] = useState(false);
  const [engravingError, setEngravingError] = useState<string | null>(null);
  const [highlightedOption, setHighlightedOption] = useState<{ fieldId: string; value: string } | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoCards, setInfoCards] = useState<InfoCard[]>([]);
  const [infoByOption, setInfoByOption] = useState<Partial<Record<string, InfoCard[]>>>({});
  const [infoError, setInfoError] = useState<string | null>(null);
  const [selectedInfoCard, setSelectedInfoCard] = useState<InfoCard | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [buildSheetDrawerOpen, setBuildSheetDrawerOpen] = useState(false);
  const [selectedInfoByField, setSelectedInfoByField] = useState<Partial<Record<string, InfoCard[]>>>({});
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const SAVES_KEY = "perazzi-build-saves";

  const {
    messages,
    pending,
    isTyping,
    error,
    context,
    updateContext,
    sendMessage,
    clearConversation,
  } = usePerazziAssistant({
    storageKey: "perazzi-assistant-concierge",
    initialContext: { pageUrl: "/concierge", mode: "prospect" },
    onResponseMeta: (meta) => {
      setLatestGuardrail(meta.guardrail?.status);
    },
  });

  useEffect(() => {
    if (locale) {
      updateContext({ locale });
    }
  }, [locale, updateContext]);

  useEffect(() => {
    try {
      if ("localStorage" in globalThis) {
        const raw = globalThis.localStorage.getItem(SAVES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SavedBuild[];
          setSavedBuilds(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const persistSaves = (saves: SavedBuild[]) => {
    try {
      if ("localStorage" in globalThis) {
        globalThis.localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
      }
    } catch {
      // ignore persistence failures
    }
  };

  const activeMode = useMemo(
    () => MODES.find((mode) => mode.value === context.mode)?.value ?? "prospect",
    [context.mode],
  );

  const nextField = useMemo(() => getNextField(buildState), [buildState]);
  const nextFieldOptions = useMemo(
    () => (nextField ? getValidOptions(nextField.id, buildState) : []),
    [nextField, buildState],
  );
  const fieldOrder = useMemo(() => getFieldOrder(), []);
  const isUnsafeQueryValue = (input?: string) => {
    if (!input) return true;
    return input.includes("://") || input.startsWith("//");
  };
  const isSafeFieldId = (fieldId: string) =>
    /^[A-Z0-9_]+$/.test(fieldId) && !["__proto__", "prototype", "constructor"].includes(fieldId);
  const buildSafeBuildInfoUrl = useCallback(
    (fieldId: string, value: string, model?: string) => {
      if (!fieldOrder.includes(fieldId) || isUnsafeQueryValue(value)) {
        return null;
      }
      const allowedValues = getValidOptions(fieldId, buildState).map((opt) => opt.value);
      if (allowedValues.length > 0 && !allowedValues.includes(value)) {
        return null;
      }
      const params = new URLSearchParams({ field: fieldId, value });
      if (model && !isUnsafeQueryValue(model)) {
        const allowedModels = getValidOptions("MODEL", buildState).map((opt) => opt.value);
        if (allowedModels.length === 0 || allowedModels.includes(model)) {
          params.set("model", model);
        }
      }
      return `/api/build-info?${params.toString()}`;
    },
    [buildState, fieldOrder],
  );

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
    if (!nextField || !isSafeFieldId(nextField.id)) return undefined;
    const currentIndex = fieldOrder.indexOf(nextField.id);
    const hypotheticalState = { ...buildState, [nextField.id]: "__PENDING__" };
    for (let i = currentIndex + 1; i < fieldOrder.length; i += 1) {
      const candidateId = fieldOrder[i];
      if (typeof candidateId !== "string" || !isSafeFieldId(candidateId)) {
        continue;
      }
      const candidateField = gunOrderConfig.fields.find((f) => f.id === candidateId);
      if (!candidateField) continue;
      const depsMet = candidateField.dependsOn.every(
        (dep) => isSafeFieldId(dep) && hypotheticalState[dep] !== undefined,
      );
      if (Object.prototype.hasOwnProperty.call(hypotheticalState, candidateId) && depsMet) {
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

  const handleClearChat = () => {
    let confirmed = true;
    if ("confirm" in globalThis && typeof globalThis.confirm === "function") {
      confirmed = globalThis.confirm("Clear chat history for this session?");
    }
    if (confirmed) {
      clearConversation();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleFieldSelection = (fieldId: string, value: string) => {
    if (!isSafeFieldId(fieldId)) {
      setBuildError("That choice is not compatible with current selections.");
      return;
    }
    const field = gunOrderConfig.fields.find((f) => f.id === fieldId);
    const hasStructuredOptions = (field?.options.length ?? 0) > 0;
    if (hasStructuredOptions) {
      const validation = validateSelection(fieldId, value, buildState);
      if (!validation.valid) {
        setBuildError(validation.reason ?? "That choice is not compatible with current selections.");
        return;
      }
    }
    setBuildError(null);
    const matchedInfo = infoByOption[value] ?? infoCards.filter((card) => card.optionValue === value);
    if (matchedInfo?.length) {
      setSelectedInfoByField((prev) => ({ ...prev, [fieldId]: matchedInfo }));
    }
    setBuildState((prev) => ({ ...prev, [fieldId]: value }));
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

  const handleSaveBuild = () => {
    let name = "";
    if ("prompt" in globalThis && typeof globalThis.prompt === "function") {
      name = globalThis.prompt("Name this build:") ?? "";
    }
    if (!name) return;
    const newSave: SavedBuild = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      name,
      timestamp: Date.now(),
      buildState,
      selectedInfoByField,
    };
    setSavedBuilds((prev) => {
      const existingNames = prev.find((b) => b.name === name);
      const filtered = existingNames ? prev.filter((b) => b.name !== name) : [...prev];
      const next = [...filtered, newSave]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 3);
      persistSaves(next);
      return next;
    });
  };

  const handleLoadSaved = (id: string) => {
    const target = savedBuilds.find((b) => b.id === id);
    if (!target) return;
    let confirmed = true;
    if ("confirm" in globalThis && typeof globalThis.confirm === "function") {
      confirmed = globalThis.confirm("Load this saved build? Current selections will be replaced.");
    }
    if (!confirmed) return;
    setBuildState(target.buildState || {});
    setSelectedInfoByField(target.selectedInfoByField || {});
    setBuildError(null);
    setBuildSheetDrawerOpen(false);
  };

  const handleDeleteSaved = (id: string) => {
    let confirmed = true;
    if ("confirm" in globalThis && typeof globalThis.confirm === "function") {
      confirmed = globalThis.confirm("Delete this saved build?");
    }
    if (!confirmed) return;
    const next = savedBuilds.filter((b) => b.id !== id);
    persistSaves(next);
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
      const url = buildSafeEngravingsUrl(trimmed, byGrade);
      if (!url) {
        setEngravingResults([]);
        setEngravingError("Please enter a valid engraving search term.");
        setEngravingLoading(false);
        return;
      }
      try {
        const res = await fetch(url);
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
        const items: InfoCard[] = engravingResults.map((engraving) => ({
          id: engraving._id,
          title: `${engraving.engravingId} · ${engraving.engravingSide}`,
          description: engraving.gradeName ? `Grade: ${engraving.gradeName}` : "",
          imageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 400, quality: 80 }) : null,
          fullImageUrl: engraving.image ? getSanityImageUrl(engraving.image, { width: 1600, quality: 90 }) : null,
          grade: engraving.gradeName ?? null,
          optionValue: `${engraving.engravingId} (${engraving.engravingSide})`,
        }));
        const map: Record<string, InfoCard[]> = {};
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
            const url = buildSafeBuildInfoUrl(
              nextField.id,
              opt,
              nextField.id === "GRADE" ? buildState.MODEL : undefined,
            );
            if (!url) {
              return { option: opt, items: [] };
            }
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) {
              throw new Error("fetch_failed");
            }
            const data = await res.json();
            const rawItems = (data.items ?? []) as InfoCard[];
            const items: InfoCard[] = rawItems.map((item) => ({ ...item, optionValue: opt }));
            return { option: opt, items };
          }),
        );
        const { map, flat } = mergeOptionResults<InfoCard>(results);
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
  }, [nextField, nextFieldOptions, buildState.MODEL, buildSafeBuildInfoUrl]);

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
    if (!isSafeFieldId(fieldId)) return;
    const targetIndex = fieldOrder.indexOf(fieldId);
    if (targetIndex === -1) return;
    const nextState: BuildState = {};
    fieldOrder.forEach((fid, idx) => {
      if (!isSafeFieldId(fid)) {
        return;
      }
      if (idx < targetIndex && buildState[fid]) {
        nextState[fid] = buildState[fid];
      }
    });
    setBuildError(null);
    setBuildState(nextState);
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
    async (fieldId: string, value: string): Promise<InfoCard[]> => {
      if (!isSafeFieldId(fieldId)) return [];
      if (!value) return [];
      const gradeModel = buildState.MODEL;
      if (fieldId === "ENGRAVING") {
        const idPart = value.split(" ")[0];
        const url = buildSafeEngravingsUrl(idPart);
        if (!url) return [];
        try {
          const res = await fetch(url);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.engravings ?? []).map((engraving: EngravingResult) => ({
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
        const url = buildSafeBuildInfoUrl(fieldId, value, fieldId === "GRADE" ? gradeModel : undefined);
        if (!url) return [];
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        const rawItems = (data.items ?? []) as InfoCard[];
        return rawItems.map((item) => ({ ...item, optionValue: value }));
      } catch {
        return [];
      }
    },
    [buildState, buildSafeBuildInfoUrl],
  );

  useEffect(() => {
    if (!buildSheetDrawerOpen) return;
    const missing = fieldOrder
      .filter((fid) => isSafeFieldId(fid) && buildState[fid])
      .filter((fid) => !selectedInfoByField[fid]);
    if (!missing.length) return;
    const controller = new AbortController();
    const run = async () => {
      const updates: Record<string, InfoCard[]> = {};
      for (const fid of missing) {
        if (!isSafeFieldId(fid)) {
          continue;
        }
        const val = buildState[fid];
        if (!val) {
          continue;
        }
        const cached = infoByOption[val];
        if (cached?.length) {
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

  let engravingStatusMessage: React.ReactNode = null;
  if (nextField?.id === "ENGRAVING" && !displayOptions.length) {
    if (!buildState.GRADE) {
      engravingStatusMessage = (
        <Text muted>
          Choose a grade first and we’ll load engravings for that grade here.
        </Text>
      );
    } else if (engravingLoading) {
      engravingStatusMessage = <Text muted>Loading engravings…</Text>;
    } else if (engravingError) {
      engravingStatusMessage = (
        <Text size="sm" className="text-red-600" leading="normal">
          {engravingError}
        </Text>
      );
    } else {
      engravingStatusMessage = (
        <Text muted>
          No engravings found for grade {buildState.GRADE}.
        </Text>
      );
    }
  }

  let nextStepContent: React.ReactNode = null;
  if (nextFieldAfterCurrent) {
    nextStepContent = (
      <>
        <Text className="font-semibold text-ink" leading="normal">
          {getFieldLabel(nextFieldAfterCurrent.id)}
        </Text>
        {FIELD_DESCRIPTIONS[nextFieldAfterCurrent.id] ? (
          <Text muted>{FIELD_DESCRIPTIONS[nextFieldAfterCurrent.id]}</Text>
        ) : null}
      </>
    );
  } else if (nextField) {
    nextStepContent = <Text muted>Depends on your current selection.</Text>;
  } else {
    nextStepContent = (
      <div className="space-y-2">
        <Text muted>All steps satisfied.</Text>
        <button
          type="button"
          onClick={handleBuildReview}
          className="w-full rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          disabled={!Object.keys(buildState).length}
        >
          Send build for review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="concierge-workshop" tabIndex={-1}>
      <header className="space-y-3">
        <Text
          size="xs"
          className="font-semibold tracking-[0.25em] text-ink-muted"
          leading="normal"
        >
          Perazzi Build Planner
        </Text>
        <div className="space-y-3">
          <Heading level={2} size="xl" className="text-ink">
            Designing a Perazzi, Together
          </Heading>
          <div className="space-y-3">
            <Text muted>
              This space is the closest you can come to sitting across from a Perazzi master, without leaving home. The Build Navigator
              walks you step by step through every element of a bespoke shotgun—platform, fit, balance, aesthetics—while the Perazzi
              Concierge listens, answers, and explains as if you were in the atelier itself.
            </Text>
            <Text muted>
              A Perazzi is not a catalogue choice; it is a composition. There are more possibilities here than most guns will ever offer,
              and that is the point. You are not expected to finish in a few minutes. You are invited to move slowly—explore each stage,
              open the cards, press “explain these options,” ask questions, change your mind, return tomorrow and see it with fresh eyes.
            </Text>
            <Text muted>
              As you progress, the system remembers where you are and responds to what you say, helping you translate your history, style,
              and ambitions into real decisions. By the time you reach the end, you won’t just have selected options from a list—you’ll
              have shaped an instrument with a clear purpose and a familiar soul: a Perazzi that already feels like it belongs to you.
            </Text>
            <Text muted>
              If you feel unsure where to begin, that’s exactly the right place to start. Ask a simple question, open a single stage, or
              let the Navigator suggest the next step—there is no “wrong” way to move through this process. You can speak to the assistant
              as you would to a trusted fitter: share your habits, doubts, even the way you hope the gun will make you feel on the stand.
              Take a few minutes or a few evenings; step away and return when you’re ready. When you’re curious, begin—and let the
              conversation slowly reveal the Perazzi that feels like it was waiting for you.
            </Text>
            <Text muted>(NOTE: This immersive experience is best done on a computer, and not a mobile device.)</Text>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Conversation */}
        <section
          id="concierge-conversation"
          className="flex min-h-[70vh] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-6 lg:order-2"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                Conversation
              </Text>
              <Text muted>Context carries across each message.</Text>
            </div>
            <div className="flex items-center gap-3">
              {pending || isTyping ? (
                <div className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-ink-muted">
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-border/70 border-t-transparent" />
                    <span className="inline-flex h-2 w-2 rounded-full bg-ink" />
                  </span>
                  <span>Collecting references…</span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleClearChat}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-3 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted shadow-soft transition hover:border-ink/30 hover:bg-card/80 hover:text-ink focus-ring"
              >
                Clear chat
              </button>
            </div>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            {latestGuardrail && latestGuardrail !== "ok" ? (
              <div className="mb-3">
                <GuardrailNotice status={latestGuardrail} />
              </div>
            ) : null}
            <ConversationView messages={messages} pending={pending} isTyping={isTyping} />
          </div>
          <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
            {error ? (
              <Text className="text-red-600">
                Something went wrong reaching the concierge. Please try again.
              </Text>
            ) : null}
            <label
              htmlFor="concierge-question"
              className="block text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
            >
              Ask the workshop
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                id="concierge-question"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about platforms, fitting, service, or heritage…"
                className="min-h-[96px] flex-1 rounded-2xl border border-border bg-card/70 px-3 py-2 text-sm sm:text-base text-ink shadow-soft backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                disabled={pending}
              />
              <button
                type="button"
                onClick={handleSend}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-2xl bg-brand px-4 py-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-card shadow-soft ring-1 ring-black/10 transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
                disabled={pending || !draft.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </section>

        {/* Build Navigator */}
        <aside
          id="concierge-navigator"
          className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:rounded-3xl sm:bg-card/80 sm:p-6 lg:order-1"
          tabIndex={-1}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                Build navigator
              </Text>
              <button
                type="button"
                className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted transition hover:text-ink focus-ring"
                onClick={resetBuild}
              >
                Reset
              </button>
            </div>
            {buildError ? (
              <Text size="sm" className="text-red-600" leading="normal">
                {buildError}
              </Text>
            ) : null}

            <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-3 shadow-soft backdrop-blur-sm">
              <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                Current Build Category
              </Text>
              <Text className="text-ink" leading="normal">
                {nextField ? nextField.section || "Unknown" : "Complete"}
              </Text>
            </div>

            <div className="space-y-2 rounded-2xl border border-border/70 bg-card/60 px-3 py-3 shadow-soft backdrop-blur-sm">
              <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                Current step
              </Text>
              {nextField ? (
                <>
                  <Text className="font-semibold text-ink" leading="normal">
                    {getFieldLabel(nextField.id)}
                  </Text>
                  {FIELD_DESCRIPTIONS[nextField.id] ? (
                    <Text muted>{FIELD_DESCRIPTIONS[nextField.id]}</Text>
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
                                "w-full rounded-xl border bg-card/60 px-3 py-2 text-left text-sm font-semibold shadow-soft transition",
                                isHighlighted
                                  ? "border-ink/40 bg-card/85 text-ink"
                                  : "border-border/70 text-ink-muted hover:border-ink/30 hover:bg-card/80 hover:text-ink",
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
                        className="mt-2 inline-flex w-full min-h-10 items-center justify-center rounded-full bg-brand px-3 py-2 text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-card transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
                        disabled={!highlightedOption || highlightedOption.fieldId !== nextField.id}
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDetailsDrawerOpen(true);
                        }}
                        className="mt-2 inline-flex w-full min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-3 py-2 text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted shadow-soft transition hover:border-ink/30 hover:bg-card/80 hover:text-ink"
                      >
                        {infoLoading ? "Loading details…" : "View More Details"}
                      </button>
                      <button
                        type="button"
                        onClick={handleExplainCurrent}
                        className="mt-2 inline-flex w-full min-h-10 items-center justify-center rounded-full border border-border/70 bg-card/60 px-3 py-2 text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted shadow-soft transition hover:border-ink/30 hover:bg-card/80 hover:text-ink"
                      >
                        Explain these options
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      {engravingStatusMessage ?? (
                        <Text muted>
                          No valid options available based on current selections.
                        </Text>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Text muted>All steps completed.</Text>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 px-3 py-3 shadow-soft backdrop-blur-sm">
              <button
                type="button"
                onClick={() => {
                  setBuildSheetDrawerOpen(true);
                }}
                className="w-full rounded-full border border-perazzi-red bg-perazzi-red px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-ink hover:text-card"
              >
                View Build Sheet
              </button>
              <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 px-3 py-3 shadow-soft backdrop-blur-sm">
                <Text size="xs" className="tracking-[0.2em] text-ink-muted" leading="normal">
                  Next step
                </Text>
                {nextStepContent}
              </div>
            </div>
          </div>
        </aside>


      </div>
      {selectedInfoCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-elevated ring-1 ring-border/70 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setSelectedInfoCard(null);
              }}
              className="absolute right-4 top-4 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted shadow-soft transition hover:border-ink/30 hover:bg-card/85 hover:text-ink"
            >
              Close
            </button>
            <div className="flex-1 space-y-4 overflow-y-auto p-6 pr-5">
              {selectedInfoCard.imageUrl ? (
                <Image
                  src={selectedInfoCard.fullImageUrl ?? selectedInfoCard.imageUrl}
                  alt={selectedInfoCard.title}
                  width={1600}
                  height={1000}
                  className="w-full rounded-2xl object-cover"
                />
              ) : null}
              <div className="space-y-2">
                <Heading level={3} size="lg" className="text-ink">
                  {selectedInfoCard.title}
                </Heading>
                {selectedInfoCard.description ? (
                  <Text muted className="whitespace-pre-line">
                    {selectedInfoCard.description}
                  </Text>
                ) : null}
                <div className="grid gap-2">
                  {selectedInfoCard.platform ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Platform:</span> {selectedInfoCard.platform}
                      </p>
                    </Text>
                  ) : null}
                  {selectedInfoCard.grade ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Grade:</span> {selectedInfoCard.grade}
                      </p>
                    </Text>
                  ) : null}
                  {selectedInfoCard.gauges?.length ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Gauges:</span> {selectedInfoCard.gauges.join(", ")}
                      </p>
                    </Text>
                  ) : null}
                  {selectedInfoCard.triggerTypes?.length ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Trigger types:</span> {selectedInfoCard.triggerTypes.join(", ")}
                      </p>
                    </Text>
                  ) : null}
                  {selectedInfoCard.recommendedPlatforms?.length ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Recommended platforms:</span>{" "}
                        {selectedInfoCard.recommendedPlatforms.join(", ")}
                      </p>
                    </Text>
                  ) : null}
                  {selectedInfoCard.popularModels?.length ? (
                    <Text asChild className="text-ink" leading="normal">
                      <p>
                        <span className="font-semibold">Popular models:</span> {selectedInfoCard.popularModels.join(", ")}
                      </p>
                    </Text>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {detailsDrawerOpen && (
        <SanityDetailsDrawer
          open={detailsDrawerOpen}
          cards={infoCards}
          selectedCard={selectedInfoCard}
          loading={infoLoading}
          error={infoError}
          onSelect={(card) => setSelectedInfoCard(card)}
          onClose={() => setDetailsDrawerOpen(false)}
        />
      )}
      {buildSheetDrawerOpen && (
        <BuildSheetDrawer
          open={buildSheetDrawerOpen}
          entries={fieldOrder
            .filter((fid) => isSafeFieldId(fid) && buildState[fid])
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
          onSave={handleSaveBuild}
          savedBuilds={savedBuilds}
          onLoadSaved={handleLoadSaved}
          onDeleteSaved={handleDeleteSaved}
        />
      )}
    </div>
  );
}
