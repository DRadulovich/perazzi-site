"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { DeepPartial, ExpandableMotionSpec } from "../expandable-section-motion";

type SectionControls = {
  close: () => void;
  isOpen: () => boolean;
};

export type ExpandableSectionControllerValue = {
  register: (id: string, controls: SectionControls) => void;
  unregister: (id: string) => void;
  requestOpen: (id: string) => void;
  notifyClose: (id: string) => void;
  singleOpen: boolean;
  routeSpecOverride?: DeepPartial<ExpandableMotionSpec>;
};

const ExpandableSectionControllerContext = createContext<ExpandableSectionControllerValue | null>(null);

type ExpandableSectionControllerProviderProps = {
  children: ReactNode;
  singleOpen?: boolean;
  routeSpecOverride?: DeepPartial<ExpandableMotionSpec>;
};

export function ExpandableSectionControllerProvider({
  children,
  singleOpen = true,
  routeSpecOverride,
}: Readonly<ExpandableSectionControllerProviderProps>) {
  const registryRef = useRef(new Map<string, SectionControls>());
  const currentOpenRef = useRef<string | null>(null);

  const register = useCallback((id: string, controls: SectionControls) => {
    registryRef.current.set(id, controls);
  }, []);

  const unregister = useCallback((id: string) => {
    registryRef.current.delete(id);
    if (currentOpenRef.current === id) {
      currentOpenRef.current = null;
    }
  }, []);

  const requestOpen = useCallback((id: string) => {
    if (!singleOpen) {
      currentOpenRef.current = id;
      return;
    }
    const current = currentOpenRef.current;
    if (current && current !== id) {
      registryRef.current.get(current)?.close();
    }
    currentOpenRef.current = id;
  }, [singleOpen]);

  const notifyClose = useCallback((id: string) => {
    if (currentOpenRef.current === id) {
      currentOpenRef.current = null;
    }
  }, []);

  const value = useMemo<ExpandableSectionControllerValue>(() => ({
    register,
    unregister,
    requestOpen,
    notifyClose,
    singleOpen,
    routeSpecOverride,
  }), [notifyClose, register, requestOpen, routeSpecOverride, singleOpen, unregister]);

  return (
    <ExpandableSectionControllerContext.Provider value={value}>
      {children}
    </ExpandableSectionControllerContext.Provider>
  );
}

export function useExpandableSectionController() {
  return useContext(ExpandableSectionControllerContext);
}
