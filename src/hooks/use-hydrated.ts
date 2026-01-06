"use client";

import { useSyncExternalStore } from "react";

let hydrated = false;
const listeners = new Set<() => void>();

const getSnapshot = () => hydrated;
const getServerSnapshot = () => false;

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const scheduleNotify = () => {
  if (typeof globalThis.queueMicrotask === "function") {
    globalThis.queueMicrotask(notifyListeners);
    return;
  }
  globalThis.setTimeout(notifyListeners, 0);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  if (!hydrated) {
    hydrated = true;
    scheduleNotify();
  }

  return () => {
    listeners.delete(listener);
  };
};

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
