"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ChoreoPresenceState } from "@/lib/choreo";

import type { ModelDetail } from "./DisciplineRailData";

type UseDisciplineModelDetailsOptions = {
  modalExitMs: number;
};

const fetchModelDetails = async (
  modelId: string,
  controller: AbortController,
) => {
  const safeModelId = encodeURIComponent(modelId);
  const response = await fetch(`/api/models/${safeModelId}`, { signal: controller.signal });
  if (!response.ok) {
    throw new Error("Unable to load model details.");
  }
  return (await response.json()) as ModelDetail;
};

export function useDisciplineModelDetails({
  modalExitMs,
}: UseDisciplineModelDetailsOptions) {
  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalPresence, setModalPresence] = useState<ChoreoPresenceState>("enter");
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const modelRequestRef = useRef<AbortController | null>(null);
  const modalTimeoutRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(null);

  const clearModalTimeout = useCallback(() => {
    if (!modalTimeoutRef.current) return;
    globalThis.clearTimeout(modalTimeoutRef.current);
    modalTimeoutRef.current = null;
  }, []);

  const finalizeRequest = (controller: AbortController) => {
    if (modelRequestRef.current !== controller) return;
    setModelLoadingId(null);
    modelRequestRef.current = null;
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    setModalRoot(document.body);
  }, []);

  const handleModelSelect = async (modelId: string) => {
    if (!modelId) return;
    modelRequestRef.current?.abort();
    const controller = new AbortController();
    modelRequestRef.current = controller;
    setModelLoadingId(modelId);
    setModelError(null);

    try {
      const data = await fetchModelDetails(modelId, controller);
      if (controller.signal.aborted) return;
      setSelectedModel(data);
      setIsModalVisible(true);
      setModalPresence("enter");
      clearModalTimeout();
    } catch (error) {
      if (controller.signal.aborted) return;
      setModelError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      finalizeRequest(controller);
    }
  };

  const requestModalClose = useCallback(() => {
    if (!isModalVisible) return;
    clearModalTimeout();
    if (modalExitMs === 0) {
      setIsModalVisible(false);
      return;
    }
    setModalPresence("exit");
    modalTimeoutRef.current = globalThis.setTimeout(() => {
      setIsModalVisible(false);
      modalTimeoutRef.current = null;
    }, modalExitMs);
  }, [clearModalTimeout, isModalVisible, modalExitMs]);

  useEffect(() => {
    if (!isModalVisible) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestModalClose();
    };
    if (typeof globalThis.addEventListener !== "function" || typeof globalThis.removeEventListener !== "function") {
      return;
    }
    globalThis.addEventListener("keydown", handleKey);
    return () => {
      globalThis.removeEventListener("keydown", handleKey);
    };
  }, [isModalVisible, requestModalClose]);

  useEffect(() => {
    if (!isModalVisible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalVisible]);

  useEffect(() => (
    () => {
      clearModalTimeout();
    }
  ), [clearModalTimeout]);

  return {
    selectedModel,
    isModalVisible,
    modalPresence,
    modelLoadingId,
    modelError,
    modalRoot,
    handleModelSelect,
    requestModalClose,
  };
}
