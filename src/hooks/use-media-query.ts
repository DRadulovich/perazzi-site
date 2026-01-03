"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (globalThis.window === undefined) return false;
    return globalThis.window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const mediaQuery = globalThis.window.matchMedia(query);
    const updateMatch = () => { setMatches(mediaQuery.matches); };

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => { mediaQuery.removeEventListener("change", updateMatch); };
  }, [query]);

  return matches;
}
